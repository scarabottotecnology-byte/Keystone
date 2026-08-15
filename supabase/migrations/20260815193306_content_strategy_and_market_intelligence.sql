-- FASE 4 · subtarefas 1–2 — Content Strategy + Market Intelligence: schema.
--
-- Fonte da verdade: docs/02-MODELO-DE-DADOS.md §4.3 (Content) e §4.9 (AI
-- Core, para ai_insights). Mesma regra de sempre (docs/07 §2): nenhuma
-- tabela é criada antes da própria política de RLS.
--
-- ── Duas referências futuras, resolvidas sem tabela fantasma ────────────────
--
-- O schema documentado tem duas colunas que apontam para tabelas de fases
-- futuras: `content_pillars.methodology_id` (→ `brand_services`, FASE 5) e
-- `content_calendar.asset_id` (→ `content_assets`, FASE 5). Criar a FK contra
-- uma tabela inexistente não é possível — a coluna nasce sem a restrição, e a
-- FASE 5 acrescenta o `foreign key` quando a tabela do outro lado existir.
-- Documentado em cada coluna, não escondido.
--
-- ── app.is_org_operator() ────────────────────────────────────────────────────
-- Estratégia editorial é trabalho operacional do dia a dia, não administração
-- de organização — `owner`/`admin` cuidam de quem tem acesso e como a conta
-- funciona; `operator` cuida do conteúdo em si. Daqui em diante, toda tabela
-- de domínio de negócio (conteúdo, e as que vierem depois) usa este helper
-- para INSERT/UPDATE/DELETE, reservando `app.is_org_admin` para configuração
-- de organização de verdade.
create or replace function app.is_org_operator(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select exists (
    select 1
      from public.memberships
     where organization_id = target_org
       and user_id = auth.uid()
       and status = 'active'
       and role in ('owner', 'admin', 'operator')
  )
$$;

revoke all on function app.is_org_operator(uuid) from public;
grant execute on function app.is_org_operator(uuid) to authenticated;

-- ── market_intelligence_sources ──────────────────────────────────────────────
-- Não nomeada no documento 12 (que só lista as tabelas de conteúdo e
-- `ai_insights`), mas exigida pelo próprio A1: "analisa fontes configuradas
-- e autorizadas... não 'a internet'" (docs/05 §4). Sem uma tabela de fontes,
-- essa frase não tem onde se apoiar — o agente teria que inventar de onde
-- ler, e "fonte inventada" é o oposto do que a seção existe para garantir.
create table market_intelligence_sources (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  url             text not null,
  source_type     text not null,   -- rss | publication | economic_indicator
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table market_intelligence_sources enable row level security;
alter table market_intelligence_sources force row level security;

create policy tenant_select on market_intelligence_sources for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on market_intelligence_sources for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on market_intelligence_sources for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on market_intelligence_sources for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── ai_insights ───────────────────────────────────────────────────────────────
-- `source_url` é `not null` aqui — o documento 02 o modelou como opcional,
-- mas o documento 05 §4 e o critério de aceite da FASE 4 ("A1 gera insights
-- com source e source_url preenchidos"; "insight sem fonte rastreável é
-- rejeitado") são explícitos que os dois são obrigatórios. Divergência entre
-- os dois documentos registrada e corrigida aqui a favor da regra mais
-- forte — rastreabilidade não é opcional para o que motivou esta tabela.
create table ai_insights (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations (id) on delete cascade,
  type                 text not null,
  title                text not null,
  description          text not null,
  source               text not null,
  source_url           text not null,
  observed_at          timestamptz not null,
  relevance            int check (relevance between 0 and 100),
  category             text,
  commercial_potential int check (commercial_potential between 0 and 100),
  recommendation       text,
  status               text not null default 'new',
  ai_invocation_id     uuid references ai_invocations (id),
  created_at           timestamptz not null default now()
);
create index on ai_insights (organization_id, created_at desc);

alter table ai_insights enable row level security;
alter table ai_insights force row level security;

create policy tenant_select on ai_insights for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- admin, não operator: só automação (A1, via service_role) e um admin
-- excepcionalmente escrevem aqui. Um `operator_insert` deixaria qualquer
-- membro inserir "insight" sem passar pela validação de fonte do
-- `ai-gateway` — a mesma fonte de verdade que a subtarefa 12 testa.
create policy admin_insert on ai_insights for insert to authenticated
  with check (app.is_org_admin(organization_id));

-- Update é operacional (mudar `status` ao agir sobre o insight, ex.: ao gerar
-- uma ideia a partir dele) — isso sim é trabalho de operador.
create policy operator_update on ai_insights for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create type content_status as enum
  ('draft', 'review', 'approved', 'scheduled', 'published', 'failed', 'cancelled');
create type social_channel as enum
  ('linkedin', 'instagram', 'facebook', 'youtube', 'tiktok', 'x', 'blog');

-- ── content_pillars ───────────────────────────────────────────────────────────
create table content_pillars (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  slug            text not null,
  description     text,
  -- Sem FK ainda: `brand_services` nasce na FASE 5. Ver nota no topo do arquivo.
  methodology_id  uuid,
  weight          numeric(5, 2) not null default 1,
  is_active       boolean not null default true,
  unique (organization_id, slug)
);

alter table content_pillars enable row level security;
alter table content_pillars force row level security;

create policy tenant_select on content_pillars for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_pillars for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_pillars for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_pillars for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── content_topics ────────────────────────────────────────────────────────────
create table content_topics (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  pillar_id       uuid not null references content_pillars (id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'active'
);

alter table content_topics enable row level security;
alter table content_topics force row level security;

create policy tenant_select on content_topics for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_topics for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_topics for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_topics for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── content_formats ───────────────────────────────────────────────────────────
create table content_formats (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  key             text not null,
  channel         social_channel not null,
  spec            jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  unique (organization_id, key, channel)
);

alter table content_formats enable row level security;
alter table content_formats force row level security;

create policy tenant_select on content_formats for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_formats for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_formats for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_formats for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── content_ideas ─────────────────────────────────────────────────────────────
create table content_ideas (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations (id) on delete cascade,
  topic_id          uuid references content_topics (id) on delete set null,
  pillar_id         uuid references content_pillars (id) on delete set null,
  source_insight_id uuid references ai_insights (id) on delete set null,
  title             text not null,
  angle             text,
  hook              text,
  rationale         text,
  intent            text,
  status            content_status not null default 'draft',
  ai_generated      boolean not null default false,
  score             int,
  created_by        uuid references auth.users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table content_ideas enable row level security;
alter table content_ideas force row level security;

create trigger set_updated_at
  before update on content_ideas
  for each row execute function app.set_updated_at();

create policy tenant_select on content_ideas for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_ideas for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_ideas for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_ideas for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── content_calendar_rules ───────────────────────────────────────────────────
-- Antes de `content_calendar` de propósito, na ordem inversa da apresentação
-- no documento 02: `content_calendar.rule_id` referencia esta tabela, e
-- Postgres não aceita FK para tabela que ainda não existe.
create table content_calendar_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  weekday         int not null check (weekday between 0 and 6),
  slot_time       time not null,
  channel         social_channel not null,
  pillar_id       uuid references content_pillars (id) on delete set null,
  format_id       uuid references content_formats (id) on delete set null,
  intent          text,
  is_active       boolean not null default true
);

alter table content_calendar_rules enable row level security;
alter table content_calendar_rules force row level security;

create policy tenant_select on content_calendar_rules for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_calendar_rules for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_calendar_rules for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_calendar_rules for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── content_calendar ──────────────────────────────────────────────────────────
create table content_calendar (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  -- Sem FK ainda: `content_assets` nasce na FASE 5. Ver nota no topo do arquivo.
  asset_id        uuid,
  channel         social_channel not null,
  scheduled_for   timestamptz not null,
  status          content_status not null default 'scheduled',
  rule_id         uuid references content_calendar_rules (id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, channel, scheduled_for)
);
create index on content_calendar (organization_id, scheduled_for);

alter table content_calendar enable row level security;
alter table content_calendar force row level security;

create trigger set_updated_at
  before update on content_calendar
  for each row execute function app.set_updated_at();

create policy tenant_select on content_calendar for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_calendar for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_calendar for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_calendar for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── content_campaigns ─────────────────────────────────────────────────────────
create table content_campaigns (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  objective       text,
  start_at        timestamptz,
  end_at          timestamptz,
  budget          numeric(18, 2),
  status          text not null default 'planned',
  created_at      timestamptz not null default now()
);

alter table content_campaigns enable row level security;
alter table content_campaigns force row level security;

create policy tenant_select on content_campaigns for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_campaigns for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_campaigns for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_campaigns for delete to authenticated
  using (app.is_org_operator(organization_id));
