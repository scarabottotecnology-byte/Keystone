# 02 — Modelo de Dados

Cobre os itens 6, 7 e 8 da seção 66. Este documento é o **contrato**: o DDL aqui
descrito é a referência para as migrações das FASES 2 em diante. Ele não foi
aplicado ao banco — aplicar é trabalho da FASE 2.

---

## §1. Princípios de modelagem

**P1 — `organization_id NOT NULL` em toda tabela de negócio.** Sem exceção.

Não é preparo para vender o sistema — ele é de uso interno da Keystone. É o que
torna a **política de RLS uniforme**: uma única forma de escrever `using` em
todas as tabelas, em vez de sessenta políticas diferentes que alguém precisa
revisar uma a uma. Política uniforme é política auditável.

A coluna custa quase nada na criação e é a decisão de maior arrependimento se
precisar ser adicionada depois.

**P2 — Enum de banco para todo estado de máquina.** Status de post, estágio de
pipeline, modo de aprovação. Texto livre em coluna de status é fonte garantida de
divergência entre frontend e workflow.

**P3 — Soft delete onde há valor histórico** (`deleted_at`), hard delete onde a
LGPD exige eliminação. As duas coisas coexistem e estão marcadas por tabela.

**P4 — Timestamps `timestamptz`, sempre.** Nunca `timestamp`. O sistema opera em
`America/Sao_Paulo` mas armazena em UTC; a conversão é de apresentação.

**P5 — Dinheiro em `numeric(18,2)`.** Nunca `float`. Moeda explícita em
`currency char(3) default 'BRL'` onde houver valor.

**P6 — Chave natural com constraint única onde há efeito colateral externo.**
É o mecanismo de idempotência (invariante I-4).

**P7 — O que a IA gerou é marcado como tal.** `ai_generated boolean`,
`model text`, `grounded_on jsonb`. Isso permite auditar alucinação e medir o valor
real da automação.

**P8 — Ausência de informação é `unknown` explícito, nunca valor inventado.**
Aplica-se especialmente a `contacts` (seção 23 do Master Prompt).

---

## §2. Convenções

- Nomes de tabela em `snake_case` plural, em inglês. Sem exceção — o banco nasce
  vazio, então não há esquema legado para acomodar.
- PK: `id uuid primary key default gen_random_uuid()`.
- Auditoria padrão: `created_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()` (via trigger),
  `created_by uuid references auth.users(id)`.
- Índice obrigatório em `organization_id` de toda tabela, e composto
  `(organization_id, <coluna de filtro mais usada>)` nas tabelas de leitura quente.
- Schemas: `public` (exposto via PostgREST), `private` (**nunca** exposto — tokens
  e segredos), `app` (funções auxiliares de RLS e domínio).

---

## §3. Visão geral dos domínios

```
┌── PLATFORM ─────────────────────────────────────────────────────┐
│  organizations · profiles · memberships · invitations           │
│  audit_log · idempotency_keys · dsr_requests                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ organization_id (todas as tabelas abaixo)
   ┌──────────────────────┼──────────────────────┬─────────────────┐
   ▼                      ▼                      ▼                 ▼
┌─────────────┐  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐
│ BRAND &     │  │ CONTENT          │  │ DEMAND         │  │ AI CORE     │
│ KNOWLEDGE   │  │                  │  │                │  │             │
│ brand_      │  │ content_pillars  │  │ companies      │  │ ai_prompts  │
│  profiles   │  │ content_topics   │  │ contacts       │  │ ai_providers│
│ brand_      │  │ content_ideas    │  │ icp_profiles   │  │ ai_         │
│  services   │  │ content_formats  │  │ prospects      │  │  invocations│
│ knowledge_  │  │ content_assets   │  │ prospect_      │  │ ai_insights │
│  documents  │  │ content_reviews  │  │  scores        │  │ ai_learnings│
│ knowledge_  │  │ content_calendar │  │ prospect_      │  │ ai_         │
│  chunks     │  │ content_calendar_│  │  signals       │  │  recommend. │
│  (pgvector) │  │  rules           │  │ company_       │  │ growth_     │
│             │  │ content_campaigns│  │  research      │  │  score_*    │
└─────────────┘  └────────┬─────────┘  └───────┬────────┘  └─────────────┘
                          │                    │
                          ▼                    ▼
                 ┌──────────────────┐  ┌────────────────────┐
                 │ PUBLISHING       │  │ OUTREACH           │
                 │ social_accounts  │  │ campaigns          │
                 │ social_posts     │  │ campaign_steps     │
                 │ social_post_     │  │ campaign_contacts  │
                 │  metrics         │  │ message_templates  │
                 │ publishing_jobs  │  │ outreach_messages  │
                 └────────┬─────────┘  │ suppression_list   │
                          │            │ consents           │
                          │            │ email_* whatsapp_* │
                          │            └─────────┬──────────┘
                          └──────────┬───────────┘
                                     ▼
                          ┌────────────────────────┐
                          │ REVENUE                │
                          │ leads · lead_events    │
                          │ lead_scores            │
                          │ pipelines · stages     │
                          │ opportunities          │
                          │ activities             │
                          │ touchpoints            │
                          │ attribution_results    │
                          └────────────────────────┘
┌── OBSERVABILITY ────────────────────────────────────────────────┐
│  automation_definitions · automation_runs · automation_logs     │
│  integration_logs · error_logs                                  │
└─────────────────────────────────────────────────────────────────┘
```

Aproximadamente **60 tabelas**. Elas não nascem todas na FASE 2 — cada fase cria
apenas as suas (ver `09 §2`).

---

## §4. Entidades

### 4.1 Platform

```sql
create type org_role as enum ('owner','admin','operator','analyst','viewer');
create type membership_status as enum ('invited','active','suspended');

create table organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  legal_name    text not null,
  display_name  text not null,
  cnpj          text,
  timezone      text not null default 'America/Sao_Paulo',
  locale        text not null default 'pt-BR',
  plan          text not null default 'internal',
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Espelho de auth.users. Não duplica e-mail nem senha.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_path text,
  locale      text not null default 'pt-BR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            org_role not null default 'viewer',
  status          membership_status not null default 'active',
  invited_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on memberships (user_id) where status = 'active';
```

`memberships` é a tabela mais crítica do sistema: toda política de RLS depende
dela. Ver `07 §2` para a função `app.current_org_ids()` e o cuidado com recursão.

```sql
create table audit_log (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id        uuid references auth.users(id),
  actor_type      text not null default 'user',   -- user | system | ai | n8n
  action          text not null,                   -- ex.: 'opportunity.stage_changed'
  subject_type    text not null,
  subject_id      uuid,
  before          jsonb,
  after           jsonb,
  correlation_id  text,
  ip_hash         text,                            -- hash, nunca IP em claro
  at              timestamptz not null default now()
);

create table idempotency_keys (
  organization_id uuid not null references organizations(id) on delete cascade,
  scope           text not null,      -- 'social_publish' | 'outreach_send' | …
  key             text not null,      -- chave natural determinística
  subject_type    text,
  subject_id      uuid,
  result          jsonb,
  created_at      timestamptz not null default now(),
  primary key (organization_id, scope, key)
);
```

### 4.2 Brand & Knowledge

```sql
create table brand_profiles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  positioning     text,
  tone            text,
  audience        text,
  differentiators text[],
  forbidden_words text[] not null default '{}',
  preferred_words text[] not null default '{}',
  logo_path       text,
  colors          jsonb not null default '{}',
  typography      jsonb not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table brand_services (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,             -- 'Método ORBITA', 'Método RICE'
  slug            text not null,
  description     text,
  methodology     text,                      -- PI da Keystone (seção 59)
  target_pain     text,
  icp_fit         jsonb,
  is_proprietary  boolean not null default false,
  is_active       boolean not null default true,
  unique (organization_id, slug)
);
```

`brand_services` é onde ORBITA (budget e acompanhamento) e RICE (custos) vivem
como propriedade intelectual estruturada. Toda geração de conteúdo e toda
mensagem de outreach recebe estes registros como contexto — é assim que a
metodologia própria entra no produto em vez de ficar num documento.

```sql
create type knowledge_status as enum ('uploaded','processing','indexed','failed');

create table knowledge_documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title           text not null,
  source_type     text not null,     -- pdf | pptx | docx | url | manual
  storage_path    text,
  source_url      text,
  mime_type       text,
  byte_size       bigint,
  checksum        text,
  status          knowledge_status not null default 'uploaded',
  error           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  indexed_at      timestamptz,
  unique (organization_id, checksum)
);

create table knowledge_chunks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  document_id     uuid not null references knowledge_documents(id) on delete cascade,
  chunk_index     int not null,
  content         text not null,
  token_count     int,
  embedding       vector(1536),
  metadata        jsonb not null default '{}',
  unique (document_id, chunk_index)
);
create index on knowledge_chunks using hnsw (embedding vector_cosine_ops);
create index on knowledge_chunks (organization_id);
```

**Nota de segurança sobre RAG.** O índice HNSW é global à tabela; o isolamento
vem da RLS e do filtro `organization_id` na query. A função de busca
(`app.match_knowledge`) é `SECURITY INVOKER` justamente para que a RLS do usuário
seja aplicada — uma função `SECURITY DEFINER` aqui vazaria conhecimento entre
organizações. Detalhado em `07 §2`.

**Achado da FASE 5, corrigindo a assinatura acima.** `SECURITY INVOKER`
sozinho não basta: A1 e A3 chamam `app.match_knowledge` como `service_role`,
sem sessão de usuário — e `service_role` tem `BYPASSRLS`, então a RLS de
`knowledge_chunks` simplesmente não se aplica a ele. Sem um filtro explícito,
a peça gerada para uma organização poderia citar a base de conhecimento de
outra. A assinatura real, implementada na migração `brand_and_knowledge_
base.sql`, é `app.match_knowledge(p_organization_id, p_query_embedding,
p_limit, p_min_similarity)` — o parâmetro de organização é obrigatório e
filtrado explicitamente em código, o mesmo princípio já usado em
`market-intelligence`/`content-strategist` (FASE 4) para todo caminho onde
quem chama pode ser `service_role`. Prova em
`supabase/tests/database/match_knowledge_isolation.sql`.

### 4.3 Content

```sql
create type content_status as enum
  ('draft','review','approved','scheduled','published','failed','cancelled');
create type social_channel as enum
  ('linkedin','instagram','facebook','youtube','tiktok','x','blog');

create table content_pillars (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,     -- Controladoria, FP&A, Budget, Custos…
  slug            text not null,
  description     text,
  methodology_id  uuid references brand_services(id),
  weight          numeric(5,2) not null default 1,
  is_active       boolean not null default true,
  unique (organization_id, slug)
);

create table content_topics (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  pillar_id       uuid not null references content_pillars(id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'active'
);

create table content_ideas (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  topic_id           uuid references content_topics(id) on delete set null,
  pillar_id          uuid references content_pillars(id) on delete set null,
  source_insight_id  uuid references ai_insights(id) on delete set null,
  title              text not null,
  angle              text,
  hook               text,
  rationale          text,
  intent             text,        -- educacao | dor | case | insight | comercial
  status             content_status not null default 'draft',
  ai_generated       boolean not null default false,
  score              int,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table content_formats (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  key             text not null,   -- text_post | carousel | single_image | video_script
  channel         social_channel not null,
  spec            jsonb not null default '{}',  -- limites de caracteres, nº de slides, proporção
  is_active       boolean not null default true,
  unique (organization_id, key, channel)
);

create table content_assets (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  idea_id         uuid references content_ideas(id) on delete set null,
  campaign_id     uuid references content_campaigns(id) on delete set null,
  format_id       uuid references content_formats(id),
  channel         social_channel not null,
  headline        text,
  hook            text,
  body            text,
  cta             text,
  hashtags        text[] not null default '{}',
  media           jsonb not null default '[]',  -- [{storage_path, alt, order}]
  visual_brief    text,
  grounded_on     jsonb not null default '[]',  -- ids de knowledge_chunks usados (P7, docs/05 §3)
  variant_of      uuid references content_assets(id) on delete set null,
  version         int not null default 1,
  status          content_status not null default 'draft',
  ai_generated    boolean not null default false,
  model           text,
  approved_by     uuid references auth.users(id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on content_assets (organization_id, status, channel);

create table content_reviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_id        uuid not null references content_assets(id) on delete cascade,
  score           int not null check (score between 0 and 100),
  dimensions      jsonb not null,   -- {clareza:82, hook:70, icp_fit:91, cta:65, …}
  issues          jsonb not null default '[]',
  suggestions     text,
  reviewer_type   text not null default 'ai',   -- ai | human
  reviewer_id     uuid references auth.users(id),
  model           text,
  created_at      timestamptz not null default now()
);
```

As dimensões do Content Score (seção 12) são as chaves de `dimensions`: clareza,
relevância, aderência ao ICP, força do hook, argumentação, CTA, posicionamento,
potencial comercial, risco de genérico, consistência de marca — como chave
`jsonb`, em ASCII/snake_case (`clareza`, `relevancia`, `aderencia_icp`,
`forca_hook`, `argumentacao`, `cta`, `posicionamento`, `potencial_comercial`,
`risco_generico`, `consistencia_marca`), não o rótulo acentuado acima, que é
só a versão legível para humano. Guardar como
`jsonb` — e não como dez colunas — permite evoluir a rubrica sem migração, ao
custo de não ter constraint. Aceitável porque a rubrica é validada por `zod` na
Edge Function antes de gravar.

```sql
create table content_calendar (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_id        uuid references content_assets(id) on delete set null,
  channel         social_channel not null,
  scheduled_for   timestamptz not null,
  status          content_status not null default 'scheduled',
  rule_id         uuid references content_calendar_rules(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, channel, scheduled_for)
);
create index on content_calendar (organization_id, scheduled_for);

-- Distribuição semanal configurável (seção 10 do Master Prompt)
create table content_calendar_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  weekday         int not null check (weekday between 0 and 6),
  slot_time       time not null,
  channel         social_channel not null,
  pillar_id       uuid references content_pillars(id) on delete set null,
  format_id       uuid references content_formats(id) on delete set null,
  intent          text,   -- segunda=educacao, terça=dor, quarta=case…
  is_active       boolean not null default true
);

create table content_campaigns (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  objective       text,
  start_at        timestamptz,
  end_at          timestamptz,
  budget          numeric(18,2),
  status          text not null default 'planned',
  created_at      timestamptz not null default now()
);
```

### 4.4 Publishing

```sql
create type publish_status as enum
  ('pending','locked','running','succeeded','failed','cancelled','skipped');
create type account_status as enum
  ('connected','expiring','expired','revoked','error');

create table social_accounts (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  provider           social_channel not null,
  external_account_id text not null,          -- URN da organização / IG user id
  display_name       text,
  avatar_url         text,
  scopes             text[] not null default '{}',
  status             account_status not null default 'connected',
  token_ref          text not null,           -- ponteiro para private/Vault
  token_expires_at   timestamptz,
  last_error         text,
  last_synced_at     timestamptz,
  connected_by       uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  unique (organization_id, provider, external_account_id)
);
```

**`token_ref`, não `token`.** A tabela é legível pelo frontend (para mostrar
"conta conectada, expira em X dias") e por isso **não pode conter o segredo**.
O token vive em `private.oauth_tokens`, fora do PostgREST, acessível apenas por
Edge Function com `service_role`. Ver `07 §3`.

```sql
create table social_posts (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  asset_id           uuid references content_assets(id) on delete set null,
  social_account_id  uuid not null references social_accounts(id) on delete cascade,
  channel            social_channel not null,
  external_post_id   text,
  permalink          text,
  published_at       timestamptz,
  status             content_status not null default 'scheduled',
  error              text,
  idempotency_key    text not null,
  created_at         timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (social_account_id, external_post_id)
);

create table social_post_metrics (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  social_post_id  uuid not null references social_posts(id) on delete cascade,
  collected_for   date not null,          -- snapshot diário
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
```

Snapshot diário em vez de coluna mutável: métricas de rede social crescem ao longo
de dias e um `UPDATE` destrói a curva. A unicidade por `(post, dia)` torna a
sincronização naturalmente idempotente — reexecutar o WF-003 no mesmo dia faz
`upsert`, não duplica.

```sql
create table publishing_jobs (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  calendar_id        uuid references content_calendar(id) on delete cascade,
  asset_id           uuid not null references content_assets(id) on delete cascade,
  social_account_id  uuid not null references social_accounts(id) on delete cascade,
  run_at             timestamptz not null,
  attempt            int not null default 0,
  max_attempts       int not null default 5,
  status             publish_status not null default 'pending',
  locked_at          timestamptz,
  locked_by          text,
  correlation_id     text,
  last_error         text,
  created_at         timestamptz not null default now(),
  unique (calendar_id, social_account_id)
);
create index on publishing_jobs (status, run_at) where status in ('pending','failed');
```

`locked_at` / `locked_by` implementam lock pessimista: a claim do job é
`update … set status='locked' where id = … and status='pending' returning *`.
Se duas execuções concorrentes do n8n disputarem o mesmo job, apenas uma recebe
linha de volta. Isso resolve a duplicação **antes** de a chamada externa acontecer.

### 4.5 Demand (ICP, empresas, prospects, contatos)

```sql
create type verification_status as enum ('verified','unverified','unknown');
create type prospect_stage as enum
  ('discovered','researched','prioritized','contacted','engaged','converted','disqualified');

create table companies (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  cnpj               text,
  razao_social       text not null,
  nome_fantasia      text,
  cnae_principal     text,
  cnae_secundarios   text[],
  situacao_cadastral text,
  data_abertura      date,
  porte              text,
  capital_social     numeric(18,2),
  natureza_juridica  text,
  municipio          text,
  uf                 char(2),
  cep                text,
  matriz_filial      text,
  qtd_estabelecimentos int,
  website            text,
  linkedin_url       text,
  source             text not null,          -- 'receita_federal_open_data' | 'api_licenciada' | 'manual'
  source_updated_at  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (organization_id, cnpj)
);
create index on companies (organization_id, uf, cnae_principal);
```

`source` e `source_updated_at` são obrigatórios porque a seção 21 exige rastrear
procedência do dado cadastral. Sem isso é impossível responder a um titular sobre
de onde veio a informação, nem saber quando ela está velha.

```sql
create table company_signals (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id      uuid not null references companies(id) on delete cascade,
  type            text not null,     -- abertura_filial | vaga_financeiro | noticia_expansao | …
  description     text not null,
  evidence_url    text,
  observed_at     timestamptz not null,
  weight          numeric(5,2) not null default 1,
  confidence      numeric(3,2) check (confidence between 0 and 1),
  source          text not null
);

create table contacts (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  company_id          uuid references companies(id) on delete set null,
  full_name           text,
  role_title          text,
  seniority           text,          -- cfo | diretor_financeiro | controller | ceo | socio
  email               text,
  email_status        verification_status not null default 'unknown',
  phone               text,
  phone_status        verification_status not null default 'unknown',
  linkedin_url        text,
  source              text not null,
  consent_status      text not null default 'none',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (organization_id, email)
);
```

`email_status` e `phone_status` default `unknown` implementam literalmente a
seção 23: *"Se a informação não existir: marcar como UNKNOWN. Nunca fabricar
dados."* Nenhum agente de IA tem permissão de escrita nestas colunas — apenas
integrações de enriquecimento com fonte declarada. Ver `05 §7`.

```sql
create table icp_profiles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  description     text,
  criteria        jsonb not null,   -- [{key:'faturamento', op:'between', value:[10e6,100e6]}]
  weights         jsonb not null,   -- {faturamento:25, segmento:20, porte:15, crescimento:20, sinais:20}
  version         int not null default 1,
  is_active       boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (organization_id, name, version)
);

create table prospects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id      uuid not null references companies(id) on delete cascade,
  icp_profile_id  uuid references icp_profiles(id) on delete set null,
  stage           prospect_stage not null default 'discovered',
  owner_id        uuid references auth.users(id),
  priority        int,
  last_touch_at   timestamptz,
  next_action     text,
  next_action_at  timestamptz,
  created_at      timestamptz not null default now(),
  unique (organization_id, company_id)
);

create table prospect_scores (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  prospect_id     uuid not null references prospects(id) on delete cascade,
  icp_profile_id  uuid not null references icp_profiles(id) on delete cascade,
  score           int not null check (score between 0 and 100),
  breakdown       jsonb not null,  -- por critério: valor, peso, contribuição, motivo
  computed_at     timestamptz not null default now(),
  unique (prospect_id, icp_profile_id, computed_at)
);

create table company_research (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  company_id         uuid not null references companies(id) on delete cascade,
  summary            text not null,
  likely_pain        text,
  suggested_service  uuid references brand_services(id),
  suggested_approach text,
  priority           int,
  grounded_on        jsonb not null default '[]',  -- ids dos sinais/campos usados
  model              text,
  ai_invocation_id   uuid references ai_invocations(id),
  generated_at       timestamptz not null default now()
);
```

`grounded_on` é o antídoto contra alucinação em pesquisa comercial: a UI mostra
apenas afirmações cujos fatos de origem estão listados aqui, com link para o
registro que os sustenta. É o que separa "a IA acha" de "o dado diz".

### 4.6 Outreach

```sql
create type outreach_channel as enum ('email','whatsapp','linkedin');
create type contact_state as enum
  ('pending','active','replied','stopped','completed','bounced','suppressed');

create table campaigns (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  channel         outreach_channel not null,
  objective       text,
  icp_profile_id  uuid references icp_profiles(id),
  status          text not null default 'draft',
  daily_cap       int not null default 30,
  approval_mode   approval_mode not null default 'approval_required',
  start_at        timestamptz,
  end_at          timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create table campaign_steps (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id     uuid not null references campaigns(id) on delete cascade,
  step_index      int not null,          -- 0=D0, 1=D3, 2=D7, 3=D14, 4=D30
  delay_days      int not null default 0,
  channel         outreach_channel not null,
  template_id     uuid references message_templates(id),
  condition       jsonb not null default '{}',
  stop_on_reply   boolean not null default true,
  is_terminal     boolean not null default false,
  unique (campaign_id, step_index)
);

create table campaign_contacts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id     uuid not null references campaigns(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  prospect_id     uuid references prospects(id) on delete set null,
  state           contact_state not null default 'pending',
  current_step    int not null default 0,
  next_send_at    timestamptz,
  stopped_reason  text,
  created_at      timestamptz not null default now(),
  unique (campaign_id, contact_id)
);
create index on campaign_contacts (state, next_send_at) where state = 'active';

create table outreach_messages (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  campaign_contact_id uuid references campaign_contacts(id) on delete cascade,
  contact_id          uuid not null references contacts(id) on delete cascade,
  step_index          int,
  channel             outreach_channel not null,
  direction           text not null default 'outbound',
  provider_message_id text,
  subject             text,
  body                text,
  personalization     jsonb,      -- fatos usados; auditável contra invenção
  status              text not null default 'queued',
  sent_at             timestamptz,
  delivered_at        timestamptz,
  opened_at           timestamptz,
  replied_at          timestamptz,
  bounced_at          timestamptz,
  error               text,
  idempotency_key     text not null,
  created_at          timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

-- Verificada antes de TODO envio. Sobrevive à exclusão do contato.
create table suppression_list (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  channel         outreach_channel not null,
  value_hash      text not null,      -- sha256(lower(email|telefone)) — nunca em claro
  reason          text not null,      -- opt_out | bounce | complaint | manual | dsr_erasure
  created_at      timestamptz not null default now(),
  unique (organization_id, channel, value_hash)
);

create table consents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subject_type    text not null,      -- contact | lead
  subject_id      uuid not null,
  channel         outreach_channel not null,
  basis           text not null,      -- legitimate_interest | consent | contract
  status          text not null,      -- granted | revoked | not_required
  evidence        jsonb not null,     -- origem, texto aceito, timestamp, IP hash
  captured_at     timestamptz not null default now(),
  revoked_at      timestamptz
);
```

`suppression_list` guarda **hash, não valor**. Isso é deliberado e resolve um
conflito real da LGPD: quando um titular pede eliminação, apagamos os dados
pessoais — mas se apagássemos também o registro de opt-out, o sistema voltaria a
contatá-lo no próximo ciclo de discovery. Guardar o hash permite honrar o opt-out
perpetuamente sem reter dado pessoal legível. Ver `07 §6`.

### 4.7 WhatsApp e E-mail

```sql
create type ai_mode as enum ('autonomous','assist','off');

create table whatsapp_accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  waba_id         text not null,
  phone_number_id text not null,
  display_number  text,
  status          account_status not null default 'connected',
  token_ref       text not null,
  quality_rating  text,
  messaging_tier  text,
  unique (organization_id, phone_number_id)
);

create table whatsapp_contacts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  wa_id           text not null,
  contact_id      uuid references contacts(id) on delete set null,
  profile_name    text,
  opt_in_status   text not null default 'unknown',
  last_inbound_at timestamptz,
  unique (organization_id, wa_id)
);

create table whatsapp_conversations (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references organizations(id) on delete cascade,
  whatsapp_contact_id       uuid not null references whatsapp_contacts(id) on delete cascade,
  state                     text not null default 'open',
  ai_mode                   ai_mode not null default 'assist',
  assigned_to               uuid references auth.users(id),
  service_window_expires_at timestamptz,
  handoff_reason            text,
  handoff_at                timestamptz,
  tags                      text[] not null default '{}',
  last_message_at           timestamptz,
  created_at                timestamptz not null default now()
);

create table whatsapp_messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references whatsapp_conversations(id) on delete cascade,
  direction       text not null,         -- inbound | outbound
  wa_message_id   text,
  type            text not null default 'text',
  body            text,
  template_id     uuid references whatsapp_templates(id),
  status          text,                  -- sent|delivered|read|failed
  sent_by         text not null default 'ai',   -- ai | human | system
  error           text,
  occurred_at     timestamptz not null,
  unique (organization_id, wa_message_id)
);

create table whatsapp_templates (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references organizations(id) on delete cascade,
  provider_template_name text not null,
  category               text not null,   -- MARKETING | UTILITY | AUTHENTICATION
  language               text not null default 'pt_BR',
  status                 text not null default 'pending',
  components             jsonb not null,
  unique (organization_id, provider_template_name, language)
);
```

`service_window_expires_at` codifica a janela de 24 h do WhatsApp diretamente no
schema. Fora dela, só template aprovado pode ser enviado — e a Edge Function
verifica esta coluna antes de montar o payload. Regra de plataforma virando
constraint de dados em vez de comentário em código.

```sql
create table email_accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider        text not null,
  from_address    text not null,
  from_name       text,
  domain_auth     jsonb not null default '{}',   -- estado de SPF/DKIM/DMARC
  daily_cap       int not null default 200,
  status          account_status not null default 'connected',
  token_ref       text not null,
  unique (organization_id, from_address)
);

create table email_messages (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  outreach_message_id uuid references outreach_messages(id) on delete cascade,
  email_account_id    uuid not null references email_accounts(id),
  provider_message_id text,
  to_hash             text not null,
  subject             text,
  status              text not null default 'queued',
  opened_at           timestamptz,
  clicked_at          timestamptz,
  bounced_at          timestamptz,
  complaint_at        timestamptz,
  unique (organization_id, provider_message_id)
);
```

### 4.8 Revenue (leads, CRM, atribuição)

```sql
create type lead_status as enum
  ('new','qualified','contacted','engaged','nurturing','converted','disqualified');

create table lead_sources (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  key             text not null,
  channel         text not null,
  description     text,
  unique (organization_id, key)
);

create table leads (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  source_id         uuid references lead_sources(id),
  campaign_id       uuid references campaigns(id) on delete set null,
  origin_asset_id   uuid references content_assets(id) on delete set null,
  origin_channel    text,
  company_id        uuid references companies(id) on delete set null,
  contact_id        uuid references contacts(id) on delete set null,
  full_name         text,
  email             text,
  phone             text,
  role_title        text,
  company_name_raw  text,
  status            lead_status not null default 'new',
  score             int,
  owner_id          uuid references auth.users(id),
  consent_id        uuid references consents(id),
  dedupe_key        text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, dedupe_key)
);
```

`dedupe_key` = `lower(coalesce(email, phone, linkedin_url))`. Sem esta constraint,
a mesma pessoa que preenche dois formulários vira dois leads e o funil mente.
`origin_asset_id` é o elo que torna a pergunta *"qual conteúdo gerou este lead?"*
respondível por `JOIN` em vez de por suposição.

```sql
create table lead_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id         uuid not null references leads(id) on delete cascade,
  type            text not null,
  occurred_at     timestamptz not null default now(),
  payload         jsonb not null default '{}',
  correlation_id  text
);

create table lead_scores (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id         uuid not null references leads(id) on delete cascade,
  model_version   text not null,
  score           int not null check (score between 0 and 100),
  factors         jsonb not null,
  computed_at     timestamptz not null default now()
);

create table pipelines (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  is_default      boolean not null default false
);

create table pipeline_stages (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  pipeline_id         uuid not null references pipelines(id) on delete cascade,
  key                 text not null,   -- new|qualified|contacted|engaged|meeting|
                                       -- diagnosis|proposal|negotiation|won|lost
  label               text not null,
  order_index         int not null,
  probability_default numeric(5,2),
  is_won              boolean not null default false,
  is_lost             boolean not null default false,
  unique (pipeline_id, key)
);

create table opportunities (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations(id) on delete cascade,
  pipeline_id        uuid not null references pipelines(id),
  stage_id           uuid not null references pipeline_stages(id),
  company_id         uuid references companies(id) on delete set null,
  contact_id         uuid references contacts(id) on delete set null,
  lead_id            uuid references leads(id) on delete set null,
  prospect_id        uuid references prospects(id) on delete set null,
  title              text not null,
  origin_channel     text,
  origin_campaign_id uuid references campaigns(id) on delete set null,
  origin_asset_id    uuid references content_assets(id) on delete set null,
  amount_estimated   numeric(18,2),
  amount_won         numeric(18,2),
  currency           char(3) not null default 'BRL',
  probability        numeric(5,2),
  owner_id           uuid references auth.users(id),
  next_action        text,
  next_action_at     timestamptz,
  expected_close_at  date,
  closed_at          timestamptz,
  lost_reason        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on opportunities (organization_id, stage_id, updated_at desc);

create table opportunity_stage_history (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  opportunity_id  uuid not null references opportunities(id) on delete cascade,
  from_stage_id   uuid references pipeline_stages(id),
  to_stage_id     uuid not null references pipeline_stages(id),
  changed_by      uuid references auth.users(id),
  changed_at      timestamptz not null default now()
);

create table activities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subject_type    text not null,    -- lead | prospect | opportunity | contact
  subject_id      uuid not null,
  type            text not null,    -- note | call | meeting | email | whatsapp | task
  actor_type      text not null default 'user',
  actor_id        uuid references auth.users(id),
  occurred_at     timestamptz not null default now(),
  notes           text,
  payload         jsonb not null default '{}'
);
create index on activities (organization_id, subject_type, subject_id, occurred_at desc);
```

#### Atribuição

```sql
create table touchpoints (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subject_type    text not null,    -- lead | prospect | opportunity
  subject_id      uuid not null,
  channel         text not null,
  asset_id        uuid references content_assets(id) on delete set null,
  campaign_id     uuid references campaigns(id) on delete set null,
  social_post_id  uuid references social_posts(id) on delete set null,
  occurred_at     timestamptz not null,
  position        int,
  metadata        jsonb not null default '{}'
);
create index on touchpoints (organization_id, subject_type, subject_id, occurred_at);

create table attribution_results (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  opportunity_id    uuid not null references opportunities(id) on delete cascade,
  model             text not null,   -- first_touch|last_touch|linear|position_based
  channel           text,
  asset_id          uuid references content_assets(id) on delete set null,
  campaign_id       uuid references campaigns(id) on delete set null,
  attributed_amount numeric(18,2) not null,
  attributed_share  numeric(6,4) not null,
  computed_at       timestamptz not null default now(),
  unique (opportunity_id, model, coalesce(channel,''), coalesce(asset_id,'00000000-0000-0000-0000-000000000000'::uuid))
);
```

Quatro modelos calculados em paralelo, não um. Nenhum modelo de atribuição é
verdadeiro; a divergência entre eles é a informação útil. Quando `first_touch` e
`last_touch` discordam muito sobre um canal, isso indica um canal de descoberta
(topo) versus um de fechamento (fundo) — distinção que um modelo único apaga.

### 4.9 AI Core

```sql
create table ai_providers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  key             text not null,        -- anthropic | openai | google | …
  priority        int not null default 100,
  is_active       boolean not null default true,
  config          jsonb not null default '{}',   -- SEM segredo; chave no Vault
  unique (organization_id, key)
);

create table ai_prompts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,  -- null = global
  key             text not null,
  version         int not null default 1,
  system_prompt   text not null,
  user_template   text not null,
  variables       text[] not null default '{}',
  output_schema   jsonb,
  model_hint      text,
  temperature     numeric(3,2),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, key, version)
);

create table ai_invocations (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  correlation_id    text,
  prompt_key        text,
  prompt_version    int,
  operation         text not null,
  provider          text not null,
  model             text not null,
  input_tokens      int,
  output_tokens     int,
  cached_tokens     int,
  estimated_cost_usd numeric(12,6),
  latency_ms        int,
  status            text not null,     -- success | error | fallback
  error             text,
  fallback_from     text,
  subject_type      text,
  subject_id        uuid,
  created_at        timestamptz not null default now()
);
create index on ai_invocations (organization_id, created_at desc);
create index on ai_invocations (organization_id, operation, created_at desc);
```

Não existe tabela `ai_usage` separada. Ela é uma **view** sobre `ai_invocations`
— uma tabela derivada seria uma segunda fonte de verdade que pode divergir.

```sql
create view ai_usage_daily as
select organization_id,
       date_trunc('day', created_at)::date as day,
       provider, model, operation,
       count(*) as calls,
       sum(input_tokens)  as input_tokens,
       sum(output_tokens) as output_tokens,
       sum(estimated_cost_usd) as cost_usd
from ai_invocations group by 1,2,3,4,5;
```

`AI COST / LEAD` e `AI COST / OPPORTUNITY` (seção 53) derivam desta view cruzada
com contagens de `leads` e `opportunities` no mesmo período.

`ai_insights.source_url` é `not null` — não opcional. O agente A1 (`05 §4`) e
o critério de aceite da FASE 4 são explícitos: "insight sem fonte rastreável é
rejeitado". Rastreabilidade inclui a URL, não só o nome da fonte.

```sql
create table ai_insights (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  type                 text not null,   -- trend | pain | question | economic | opportunity
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
  ai_invocation_id     uuid references ai_invocations(id),
  created_at           timestamptz not null default now()
);

create table ai_learnings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  insight         text not null,
  origin          text not null,       -- content_performance | outreach | pipeline
  evidence        jsonb not null,      -- ids + números que sustentam a conclusão
  confidence      numeric(3,2) not null check (confidence between 0 and 1),
  impact          text,
  category        text,
  recommendation  text,
  sample_size     int,
  superseded_by   uuid references ai_learnings(id),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table ai_recommendations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  kind             text not null,
  problem          text not null,
  evidence         jsonb not null,
  recommendation   text not null,
  expected_impact  text,
  action           jsonb,      -- comando executável tipado
  priority         int not null default 50,
  status           text not null default 'pending',
  executed_at      timestamptz,
  executed_by      uuid references auth.users(id),
  result           jsonb,
  expires_at       timestamptz,
  created_at       timestamptz not null default now()
);
```

`ai_recommendations.action` é o que dá função ao botão **EXECUTAR** da seção 49.
Não é texto: é um comando tipado, ex.
`{"type":"create_content_ideas","params":{"pillar_id":"…","count":5}}`, validado
por `zod` contra um registro fechado de ações permitidas antes de despachar. Uma
recomendação cujo `action` é `null` é apenas informativa e a UI não oferece botão.

`ai_learnings.superseded_by` e `sample_size` existem porque aprendizado com
amostra pequena é ruído. O agente não pode promover uma conclusão a `is_active`
abaixo de um `sample_size` mínimo configurável.

```sql
create table growth_score_config (
  organization_id    uuid primary key references organizations(id) on delete cascade,
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

create table growth_score_snapshots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  snapshot_date   date not null,
  total_score     numeric,   -- null enquanto nem todo componente tiver dado — nunca 0 fabricado
  components      jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  unique (organization_id, snapshot_date)
);
```

Peso e meta por componente em colunas próprias, não em `weights`/`targets`
genéricos como uma versão anterior deste documento descrevia — a FASE 3
(`docs/17-EXECUCAO-FASE-3.md` e `docs/18-EXECUCAO-FASE-3.md`) implementou
assim para que cada componente tivesse `check`/tipo próprios em vez de uma
estrutura `jsonb` sem validação de schema. `total_score` é nullable de
propósito: um score composto calculado sobre uma base incompleta pareceria
uma nota real — ver `src/modules/command-center/growthScore.ts`.

### 4.10 Automation & Observability

```sql
create type approval_mode as enum ('auto','approval_required','manual');
create type run_status as enum ('running','succeeded','failed','partial','cancelled');

create table automation_definitions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  key             text not null,          -- 'WF-002-daily-publishing'
  name            text not null,
  description     text,
  schedule_cron   text,
  timezone        text not null default 'America/Sao_Paulo',
  approval_mode   approval_mode not null default 'approval_required',
  is_enabled      boolean not null default false,
  config          jsonb not null default '{}',
  unique (organization_id, key)
);

create table automation_runs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  definition_key   text not null,
  correlation_id   text not null,
  trigger_type     text not null,     -- schedule | manual | webhook | retry
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  status           run_status not null default 'running',
  items_processed  int not null default 0,
  items_succeeded  int not null default 0,
  items_failed     int not null default 0,
  error_summary    text,
  unique (organization_id, correlation_id)
);

create table automation_logs (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  run_id         uuid not null references automation_runs(id) on delete cascade,
  level          text not null default 'info',
  step           text not null,
  message        text not null,
  payload        jsonb,               -- mínimo necessário, sem segredo
  at             timestamptz not null default now()
);

create table integration_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  provider         text not null,
  operation        text not null,
  status_code      int,
  latency_ms       int,
  rate_limit_remaining int,
  retry_after_s    int,
  error_code       text,
  error_message    text,
  request_summary  jsonb,             -- sem corpo completo, sem credencial
  correlation_id   text,
  at               timestamptz not null default now()
);

create table error_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  source          text not null,
  severity        text not null,     -- critical | high | medium | low
  message         text not null,
  stack_hash      text not null,
  context         jsonb,
  correlation_id  text,
  occurrences     int not null default 1,
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  resolved_at     timestamptz,
  unique (organization_id, stack_hash)
);
```

`error_logs` agrega por `stack_hash` com contador em vez de inserir uma linha por
ocorrência. Um erro em laço geraria milhares de linhas idênticas e afogaria o
sinal — aqui ele vira uma linha com `occurrences = 4.312`, que é a informação que
importa.

---

## §5. Relacionamentos

### Cardinalidades principais

```
organizations 1──N memberships N──1 auth.users
organizations 1──N * (toda tabela de negócio)

ai_insights   1──N content_ideas 1──N content_assets 1──N content_reviews
content_assets 1──N content_calendar 1──1 publishing_jobs
content_assets 1──N social_posts 1──N social_post_metrics

icp_profiles  1──N prospect_scores N──1 prospects 1──1 companies
companies     1──N contacts
companies     1──N company_signals
companies     1──N company_research

campaigns 1──N campaign_steps
campaigns 1──N campaign_contacts N──1 contacts
campaign_contacts 1──N outreach_messages

contacts 1──N leads          (um contato pode reentrar como lead novo)
leads    1──N lead_events
leads    0..1──1 opportunities

opportunities 1──N opportunity_stage_history
opportunities 1──N touchpoints
opportunities 1──N attribution_results

whatsapp_contacts 1──N whatsapp_conversations 1──N whatsapp_messages
```

### A cadeia de atribuição

Esta é a espinha dorsal do produto. É o caminho que precisa estar íntegro para
que a seção 32 do Master Prompt seja respondível:

```
content_ideas.source_insight_id  →  ai_insights
        ▲
content_assets.idea_id
        ▲
social_posts.asset_id
        ▲
touchpoints.social_post_id / .asset_id
        ▲
leads.origin_asset_id  ──▶  opportunities.lead_id
                                    │
                                    ├─▶ opportunities.origin_asset_id
                                    ├─▶ opportunities.origin_campaign_id
                                    └─▶ attribution_results (4 modelos)
```

Cada seta é uma FK real. "Qual tema gerou mais vendas?" vira:

```sql
select p.name as pilar,
       sum(ar.attributed_amount) as receita_atribuida
from attribution_results ar
join content_assets ca  on ca.id = ar.asset_id
join content_ideas ci   on ci.id = ca.idea_id
join content_pillars p  on p.id = ci.pillar_id
where ar.organization_id = $1
  and ar.model = 'position_based'
group by 1 order by 2 desc;
```

Se qualquer FK dessa cadeia for omitida numa fase, a pergunta deixa de ter
resposta — e reconstruir o vínculo depois é impossível, porque o dado de origem
não foi capturado no momento do evento. **Esta é a razão pela qual as colunas de
origem entram nas tabelas desde a primeira versão, mesmo antes de existir tela
que as use.**

### Views materializadas (FASE 18)

```sql
mv_content_performance   -- por asset: impressões, engajamento, leads, oportunidades, receita
mv_channel_performance   -- por canal e mês: leads, CPL, pipeline, receita, ROI
mv_campaign_performance  -- por campanha: enviados, respostas, reuniões, oportunidades
mv_pipeline_snapshot     -- foto diária do funil por estágio
```

Atualizadas por `REFRESH MATERIALIZED VIEW CONCURRENTLY` no WF-013 noturno.
Índice único obrigatório em cada uma para permitir o modo `CONCURRENTLY`.

---

## §6. Enums consolidados

| Enum | Valores |
|---|---|
| `org_role` | owner, admin, operator, analyst, viewer |
| `membership_status` | invited, active, suspended |
| `content_status` | draft, review, approved, scheduled, published, failed, cancelled |
| `social_channel` | linkedin, instagram, facebook, youtube, tiktok, x, blog |
| `publish_status` | pending, locked, running, succeeded, failed, cancelled, skipped |
| `account_status` | connected, expiring, expired, revoked, error |
| `prospect_stage` | discovered, researched, prioritized, contacted, engaged, converted, disqualified |
| `verification_status` | verified, unverified, unknown |
| `outreach_channel` | email, whatsapp, linkedin |
| `contact_state` | pending, active, replied, stopped, completed, bounced, suppressed |
| `lead_status` | new, qualified, contacted, engaged, nurturing, converted, disqualified |
| `ai_mode` | autonomous, assist, off |
| `approval_mode` | auto, approval_required, manual |
| `run_status` | running, succeeded, failed, partial, cancelled |

Estágios de pipeline (seção 31) são **linhas em `pipeline_stages`**, não enum —
porque funil comercial muda quando o processo comercial muda — e ele muda.
Trade-off
consciente: perde-se validação no banco, ganha-se a extensibilidade exigida pela
seção 60.
