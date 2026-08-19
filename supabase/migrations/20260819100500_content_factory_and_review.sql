-- FASE 5 · subtarefas 1 (conclusão) — content_assets, content_reviews, e as
-- duas FKs adiadas pela FASE 4 para tabelas que só nasciam nesta fase.
--
-- Fonte da verdade: docs/02-MODELO-DE-DADOS.md §4.3.

-- ── content_assets ────────────────────────────────────────────────────────────
-- ACHADO real desta fase: `grounded_on jsonb` está ausente da definição de
-- `content_assets` em `docs/02-MODELO-DE-DADOS.md §4.3`, apesar de:
--   (a) P7 (`docs/02 §1`) exigir `ai_generated`, `model` e `grounded_on` em
--       toda tabela que guarda o que a IA gerou — `content_assets` já tinha
--       os dois primeiros, faltava o terceiro;
--   (b) o critério de aceite da própria FASE 5 ser explícito: "RAG
--       consultado; afirmação sobre serviço com grounded_on" (docs/09);
--   (c) A3 consultar `app.match_knowledge` exatamente para poder preencher
--       este campo (docs/05 §3, "chunks usados ficam registrados em
--       grounded_on do registro gerado").
-- Sem a coluna, a regra de fundamentação do RAG (nunca afirmar sobre serviço
-- sem lastro) não teria onde gravar a prova. Corrigido aqui e no documento.
create table content_assets (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  idea_id         uuid references content_ideas (id) on delete set null,
  campaign_id     uuid references content_campaigns (id) on delete set null,
  format_id       uuid references content_formats (id),
  channel         social_channel not null,
  headline        text,
  hook            text,
  body            text,
  cta             text,
  hashtags        text[] not null default '{}',
  media           jsonb not null default '[]'::jsonb,
  visual_brief    text,
  grounded_on     jsonb not null default '[]'::jsonb,
  variant_of      uuid references content_assets (id) on delete set null,
  version         int not null default 1,
  status          content_status not null default 'draft',
  ai_generated    boolean not null default false,
  model           text,
  approved_by     uuid references auth.users (id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on content_assets (organization_id, status, channel);

alter table content_assets enable row level security;
alter table content_assets force row level security;

create trigger set_updated_at
  before update on content_assets
  for each row execute function app.set_updated_at();

create policy tenant_select on content_assets for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on content_assets for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on content_assets for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on content_assets for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── content_reviews ───────────────────────────────────────────────────────────
-- Imutável por desenho, mesmo raciocínio de `audit_log`: uma revisão é um
-- registro histórico do que o revisor (IA ou humano) avaliou naquele
-- momento — corrigir a nota é gerar uma revisão nova, não editar a antiga.
-- Por isso não há política de UPDATE nem DELETE, só SELECT e INSERT.
create table content_reviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  asset_id        uuid not null references content_assets (id) on delete cascade,
  score           int not null check (score between 0 and 100),
  dimensions      jsonb not null,
  issues          jsonb not null default '[]'::jsonb,
  suggestions     text,
  reviewer_type   text not null default 'ai',
  reviewer_id     uuid references auth.users (id),
  model           text,
  created_at      timestamptz not null default now()
);
create index on content_reviews (organization_id, asset_id, created_at desc);

alter table content_reviews enable row level security;
alter table content_reviews force row level security;

create policy tenant_select on content_reviews for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- Humano pode registrar revisão manual (`reviewer_type = 'human'`); A4 grava
-- via `service_role`, que ignora esta política como sempre.
create policy operator_insert on content_reviews for insert to authenticated
  with check (app.is_org_operator(organization_id));

-- ── FKs adiadas pela FASE 4 ───────────────────────────────────────────────────
-- As duas colunas nasceram sem a restrição porque a tabela do outro lado não
-- existia ainda (comentado no topo da migração
-- `content_strategy_and_market_intelligence.sql`). Ambas as tabelas têm zero
-- linhas com a coluna preenchida até aqui, então não há dado a validar contra
-- a nova constraint.
alter table content_pillars
  add constraint content_pillars_methodology_id_fkey
  foreign key (methodology_id) references brand_services (id) on delete set null;

alter table content_calendar
  add constraint content_calendar_asset_id_fkey
  foreign key (asset_id) references content_assets (id) on delete set null;
