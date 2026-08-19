-- FASE 5 · subtarefas 1 (parcial), 2, 4, 5 (schema) — Marca, metodologia e a
-- base de conhecimento com pgvector.
--
-- Fonte da verdade: docs/02-MODELO-DE-DADOS.md §4.2 e docs/12-DETALHAMENTO-
-- FASES.md, FASE 5, subtarefas 2, 4 e 5. Mesma regra de sempre (docs/07 §2):
-- nenhuma tabela nasce antes da própria política de RLS.

-- ── extensão pgvector ─────────────────────────────────────────────────────────
-- Mesmo schema (`extensions`) das demais extensões já instaladas neste
-- projeto (pgcrypto, uuid-ossp) — está no `search_path` padrão, por isso o
-- resto do arquivo usa `vector(1536)` sem qualificar o schema.
create extension if not exists vector with schema extensions;

-- ── brand_profiles / brand_services ──────────────────────────────────────────
-- Administração de organização, não trabalho operacional do dia a dia — tom,
-- público e a metodologia proprietária mudam raramente e afetam toda geração
-- de conteúdo. Por isso usam `app.is_org_admin`, não `app.is_org_operator`
-- (a distinção que a FASE 4 estabeleceu). Todo membro ativo lê — a voz da
-- marca é contexto compartilhado, não informação restrita.
create table brand_profiles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  positioning     text,
  tone            text,
  audience        text,
  differentiators text[],
  forbidden_words text[] not null default '{}',
  preferred_words text[] not null default '{}',
  logo_path       text,
  colors          jsonb not null default '{}'::jsonb,
  typography      jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table brand_profiles enable row level security;
alter table brand_profiles force row level security;

create trigger set_updated_at
  before update on brand_profiles
  for each row execute function app.set_updated_at();

create policy tenant_select on brand_profiles for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on brand_profiles for insert to authenticated
  with check (app.is_org_admin(organization_id));

create policy admin_update on brand_profiles for update to authenticated
  using      (app.is_org_admin(organization_id))
  with check (app.is_org_admin(organization_id));

create policy admin_delete on brand_profiles for delete to authenticated
  using (app.is_org_admin(organization_id));

-- `brand_services` é onde ORBITA (budget e acompanhamento) e RICE (custos)
-- vivem como propriedade intelectual estruturada — todo A3 recebe estes
-- registros como contexto ao gerar uma peça sobre o pilar correspondente.
create table brand_services (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  slug            text not null,
  description     text,
  methodology     text,
  target_pain     text,
  icp_fit         jsonb,
  is_proprietary  boolean not null default false,
  is_active       boolean not null default true,
  unique (organization_id, slug)
);

alter table brand_services enable row level security;
alter table brand_services force row level security;

create policy tenant_select on brand_services for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on brand_services for insert to authenticated
  with check (app.is_org_admin(organization_id));

create policy admin_update on brand_services for update to authenticated
  using      (app.is_org_admin(organization_id))
  with check (app.is_org_admin(organization_id));

create policy admin_delete on brand_services for delete to authenticated
  using (app.is_org_admin(organization_id));

-- ── knowledge_documents / knowledge_chunks ───────────────────────────────────
-- Curadoria da base de conhecimento é trabalho de conteúdo do dia a dia —
-- mesma equipe que mantém `content_pillars` — por isso `app.is_org_operator`
-- aqui, diferente da marca acima.
create type knowledge_status as enum ('uploaded', 'processing', 'indexed', 'failed');

create table knowledge_documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  title           text not null,
  source_type     text not null,   -- pdf | pptx | docx | url | manual
  storage_path    text,
  source_url      text,
  mime_type       text,
  byte_size       bigint,
  checksum        text,
  status          knowledge_status not null default 'uploaded',
  error           text,
  created_by      uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  indexed_at      timestamptz,
  unique (organization_id, checksum)
);

alter table knowledge_documents enable row level security;
alter table knowledge_documents force row level security;

create policy tenant_select on knowledge_documents for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy operator_insert on knowledge_documents for insert to authenticated
  with check (app.is_org_operator(organization_id));

-- Cobre tanto o operador corrigindo metadado (ex.: title) quanto o pipeline
-- de ingestão avançando `status`/`indexed_at`/`error` — mas o pipeline roda
-- como `service_role`, que ignora RLS mesmo com FORCE (Supabase concede
-- BYPASSRLS a `service_role`); esta política só existe para o operador
-- humano mesmo.
create policy operator_update on knowledge_documents for update to authenticated
  using      (app.is_org_operator(organization_id))
  with check (app.is_org_operator(organization_id));

create policy operator_delete on knowledge_documents for delete to authenticated
  using (app.is_org_operator(organization_id));

-- `organization_id` denormalizado aqui (em vez de só em `knowledge_documents`)
-- de propósito: é o que permite a RLS de `knowledge_chunks` filtrar sem juntar
-- com `knowledge_documents` a cada linha do índice HNSW.
create table knowledge_chunks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  document_id     uuid not null references knowledge_documents (id) on delete cascade,
  chunk_index     int not null,
  content         text not null,
  token_count     int,
  embedding       vector(1536),
  metadata        jsonb not null default '{}'::jsonb,
  unique (document_id, chunk_index)
);
create index on knowledge_chunks using hnsw (embedding vector_cosine_ops);
create index on knowledge_chunks (organization_id);

alter table knowledge_chunks enable row level security;
alter table knowledge_chunks force row level security;

create policy tenant_select on knowledge_chunks for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- Sem política de INSERT/UPDATE/DELETE para `authenticated` — nenhum humano
-- escreve embedding à mão. Só o pipeline de ingestão (`service_role`, fora
-- da RLS) grava aqui, o mesmo desenho de `ai_invocations`/`automation_logs`
-- na FASE 4.

-- ── app.match_knowledge ───────────────────────────────────────────────────────
-- ACHADO real desta fase, corrigindo a assinatura documentada em
-- `03-APIS-E-INTEGRACOES.md` (`app.match_knowledge(p_query_embedding,
-- p_limit)`, sem organização).
--
-- `SECURITY INVOKER` só protege quando quem chama é uma role sujeita a RLS.
-- A1/A3 (Market Intelligence, Content Factory) rodam como `service_role` —
-- sem sessão de usuário, exatamente como A1 na FASE 4 — e `service_role` tem
-- BYPASSRLS: a política `tenant_select` acima simplesmente não se aplica a
-- ele. Uma função só com `p_query_embedding`/`p_limit`, chamada por A3 via
-- `service_role`, devolveria o chunk mais similar de QUALQUER organização —
-- a base de conhecimento de um cliente vazando para o conteúdo gerado de
-- outro. Pior que o achado da view `ai_usage_daily` na FASE 4 (aquele
-- vazava custo; este vazaria propriedade intelectual de consultoria).
--
-- Corrigido adicionando `p_organization_id` explícito no filtro — o mesmo
-- princípio já registrado em `market-intelligence`/`content-strategist`:
-- escopo por organização é aplicado explicitamente em código sempre que
-- quem chama pode ser `service_role`, nunca só implicitamente por RLS.
-- `SECURITY INVOKER` continua correto e é mantido: para um chamador
-- `authenticated` de verdade, a RLS ainda é a segunda camada de defesa caso
-- o filtro explícito algum dia divirja do vínculo real do usuário.
create or replace function app.match_knowledge(
  p_organization_id uuid,
  p_query_embedding vector(1536),
  p_limit int default 5,
  p_min_similarity numeric default 0.7
)
returns table (
  chunk_id        uuid,
  document_id     uuid,
  document_title  text,
  content         text,
  similarity      numeric
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    kc.id,
    kc.document_id,
    kd.title,
    kc.content,
    (1 - (kc.embedding <=> p_query_embedding))::numeric as similarity
  from knowledge_chunks kc
  join knowledge_documents kd on kd.id = kc.document_id
  where kc.organization_id = p_organization_id
    and kc.embedding is not null
    and (1 - (kc.embedding <=> p_query_embedding)) >= p_min_similarity
  order by kc.embedding <=> p_query_embedding
  limit greatest(p_limit, 0)
$$;

-- `app.*` não recebe o EXECUTE automático de `pg_default_acl` que as funções
-- de `public` recebem (achado da FASE 3, ver `command_center_revoke_anon_
-- execute.sql`) — `revoke ... from public` já basta aqui, mesmo padrão de
-- `app.is_org_operator`.
revoke all on function app.match_knowledge(uuid, vector, int, numeric) from public;
grant execute on function app.match_knowledge(uuid, vector, int, numeric) to authenticated;
