-- Dois defeitos encontrados ao exercitar a ponte contra o banco de verdade.
-- Nenhum dos dois aparecia no `create function`: os dois só surgem em
-- execução, que é exatamente por que rodar valia mais que reler o código.
--
-- ## 1. Referência ambígua em `enqueue_due_publications` (42702)
--
-- A função declara `returns table (calendar_id uuid, ...)`. Esse parâmetro de
-- saída é uma variável PL/pgSQL, e dentro do `insert ... on conflict
-- (calendar_id) where calendar_id is not null` ela colidia com a coluna
-- `publishing_jobs.calendar_id`. O Postgres não escolhe: recusa.
--
-- Efeito real: a função criava sem reclamar e explodia ao processar o
-- primeiro item. Como quem a chama é o cron, isso seria uma falha a cada 15
-- minutos, visível só em `cron.job_run_details` — o tipo de erro que fica
-- meses sem ninguém notar.
--
-- Correção: o parâmetro de saída passa a se chamar `calendar_item_id`, e o
-- INSERT ganha o alias `pj` para o `returning` também ficar sem ambiguidade.
--
-- ## 2. `schedule_asset_publication` vazava erro cru do Postgres
--
-- `content_calendar` tem `unique (organization_id, channel, scheduled_for)` —
-- um item por canal por instante. Agendar duas peças no mesmo canal e horário
-- devolvia à tela o texto bruto da violação de constraint, com nome de índice
-- e tudo. Agora devolve uma frase que diz o que fazer.

drop function if exists public.enqueue_due_publications(uuid, int);

create or replace function public.enqueue_due_publications(
  p_organization_id uuid,
  p_horizon_minutes int default 60
) returns table (
  calendar_item_id uuid,
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
    v_account_id := null;

    select ca.status into v_asset_status
      from content_assets ca
     where ca.id = item.asset_id
       and ca.organization_id = p_organization_id;

    if v_asset_status is null then
      v_reason := 'A peça deste item do calendário não existe mais';
    elsif v_asset_status <> 'approved' then
      -- Deliberadamente não é erro: a peça pode ser aprovada antes do
      -- horário. O item segue no calendário e a próxima varredura reavalia.
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

      calendar_item_id := item.id;
      job_id := null;
      outcome := 'skipped';
      reason := v_reason;
      return next;
      continue;
    end if;

    insert into publishing_jobs as pj (
      organization_id, calendar_id, asset_id, social_account_id, run_at
    ) values (
      p_organization_id, item.id, item.asset_id, v_account_id,
      item.scheduled_for
    )
    on conflict (calendar_id) where calendar_id is not null do nothing
    returning pj.id into v_job_id;

    update content_calendar
       set enqueued_at = now(), enqueue_error = null
     where id = item.id;

    calendar_item_id := item.id;
    job_id := v_job_id;
    outcome := case
      when v_job_id is null then 'already_queued' else 'queued'
    end;
    reason := null;
    return next;
  end loop;
end;
$fn$;

revoke all on function public.enqueue_due_publications(uuid, int) from public;
revoke execute on function public.enqueue_due_publications(uuid, int) from anon;
revoke execute on function public.enqueue_due_publications(uuid, int)
  from authenticated;

comment on function public.enqueue_due_publications(uuid, int) is
  'Varre o calendário e transforma em publishing_jobs o que já venceu. Item que não pode ser enfileirado grava o motivo em content_calendar.enqueue_error em vez de sumir.';

-- ---------------------------------------------------------------------------

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

  -- A RLS de content_assets já filtra: peça de outra organização não é
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

exception
  -- `unique (organization_id, channel, scheduled_for)`: um item por canal por
  -- instante. Sem este bloco, a tela recebia o texto cru da violação, com
  -- nome de índice — inútil para quem só quer saber que precisa escolher
  -- outro horário.
  when unique_violation then
    raise exception
      'Já existe uma publicação agendada neste canal para este horário — escolha outro horário'
      using errcode = 'unique_violation';
end;
$fn$;

revoke all on function public.schedule_asset_publication(uuid, timestamptz, text)
  from public;
revoke execute on function public.schedule_asset_publication(uuid, timestamptz, text)
  from anon;
grant execute on function public.schedule_asset_publication(uuid, timestamptz, text)
  to authenticated;
