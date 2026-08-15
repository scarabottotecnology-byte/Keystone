-- FASE 3 · subtarefas 1–4 — Command Center: Growth Score e RPCs.
--
-- Fonte da verdade: docs/06-FLUXO-DE-DADOS.md §5, docs/12-DETALHAMENTO-FASES.md.
--
-- Mesma regra da migração anterior (docs/07 §2): nenhuma tabela é criada
-- antes da própria política de RLS.
--
-- ── Nota de projeto que governa esta migração inteira ───────────────────────
--
-- Os seis componentes do Growth Score (Content, Leads, Prospecting, Pipeline,
-- Conversion, Revenue) dependem de tabelas que ainda não existem — conteúdo
-- nasce na FASE 4/5, leads na 10, prospecção na 12, pipeline/conversão/receita
-- na 17. `rpc_command_center()` por isso devolve os seis componentes como
-- indisponíveis: não é bug, é o estado correto até cada fase dona construir a
-- própria subconsulta. O contrato de retorno não muda depois — só o corpo da
-- função cresce, uma subconsulta por vez.

-- ── growth_score_config ──────────────────────────────────────────────────────
-- Uma linha por organização. Peso e meta por componente, editável por
-- owner/admin. Os pesos padrão são os do documento 06 §5 e somam 100 — mas o
-- schema não força a soma, porque a soma é regra de produto, não de dado.
create table growth_score_config (
  organization_id   uuid primary key references organizations (id) on delete cascade,
  content_weight     numeric not null default 15,
  content_target     numeric,
  leads_weight       numeric not null default 15,
  leads_target       numeric,
  prospecting_weight numeric not null default 15,
  prospecting_target numeric,
  pipeline_weight    numeric not null default 20,
  pipeline_target    numeric,
  conversion_weight  numeric not null default 15,
  conversion_target  numeric,
  revenue_weight     numeric not null default 20,
  revenue_target     numeric,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table growth_score_config enable row level security;
alter table growth_score_config force row level security;

create trigger set_updated_at
  before update on growth_score_config
  for each row execute function app.set_updated_at();

create policy tenant_select on growth_score_config for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_update on growth_score_config for update to authenticated
  using      (app.is_org_admin(organization_id))
  with check (app.is_org_admin(organization_id));

-- Sem INSERT/DELETE via cliente: a linha nasce com a organização (abaixo, para
-- a Keystone) — não há tela de "criar organização" para precisar criar a
-- própria linha de configuração junto (ADR-014).

-- ── growth_score_snapshots ───────────────────────────────────────────────────
-- Snapshot diário. Um score isolado não informa nada — o que informa é a
-- tendência (documento 06 §5) —, e tendência exige histórico armazenado, não
-- recalculado a cada carregamento.
--
-- `components` guarda o valor bruto e o normalizado por componente, mais a
-- disponibilidade — a mesma estrutura que `rpc_command_center()` devolve. Não
-- vira seis colunas por dobrar (bruto + normalizado) de seis componentes:
-- jsonb é o mesmo padrão já usado em `audit_log.before`/`after`.
create table growth_score_snapshots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  snapshot_date   date not null,
  -- null, nunca zero, enquanto nem todo componente tiver dado — ver
  -- growthScore.ts. Zero seria uma nota real; null é "ainda não é possível
  -- calcular".
  total_score     numeric,
  components      jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (organization_id, snapshot_date)
);
create index on growth_score_snapshots (organization_id, snapshot_date desc);

alter table growth_score_snapshots enable row level security;
alter table growth_score_snapshots force row level security;

create policy tenant_select on growth_score_snapshots for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on growth_score_snapshots for insert to authenticated
  with check (app.is_org_admin(organization_id));

-- Sem UPDATE nem DELETE, de propósito, mesmo raciocínio do `audit_log`: é
-- registro histórico. Não existe automação escrevendo aqui ainda nesta fase
-- — a política existe para quando ela existir (FASE 20 ou antes, quando o
-- primeiro componente ganhar dado real), não é usada hoje.

-- ── Bootstrap: configuração padrão da Keystone ──────────────────────────────
insert into growth_score_config (organization_id)
select id from organizations where slug = 'keystone'
on conflict (organization_id) do nothing;

-- ── rpc_command_center() ─────────────────────────────────────────────────────
--
-- SECURITY INVOKER, não DEFINER: a função roda com o privilégio de quem
-- chama, então a RLS de `growth_score_config`/`growth_score_snapshots`
-- continua valendo dentro dela. Uma agregação SECURITY DEFINER ignoraria a
-- RLS e vazaria dado entre organizações — é a mesma classe de falha do achado
-- C-01, com outro nome (documento 12, FASE 2, subtarefa 6).
--
-- STABLE pela mesma razão de `app.current_org_ids()`: o planejador avalia uma
-- vez por statement.
--
-- Devolve um objeto único porque o critério de aceite da fase é "uma única
-- chamada RPC; nenhuma agregação no cliente" — o Command Center faz uma
-- requisição de rede, não seis.
create or replace function rpc_command_center()
returns jsonb
language plpgsql
security invoker
stable
set search_path = public, app
as $$
declare
  org_id   uuid;
  config   growth_score_config%rowtype;
  latest   growth_score_snapshots%rowtype;
  previous growth_score_snapshots%rowtype;
begin
  select m.organization_id into org_id
    from memberships m
   where m.user_id = auth.uid()
     and m.status = 'active'
   limit 1;

  if org_id is null then
    raise exception using errcode = '42501', message = 'sem vínculo ativo com organização';
  end if;

  select * into config from growth_score_config where organization_id = org_id;

  select * into latest from growth_score_snapshots
   where organization_id = org_id
   order by snapshot_date desc
   limit 1;

  select * into previous from growth_score_snapshots
   where organization_id = org_id
     and snapshot_date < coalesce(latest.snapshot_date, current_date)
   order by snapshot_date desc
   limit 1;

  return jsonb_build_object(
    'organization_id', org_id,
    'generated_at', now(),
    'growth_score', jsonb_build_object(
      'weights', jsonb_build_object(
        'content', config.content_weight,
        'leads', config.leads_weight,
        'prospecting', config.prospecting_weight,
        'pipeline', config.pipeline_weight,
        'conversion', config.conversion_weight,
        'revenue', config.revenue_weight
      ),
      'targets', jsonb_build_object(
        'content', config.content_target,
        'leads', config.leads_target,
        'prospecting', config.prospecting_target,
        'pipeline', config.pipeline_target,
        'conversion', config.conversion_target,
        'revenue', config.revenue_target
      ),
      -- Todo componente chega null: nenhuma tabela de origem existe ainda.
      -- Ver a nota de projeto no topo deste arquivo.
      'raw', jsonb_build_object(
        'content', null,
        'leads', null,
        'prospecting', null,
        'pipeline', null,
        'conversion', null,
        'revenue', null
      ),
      'latest_snapshot', case when latest.id is null then null else jsonb_build_object(
        'snapshot_date', latest.snapshot_date,
        'total_score', latest.total_score,
        'components', latest.components
      ) end,
      'previous_snapshot', case when previous.id is null then null else jsonb_build_object(
        'snapshot_date', previous.snapshot_date,
        'total_score', previous.total_score,
        'components', previous.components
      ) end
    ),
    -- Mesma razão do bloco acima: sem tabela de origem (pipeline/receita
    -- nascem na FASE 17), o valor é indisponível, nunca zero fabricado.
    'kpis', jsonb_build_object(
      'pipeline_value', null,
      'pipeline_value_previous_period', null,
      'leads_generated', null,
      'leads_generated_previous_period', null,
      'revenue_closed', null,
      'revenue_closed_previous_period', null
    )
  );
end;
$$;

revoke all on function rpc_command_center() from public;
grant execute on function rpc_command_center() to authenticated;

-- ── rpc_next_best_actions() ──────────────────────────────────────────────────
--
-- Consulta determinística e priorizada sobre estado real (documento 12, FASE
-- 3, subtarefa 4) — a matemática vem do banco, a IA só escreve a justificativa
-- depois (FASE 19). Hoje não há de onde vir ação nenhuma: sem lead, sem
-- prospect, sem pipeline, a única resposta honesta é lista vazia. Cada fase de
-- domínio acrescenta a própria fonte aqui — nunca troca o formato de retorno.
create or replace function rpc_next_best_actions()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  select '[]'::jsonb;
$$;

revoke all on function rpc_next_best_actions() from public;
grant execute on function rpc_next_best_actions() to authenticated;
