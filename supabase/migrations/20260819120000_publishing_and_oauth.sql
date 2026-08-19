-- FASE 6 · subtarefas 1, 2 e 5 — publicação em rede social e tokens OAuth.
--
-- Fonte da verdade: docs/02-MODELO-DE-DADOS.md §4.4 e docs/07 §3.

-- ── Schema private: tokens fora do alcance do PostgREST ─────────────────────
-- `social_accounts` é legível pelo frontend (para mostrar "conta conectada,
-- expira em X dias") e por isso não pode conter o segredo — guarda só
-- `token_ref`. O token de fato vive aqui, num schema que o PostgREST não
-- expõe: não há caminho pelo qual um cliente alcance esta tabela, mesmo com
-- JWT válido e mesmo se uma política for escrita errado (docs/07 §3).
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table private.oauth_tokens (
  ref             text primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider        text not null,
  access_token    text not null,
  refresh_token   text,
  expires_at      timestamptz,
  scopes          text[],
  created_at      timestamptz not null default now(),
  rotated_at      timestamptz
);

-- Defesa em profundidade: o schema já é inalcançável, mas RLS forçada sem
-- política nenhuma garante que nem um `grant` acidental futuro abra a tabela.
-- `service_role` (as Edge Functions) e o dono do banco têm BYPASSRLS, então
-- o caminho legítimo continua funcionando.
alter table private.oauth_tokens enable row level security;
alter table private.oauth_tokens force row level security;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type publish_status as enum
  ('pending', 'locked', 'running', 'succeeded', 'failed', 'cancelled', 'skipped');
create type account_status as enum
  ('connected', 'expiring', 'expired', 'revoked', 'error');

-- ── social_accounts ──────────────────────────────────────────────────────────
-- Conectar uma conta é administração de organização (afeta toda publicação da
-- marca e envolve credencial), não trabalho operacional do dia a dia — por
-- isso `app.is_org_admin` para escrita, mesma distinção de `brand_profiles`
-- na FASE 5. Todo membro ativo lê: a saúde da conta é informação de operação.
create table social_accounts (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations (id) on delete cascade,
  provider            social_channel not null,
  external_account_id text not null,
  display_name        text,
  avatar_url          text,
  scopes              text[] not null default '{}',
  status              account_status not null default 'connected',
  token_ref           text not null,
  token_expires_at    timestamptz,
  last_error          text,
  last_synced_at      timestamptz,
  connected_by        uuid references auth.users (id),
  created_at          timestamptz not null default now(),
  unique (organization_id, provider, external_account_id)
);

alter table social_accounts enable row level security;
alter table social_accounts force row level security;

create policy tenant_select on social_accounts for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on social_accounts for insert to authenticated
  with check (app.is_org_admin(organization_id));

create policy admin_update on social_accounts for update to authenticated
  using      (app.is_org_admin(organization_id))
  with check (app.is_org_admin(organization_id));

create policy admin_delete on social_accounts for delete to authenticated
  using (app.is_org_admin(organization_id));

-- ── social_posts ─────────────────────────────────────────────────────────────
-- Registro do que de fato foi publicado. Sem política de escrita para
-- `authenticated`: só `social-publish` (service_role) grava aqui, e um humano
-- inventando uma linha de publicação corromperia a cadeia de atribuição que
-- a FASE 8 vai medir. Mesmo desenho de `ai_invocations` na FASE 4.
--
-- `unique (organization_id, idempotency_key)` é o que torna a publicação
-- idempotente de verdade (invariante I-4): a chave é gravada ANTES da chamada
-- externa, então uma segunda execução do mesmo job colide na constraint em
-- vez de publicar de novo.
create table social_posts (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations (id) on delete cascade,
  asset_id          uuid references content_assets (id) on delete set null,
  social_account_id uuid not null references social_accounts (id) on delete cascade,
  channel           social_channel not null,
  external_post_id  text,
  permalink         text,
  published_at      timestamptz,
  status            content_status not null default 'scheduled',
  error             text,
  idempotency_key   text not null,
  created_at        timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (social_account_id, external_post_id)
);
create index on social_posts (organization_id, created_at desc);

alter table social_posts enable row level security;
alter table social_posts force row level security;

create policy tenant_select on social_posts for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- ── social_post_metrics ──────────────────────────────────────────────────────
-- Snapshot diário em vez de coluna mutável: métrica de rede social cresce ao
-- longo de dias e um UPDATE destruiria a curva. A unicidade por (post, dia)
-- torna a sincronização da FASE 8 naturalmente idempotente.
create table social_post_metrics (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  social_post_id  uuid not null references social_posts (id) on delete cascade,
  collected_for   date not null,
  impressions     bigint,
  reach           bigint,
  likes           bigint,
  comments        bigint,
  shares          bigint,
  saves           bigint,
  clicks          bigint,
  video_views     bigint,
  raw             jsonb,
  collected_at    timestamptz not null default now(),
  unique (social_post_id, collected_for)
);

alter table social_post_metrics enable row level security;
alter table social_post_metrics force row level security;

create policy tenant_select on social_post_metrics for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- ── publishing_jobs ──────────────────────────────────────────────────────────
-- A fila. `locked_at`/`locked_by` implementam lock pessimista — ver
-- `claim_publishing_job` abaixo.
create table publishing_jobs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations (id) on delete cascade,
  calendar_id       uuid references content_calendar (id) on delete cascade,
  asset_id          uuid not null references content_assets (id) on delete cascade,
  social_account_id uuid not null references social_accounts (id) on delete cascade,
  run_at            timestamptz not null,
  attempt           int not null default 0,
  max_attempts      int not null default 5,
  status            publish_status not null default 'pending',
  locked_at         timestamptz,
  locked_by         text,
  correlation_id    text,
  last_error        text,
  created_at        timestamptz not null default now(),
  unique (calendar_id, social_account_id)
);
create index on publishing_jobs (status, run_at)
  where status in ('pending', 'failed');

alter table publishing_jobs enable row level security;
alter table publishing_jobs force row level security;

create policy tenant_select on publishing_jobs for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- Agendar e cancelar é trabalho operacional; o avanço de status durante a
-- execução é do `service_role`, que ignora estas políticas.
create policy operator_insert on publishing_jobs for insert to authenticated
  with check (app.is_org_operator(organization_id));

create policy operator_update on publishing_jobs for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on publishing_jobs for delete to authenticated
  using (app.is_org_operator(organization_id));

-- ── claim_publishing_job ─────────────────────────────────────────────────────
-- Lock pessimista: resolve a duplicação ANTES de a chamada externa acontecer
-- (docs/02 §4.4). Se duas execuções concorrentes do n8n disputarem o mesmo
-- job, apenas uma recebe linha de volta.
--
-- Duas diferenças em relação ao esboço do documento 02
-- (`update … where id = … and status = 'pending' returning *`), ambas
-- deliberadas:
--
--   1. Reivindica "o próximo job vencido", não um `id` específico. A
--      subtarefa 9 descreve o WF-002 perguntando "há job vencido e não
--      travado?" a cada 15 minutos — o worker não sabe um id de antemão.
--   2. `for update skip locked` no subselect. A versão só com
--      `and status = 'pending'` funciona, mas as duas transações concorrentes
--      chegam a disputar a mesma linha e uma bloqueia até a outra terminar.
--      Com `skip locked`, a segunda pula direto para o próximo job disponível
--      em vez de esperar — mesma garantia de exclusão, sem serializar a fila.
--
-- Reivindica também os `failed` que ainda têm tentativa disponível: é o que
-- faz a recuperação de falha ser automática, sem alguém reenfileirar à mão.
--
-- Criada em `public`, não em `app`: o achado da FASE 5 (o PostgREST só expõe
-- `public`, então `app.match_knowledge` era inalcançável por
-- `supabase-js.rpc`) vale aqui igual — `social-publish` chama esta função
-- pelo cliente supabase-js.
create or replace function public.claim_publishing_job(
  p_organization_id uuid,
  p_worker text,
  p_limit int default 1
)
returns setof publishing_jobs
language sql
volatile
security invoker
set search_path = public
as $$
  update publishing_jobs
     set status = 'locked',
         locked_at = now(),
         locked_by = p_worker,
         attempt = attempt + 1
   where id in (
     select id
       from publishing_jobs
      where organization_id = p_organization_id
        and status in ('pending', 'failed')
        and run_at <= now()
        and attempt < max_attempts
      order by run_at
      for update skip locked
      limit greatest(p_limit, 0)
   )
  returning *;
$$;

-- Achado da FASE 3, que vale para toda função nova de `public`: o schema tem
-- um privilégio padrão (`pg_default_acl`) que concede EXECUTE a `anon`, não
-- herdado de PUBLIC — `revoke ... from public` sozinho não o atinge.
revoke all on function public.claim_publishing_job(uuid, text, int) from public;
revoke execute on function public.claim_publishing_job(uuid, text, int) from anon;

-- Sem grant para `authenticated`: reivindicar job da fila é trabalho de
-- worker (`service_role`), não de usuário logado. Diferente de
-- `match_knowledge`, que um chamador autenticado legitimamente usa.
