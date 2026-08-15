-- FASE 2 · subtarefas 1–4 — identidade, RLS e a organização Keystone.
--
-- Fonte da verdade: docs/02-MODELO-DE-DADOS.md §4.1, docs/07-SEGURANCA-LGPD-MULTITENANT.md §2.
--
-- Ordem dentro deste arquivo segue a regra que não se negocia (doc 07 §2):
-- nenhuma tabela é criada antes da política dela. Cada `create table` é
-- imediatamente seguido de `enable`/`force row level security` e das quatro
-- políticas — nunca existe uma janela em que a tabela está de pé sem RLS.

-- ── Schema auxiliar ──────────────────────────────────────────────────────────
-- `app` guarda função de RLS e de domínio. Nunca exposto via PostgREST.
create schema if not exists app;
revoke all on schema app from anon, authenticated;
grant usage on schema app to authenticated;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type org_role as enum ('owner', 'admin', 'operator', 'analyst', 'viewer');
create type membership_status as enum ('invited', 'active', 'suspended');

-- ── organizations ────────────────────────────────────────────────────────────
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

alter table organizations enable row level security;
alter table organizations force row level security;

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Espelho de auth.users. Não duplica e-mail nem senha.
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_path text,
  locale      text not null default 'pt-BR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;
alter table profiles force row level security;

-- ── memberships ──────────────────────────────────────────────────────────────
-- A tabela mais crítica do sistema: toda política de RLS depende dela.
create table memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            org_role not null default 'viewer',
  status          membership_status not null default 'active',
  invited_by      uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on memberships (user_id) where status = 'active';
create index on memberships (organization_id);

alter table memberships enable row level security;
alter table memberships force row level security;

-- ── app.current_org_ids() ────────────────────────────────────────────────────
--
-- SECURITY DEFINER: a política de RLS de `memberships` precisa consultar
-- `memberships`. Sem SECURITY DEFINER isso é recursão infinita — erro clássico
-- de RLS no Postgres. A função roda com privilégio do dono e ignora a RLS só
-- nessa leitura específica, que é intencional e restrita.
--
-- STABLE: o planejador avalia a função uma vez por statement, não por linha.
-- Numa varredura de 100 mil linhas, a diferença é entre uma consulta e cem mil.
--
-- set search_path: sem isso, uma função SECURITY DEFINER é vulnerável a
-- sequestro de search_path — um objeto malicioso num schema anterior seria
-- executado com privilégio elevado.
create or replace function app.current_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, app
as $$
  select organization_id
    from public.memberships
   where user_id = auth.uid()
     and status = 'active'
$$;

revoke all on function app.current_org_ids() from public;
grant execute on function app.current_org_ids() to authenticated;

-- ── app.is_org_admin(uuid) ───────────────────────────────────────────────────
-- Helper de RBAC: o requisitante é owner ou admin da organização informada.
-- Mesmas três razões de app.current_org_ids() acima.
create or replace function app.is_org_admin(target_org uuid)
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
       and role in ('owner', 'admin')
  )
$$;

revoke all on function app.is_org_admin(uuid) from public;
grant execute on function app.is_org_admin(uuid) to authenticated;

-- ── app.set_updated_at() ─────────────────────────────────────────────────────
-- Trigger genérico. Convenção do doc 02 §2: "updated_at (via trigger)".
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on organizations
  for each row execute function app.set_updated_at();

create trigger set_updated_at
  before update on profiles
  for each row execute function app.set_updated_at();

-- ── Políticas: organizations ─────────────────────────────────────────────────
-- Sem política de INSERT nem DELETE via cliente: a organização nasce por
-- provisionamento (abaixo) e por app.handle_new_user() no bootstrap do
-- primeiro usuário. Não há tela para criar ou apagar organização — ADR-014,
-- ferramenta interna, uma organização só.
create policy tenant_select on organizations for select to authenticated
  using (id in (select app.current_org_ids()));

create policy tenant_update on organizations for update to authenticated
  using      (app.is_org_admin(id))
  with check (app.is_org_admin(id));

-- ── Políticas: profiles ──────────────────────────────────────────────────────
-- Cada um vê o próprio perfil e o de quem divide organização consigo — a tela
-- de equipe precisa listar nome e avatar dos colegas.
create policy self_and_teammates_select on profiles for select to authenticated
  using (
    id = auth.uid()
    or id in (
      select user_id from memberships
       where organization_id in (select app.current_org_ids())
         and status = 'active'
    )
  );

create policy self_update on profiles for update to authenticated
  using      (id = auth.uid())
  with check (id = auth.uid());

-- Sem INSERT/DELETE via cliente: o ciclo de vida do perfil segue auth.users,
-- via app.handle_new_user() (criação) e ON DELETE CASCADE (remoção).

-- ── Políticas: memberships ───────────────────────────────────────────────────
create policy tenant_select on memberships for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy admin_insert on memberships for insert to authenticated
  with check (app.is_org_admin(organization_id));

create policy admin_update on memberships for update to authenticated
  using      (app.is_org_admin(organization_id))
  with check (app.is_org_admin(organization_id));

create policy admin_delete on memberships for delete to authenticated
  using (app.is_org_admin(organization_id));

-- ── audit_log ────────────────────────────────────────────────────────────────
create table audit_log (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  actor_id        uuid references auth.users (id),
  actor_type      text not null default 'user', -- user | system | ai | n8n
  action          text not null,                -- ex.: 'opportunity.stage_changed'
  subject_type    text not null,
  subject_id      uuid,
  before          jsonb,
  after           jsonb,
  correlation_id  text,
  ip_hash         text,                          -- hash, nunca IP em claro
  at              timestamptz not null default now()
);
create index on audit_log (organization_id, at desc);

alter table audit_log enable row level security;
alter table audit_log force row level security;

create policy tenant_select on audit_log for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy tenant_insert on audit_log for insert to authenticated
  with check (organization_id in (select app.current_org_ids()));

-- Sem UPDATE nem DELETE, de propósito: trilha de auditoria é append-only.
-- Não existir a política é o que impede a alteração — não é omissão.

-- ── idempotency_keys ─────────────────────────────────────────────────────────
create table idempotency_keys (
  organization_id uuid not null references organizations (id) on delete cascade,
  scope           text not null, -- 'social_publish' | 'outreach_send' | …
  key             text not null, -- chave natural determinística
  subject_type    text,
  subject_id      uuid,
  result          jsonb,
  created_at      timestamptz not null default now(),
  primary key (organization_id, scope, key)
);

alter table idempotency_keys enable row level security;
alter table idempotency_keys force row level security;

create policy tenant_select on idempotency_keys for select to authenticated
  using (organization_id in (select app.current_org_ids()));

create policy tenant_insert on idempotency_keys for insert to authenticated
  with check (organization_id in (select app.current_org_ids()));

create policy tenant_update on idempotency_keys for update to authenticated
  using      (organization_id in (select app.current_org_ids()))
  with check (organization_id in (select app.current_org_ids()));

-- Sem DELETE: liberar uma chave de idempotência usada é `update`, não `delete`
-- — ver supabase/functions/_shared/idempotency.ts. Apagar a linha destruiria o
-- histórico de que a operação já foi tentada.

-- ── Bootstrap: organização Keystone e o primeiro usuário ────────────────────
--
-- Não há tela de "criar organização" (ADR-014). A Keystone é provisionada
-- aqui, uma vez, por migração.
insert into organizations (slug, legal_name, display_name, plan)
values ('keystone', 'Keystone Controladoria', 'Keystone', 'internal')
on conflict (slug) do nothing;

-- ── app.handle_new_user() ────────────────────────────────────────────────────
--
-- Dispara em todo signup. Duas responsabilidades:
--
-- 1. Cria a linha de `profiles` — sem isto, todo signup exigiria um segundo
--    passo manual antes do usuário aparecer em qualquer lugar do sistema.
-- 2. Bootstrap de acesso: como não há convite por e-mail nem tela de
--    onboarding (ferramenta interna, uma organização só), o *primeiro* usuário
--    a se cadastrar vira `owner` da Keystone automaticamente. A partir do
--    segundo, o cadastro cria o perfil mas não concede associação — um
--    owner/admin precisa inserir a `membership` (via `admin_insert` acima).
--
-- SECURITY DEFINER com search_path fixo, pela mesma razão de
-- app.current_org_ids(): a função grava em tabelas que a RLS não deixaria o
-- processo de auth escrever de outra forma.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  keystone_id uuid;
  is_first    boolean;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  select id into keystone_id from public.organizations where slug = 'keystone';

  select not exists (
    select 1 from public.memberships where organization_id = keystone_id
  ) into is_first;

  if is_first then
    insert into public.memberships (organization_id, user_id, role, status)
    values (keystone_id, new.id, 'owner', 'active');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();
