-- Débito da FASE 1, subtarefas 9–10 — agora desbloqueado pela FASE 2.
--
-- `ai-gateway` foi adiado na FASE 1 porque dependia de `organizations`, que só
-- nasceu na FASE 2 (docs/13-EXECUCAO-FASE-1.md, seção "Pendente"). A FASE 4
-- não anda sem ele: os agentes A1 e A2 chamam LLM exclusivamente por aqui —
-- "nenhum código de produto chama provedor diretamente" (docs/03 §3.7).
--
-- Fonte da verdade: docs/02-MODELO-DE-DADOS.md §4.9 (AI Core) e §4.10
-- (Automation & Observability). Mesma regra de sempre (docs/07 §2): nenhuma
-- tabela é criada antes da própria política de RLS.

create type approval_mode as enum ('auto', 'approval_required', 'manual');
create type run_status as enum ('running', 'succeeded', 'failed', 'partial', 'cancelled');

-- ── ai_providers ──────────────────────────────────────────────────────────────
-- `config` nunca guarda segredo — a chave de API vive como Edge Function
-- secret (`supabase secrets set`), lida por `Deno.env.get` dentro do
-- `ai-gateway`, nunca nesta tabela. `config` só guarda parâmetro não sensível
-- (ex.: base_url, timeout).
create table ai_providers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  key             text not null,
  priority        int not null default 100,
  is_active       boolean not null default true,
  config          jsonb not null default '{}'::jsonb,
  unique (organization_id, key)
);

alter table ai_providers enable row level security;
alter table ai_providers force row level security;

create policy tenant_select on ai_providers for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on ai_providers for insert to authenticated
  with check (app.is_org_admin(organization_id));

create policy admin_update on ai_providers for update to authenticated
  using      (app.is_org_admin(organization_id))
  with check (app.is_org_admin(organization_id));

create policy admin_delete on ai_providers for delete to authenticated
  using (app.is_org_admin(organization_id));

-- ── ai_prompts ────────────────────────────────────────────────────────────────
-- `organization_id null` = prompt global, da plataforma — é assim que A1 e A2
-- nascem nesta migração: prompt de todo mundo, sem organização dona. Uma
-- organização enxerga os globais mais os próprios; só escreve nos próprios.
-- Ninguém escreve num prompt global pelo cliente — nasce por migração/seed,
-- igual à Keystone em `organizations`.
create table ai_prompts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
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

alter table ai_prompts enable row level security;
alter table ai_prompts force row level security;

create policy tenant_select on ai_prompts for select to authenticated
  using (
    organization_id is null
    or organization_id in (select app.current_org_ids())
  );

create policy admin_insert on ai_prompts for insert to authenticated
  with check (organization_id is not null and app.is_org_admin(organization_id));

create policy admin_update on ai_prompts for update to authenticated
  using      (organization_id is not null and app.is_org_admin(organization_id))
  with check (organization_id is not null and app.is_org_admin(organization_id));

-- Sem DELETE: um prompt sai de circulação com `is_active = false`, nunca
-- apagado — apagar destruiria o histórico de qual versão gerou qual saída.

-- ── ai_invocations ───────────────────────────────────────────────────────────
-- Toda chamada ao `ai-gateway` grava uma linha aqui, sucesso ou falha — é o
-- que sustenta `ai_usage_daily` e o orçamento diário (docs/05 §1).
create table ai_invocations (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references organizations (id) on delete cascade,
  correlation_id     text,
  prompt_key         text,
  prompt_version     int,
  operation          text not null,
  provider           text not null,
  model              text not null,
  input_tokens       int,
  output_tokens      int,
  cached_tokens      int,
  estimated_cost_usd numeric(12, 6),
  latency_ms         int,
  status             text not null,
  error              text,
  fallback_from      text,
  subject_type       text,
  subject_id         uuid,
  created_at         timestamptz not null default now()
);
create index on ai_invocations (organization_id, created_at desc);
create index on ai_invocations (organization_id, operation, created_at desc);

alter table ai_invocations enable row level security;
alter table ai_invocations force row level security;

create policy tenant_select on ai_invocations for select to authenticated
  using (organization_id in (select app.current_org_ids()));

-- `admin_insert`, não `tenant_insert`: hoje só automação (A1/A2, via
-- service_role, que ignora RLS de propósito) e teste administrativo escrevem
-- aqui. Quando uma função interativa disparar IA a pedido de um operador
-- comum, esta política é o primeiro lugar a revisar.
create policy admin_insert on ai_invocations for insert to authenticated
  with check (app.is_org_admin(organization_id));

-- Sem UPDATE/DELETE: registro de custo é fato histórico, igual a audit_log.

-- ── ai_usage_daily (view) ────────────────────────────────────────────────────
-- Não existe tabela separada de uso — seria uma segunda fonte de verdade que
-- pode divergir de `ai_invocations`. `security_invoker = true` é obrigatório:
-- sem ele, a view roda com o privilégio de quem a criou (postgres), ignora a
-- RLS de `ai_invocations` por baixo, e qualquer um com SELECT na view veria o
-- custo de IA de todas as organizações — a mesma classe do achado C-01, agora
-- em view em vez de tabela ou função.
create view ai_usage_daily
with (security_invoker = true) as
select organization_id,
       date_trunc('day', created_at)::date as day,
       provider,
       model,
       operation,
       count(*) as calls,
       sum(input_tokens) as input_tokens,
       sum(output_tokens) as output_tokens,
       sum(estimated_cost_usd) as cost_usd
  from ai_invocations
 group by 1, 2, 3, 4, 5;

-- ── automation_definitions ───────────────────────────────────────────────────
-- Catálogo de automações — inclui já os campos que a FASE 20 (Daily Growth
-- Cycle) vai exercitar de ponta a ponta (schedule_cron, timezone,
-- approval_mode), para não precisar de uma segunda migração só para
-- acrescentar três colunas.
create table automation_definitions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  key             text not null,
  name            text not null,
  description     text,
  schedule_cron   text,
  timezone        text not null default 'America/Sao_Paulo',
  approval_mode   approval_mode not null default 'approval_required',
  is_enabled      boolean not null default false,
  config          jsonb not null default '{}'::jsonb,
  unique (organization_id, key)
);

alter table automation_definitions enable row level security;
alter table automation_definitions force row level security;

create policy tenant_select on automation_definitions for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on automation_definitions for insert to authenticated
  with check (app.is_org_admin(organization_id));

create policy admin_update on automation_definitions for update to authenticated
  using      (app.is_org_admin(organization_id))
  with check (app.is_org_admin(organization_id));

create policy admin_delete on automation_definitions for delete to authenticated
  using (app.is_org_admin(organization_id));

-- ── automation_runs ──────────────────────────────────────────────────────────
create table automation_runs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations (id) on delete cascade,
  definition_key   text not null,
  correlation_id   text not null,
  trigger_type     text not null,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  status           run_status not null default 'running',
  items_processed  int not null default 0,
  items_succeeded  int not null default 0,
  items_failed     int not null default 0,
  error_summary    text,
  unique (organization_id, correlation_id)
);

alter table automation_runs enable row level security;
alter table automation_runs force row level security;

create policy tenant_select on automation_runs for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on automation_runs for insert to authenticated
  with check (app.is_org_admin(organization_id));

-- Sem UPDATE via política de cliente: uma run em andamento fecha (`succeeded`
-- / `failed` / `finished_at`) por dentro da própria automação, via
-- service_role — que ignora RLS de propósito, não por atalho (a automação não
-- tem sessão de usuário para agir em nome de; é exatamente o caso legítimo de
-- service_role, distinto do achado C-01, que era RLS *pretendendo* proteger e
-- falhando).

-- ── automation_logs ──────────────────────────────────────────────────────────
create table automation_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  run_id          uuid not null references automation_runs (id) on delete cascade,
  level           text not null default 'info',
  step            text not null,
  message         text not null,
  payload         jsonb,
  at              timestamptz not null default now()
);
create index on automation_logs (run_id, at);

alter table automation_logs enable row level security;
alter table automation_logs force row level security;

create policy tenant_select on automation_logs for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on automation_logs for insert to authenticated
  with check (app.is_org_admin(organization_id));

-- ── integration_logs ─────────────────────────────────────────────────────────
create table integration_logs (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations (id) on delete cascade,
  provider             text not null,
  operation            text not null,
  status_code          int,
  latency_ms           int,
  rate_limit_remaining int,
  retry_after_s        int,
  error_code           text,
  error_message        text,
  request_summary      jsonb,
  correlation_id       text,
  at                   timestamptz not null default now()
);
create index on integration_logs (organization_id, at desc);

alter table integration_logs enable row level security;
alter table integration_logs force row level security;

create policy tenant_select on integration_logs for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on integration_logs for insert to authenticated
  with check (app.is_org_admin(organization_id));

-- ── error_logs ────────────────────────────────────────────────────────────────
-- `organization_id` nullable de propósito, igual a `ai_prompts`: um erro de
-- infraestrutura pode não pertencer a organização nenhuma. Linha nula não
-- aparece para ninguém pelo cliente — só é alcançável por service_role, o que
-- é correto para o que é: operação de plataforma, não dado de organização.
--
-- Única tabela desta migração com UPDATE de cliente: agrega por `stack_hash`
-- com contador em vez de uma linha por ocorrência (documento 02 §4.10) — sem
-- UPDATE não dá para incrementar `occurrences`.
create table error_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  source          text not null,
  severity        text not null,
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

alter table error_logs enable row level security;
alter table error_logs force row level security;

create policy tenant_select on error_logs for select to authenticated
  using (
    organization_id is not null
    and app.is_org_admin(organization_id)
  );

create policy admin_insert on error_logs for insert to authenticated
  with check (organization_id is not null and app.is_org_admin(organization_id));

create policy admin_update on error_logs for update to authenticated
  using      (organization_id is not null and app.is_org_admin(organization_id))
  with check (organization_id is not null and app.is_org_admin(organization_id));

-- Sem DELETE: erro resolvido ganha `resolved_at`, não desaparece — apagar
-- destruiria o histórico de confiabilidade que a FASE 21 (observabilidade)
-- audita.
