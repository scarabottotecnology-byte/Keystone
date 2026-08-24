-- Ponte entre o calendário editorial e a fila de publicação.
--
-- ## O buraco que esta migração fecha
--
-- A FASE 5 gera a peça, a FASE 4 agenda no calendário e a FASE 6 publica o
-- que está na fila. Entre "agendado no calendário" e "na fila" não havia
-- nada: `publishing_jobs` só recebia linha por INSERT manual. O worker
-- funcionava, o cron rodava, e nunca havia o que publicar — a corrente
-- inteira parava num elo que ninguém tinha construído.
--
-- ## Por que a decisão de conta não é adivinhada
--
-- Enfileirar exige escolher em qual conta publicar. Quando há exatamente
-- uma conta utilizável para o canal, a escolha é óbvia. Quando não há
-- nenhuma, ou quando há mais de uma, qualquer escolha automática seria um
-- palpite — e um palpite aqui publica na página errada de uma consultoria.
-- Nesses casos o item **não** entra na fila e o motivo fica gravado em
-- `content_calendar.enqueue_error`, visível na tela. É o oposto de falhar
-- em silêncio: o item continua no calendário, dizendo por que não saiu.

alter table content_calendar
  add column if not exists enqueued_at timestamptz,
  add column if not exists enqueue_error text;

comment on column content_calendar.enqueued_at is
  'Quando este item virou um publishing_job. Nulo = ainda não enfileirado.';
comment on column content_calendar.enqueue_error is
  'Por que o item ainda não virou job (peça não aprovada, nenhuma conta '
  'conectada, mais de uma conta no canal). Nulo quando enfileirou.';

-- Rede final contra job duplicado para o mesmo item de calendário. Parcial
-- porque `calendar_id` é nulo em job criado fora do calendário (republicação
-- manual, por exemplo), e vários nulos não podem colidir entre si.
create unique index if not exists publishing_jobs_calendar_uniq
  on publishing_jobs (calendar_id)
  where calendar_id is not null;

-- ---------------------------------------------------------------------------
-- enqueue_due_publications — o passo automático, chamado pelo worker
-- ---------------------------------------------------------------------------
--
-- `security invoker` **somado** ao filtro explícito por organização: o
-- chamador é `service_role`, que tem BYPASSRLS, então `invoker` sozinho não
-- isolaria nada. É a mesma correção aplicada em `match_knowledge` na FASE 5.
--
-- `for update skip locked` pela mesma razão de `claim_publishing_job`: dois
-- workers concorrentes não podem enfileirar o mesmo item duas vezes.
create or replace function public.enqueue_due_publications(
  p_organization_id uuid,
  p_horizon_minutes int default 60
) returns table (
  calendar_id uuid,
  job_id uuid,
  outcome text,
  reason text
)
language plpgsql
volatile
security invoker
set search_path = public
as $fn$
declare
  item record;
  v_asset_status content_status;
  v_account_id uuid;
  v_account_count int;
  v_job_id uuid;
  v_reason text;
begin
  if p_organization_id is null then
    raise exception 'enqueue_due_publications exige p_organization_id';
  end if;

  for item in
    select cc.id, cc.asset_id, cc.channel, cc.scheduled_for
      from content_calendar cc
     where cc.organization_id = p_organization_id
       and cc.asset_id is not null
       and cc.status = 'scheduled'
       and cc.enqueued_at is null
       and cc.scheduled_for
             <= now() + make_interval(mins => greatest(p_horizon_minutes, 0))
     order by cc.scheduled_for
     for update skip locked
  loop
    v_reason := null;
    v_job_id := null;

    select ca.status into v_asset_status
      from content_assets ca
     where ca.id = item.asset_id
       and ca.organization_id = p_organization_id;

    if v_asset_status is null then
      v_reason := 'A peça deste item do calendário não existe mais';
    elsif v_asset_status <> 'approved' then
      -- Deliberadamente não é erro: a peça pode estar em revisão e ser
      -- aprovada antes do horário. O item segue no calendário e a próxima
      -- varredura tenta de novo.
      v_reason := format(
        'Peça em status %L — só peça aprovada entra na fila',
        v_asset_status
      );
    end if;

    if v_reason is null then
      select count(*) into v_account_count
        from social_accounts sa
       where sa.organization_id = p_organization_id
         and sa.provider = item.channel
         and sa.status in ('connected', 'expiring');

      if v_account_count = 0 then
        v_reason := format(
          'Nenhuma conta utilizável conectada no canal %L',
          item.channel
        );
      elsif v_account_count > 1 then
        v_reason := format(
          'Mais de uma conta conectada no canal %L — a escolha precisa ser '
          'explícita, adivinhar publicaria na página errada',
          item.channel
        );
      else
        select sa.id into v_account_id
          from social_accounts sa
         where sa.organization_id = p_organization_id
           and sa.provider = item.channel
           and sa.status in ('connected', 'expiring')
         limit 1;
      end if;
    end if;

    if v_reason is not null then
      update content_calendar
         set enqueue_error = v_reason
       where id = item.id;

      calendar_id := item.id;
      job_id := null;
      outcome := 'skipped';
      reason := v_reason;
      return next;
      continue;
    end if;

    insert into publishing_jobs (
      organization_id, calendar_id, asset_id, social_account_id, run_at
    ) values (
      p_organization_id, item.id, item.asset_id, v_account_id,
      item.scheduled_for
    )
    on conflict (calendar_id) where calendar_id is not null do nothing
    returning id into v_job_id;

    update content_calendar
       set enqueued_at = now(), enqueue_error = null
     where id = item.id;

    calendar_id := item.id;
    job_id := v_job_id;
    outcome := case when v_job_id is null then 'already_queued' else 'queued' end;
    reason := null;
    return next;
  end loop;
end;
$fn$;

revoke all on function public.enqueue_due_publications(uuid, int) from public;
revoke execute on function public.enqueue_due_publications(uuid, int) from anon;
-- Também fora do alcance de `authenticated`: varrer o calendário inteiro é
-- trabalho do worker. A tela agenda uma peça por vez, pelo outro caminho.
revoke execute on function public.enqueue_due_publications(uuid, int)
  from authenticated;

comment on function public.enqueue_due_publications(uuid, int) is
  'Varre o calendário e transforma em publishing_jobs o que já venceu. '
  'Item que não pode ser enfileirado grava o motivo em '
  'content_calendar.enqueue_error em vez de sumir.';

-- ---------------------------------------------------------------------------
-- schedule_asset_publication — o passo manual, chamado pela tela
-- ---------------------------------------------------------------------------
--
-- Recebe só a peça e o horário. Organização e canal vêm da própria peça, não
-- do parâmetro: assim o chamador não consegue agendar uma peça de uma
-- organização dentro do calendário de outra, nem por engano nem de propósito.
create or replace function public.schedule_asset_publication(
  p_asset_id uuid,
  p_scheduled_for timestamptz,
  p_notes text default null
) returns uuid
language plpgsql
volatile
security invoker
set search_path = public
as $fn$
declare
  v_org uuid;
  v_channel social_channel;
  v_status content_status;
  v_calendar_id uuid;
begin
  select ca.organization_id, ca.channel, ca.status
    into v_org, v_channel, v_status
    from content_assets ca
   where ca.id = p_asset_id;

  -- A RLS de content_assets já filtra: uma peça de outra organização não é
  -- visível aqui e cai neste mesmo caminho.
  if v_org is null then
    raise exception 'Peça não encontrada' using errcode = 'no_data_found';
  end if;

  if v_status <> 'approved' then
    raise exception
      'Só peça aprovada pode ser agendada (esta está em %)', v_status
      using errcode = 'check_violation';
  end if;

  if p_scheduled_for <= now() then
    raise exception 'O horário de publicação precisa estar no futuro'
      using errcode = 'check_violation';
  end if;

  insert into content_calendar (
    organization_id, asset_id, channel, scheduled_for, status, notes
  ) values (
    v_org, p_asset_id, v_channel, p_scheduled_for, 'scheduled', p_notes
  )
  returning id into v_calendar_id;

  return v_calendar_id;
end;
$fn$;

revoke all on function public.schedule_asset_publication(uuid, timestamptz, text)
  from public;
revoke execute on function public.schedule_asset_publication(uuid, timestamptz, text)
  from anon;
grant execute on function public.schedule_asset_publication(uuid, timestamptz, text)
  to authenticated;

comment on function public.schedule_asset_publication(uuid, timestamptz, text) is
  'Agenda uma peça aprovada no calendário. Organização e canal vêm da peça, '
  'nunca do parâmetro.';
