-- FASE 6 · subtarefa 3 — estado do fluxo OAuth entre `oauth-start` e
-- `oauth-callback`.
--
-- Não está no documento 02: o modelo de dados descreve o *resultado* do
-- OAuth (`private.oauth_tokens`, `social_accounts`), não o estado
-- intermediário. Mas a subtarefa 3 pede PKCE, e PKCE exige que o
-- `code_verifier` sobreviva do início do fluxo até o callback — que chega
-- numa requisição diferente, sem sessão e vinda do provedor, não do
-- navegador do usuário autenticado.
--
-- Guardar o verifier no próprio `state` estaria errado: o `state` viaja na
-- URL, e um verifier visível na URL anula exatamente o que o PKCE protege.
-- Por isso ele fica aqui, no schema `private` (fora do PostgREST, como os
-- tokens), indexado pelo nonce que o `state` assinado carrega.
--
-- Linhas expiram: um fluxo abandonado não deve deixar credencial parcial
-- viva para sempre. `expires_at` é curto (minutos) e o callback recusa
-- estado vencido.
create table private.oauth_states (
  nonce           text primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete set null,
  provider        text not null,
  code_verifier   text not null,
  redirect_to     text,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  consumed_at     timestamptz
);

create index on private.oauth_states (expires_at);

-- Mesma defesa em profundidade de `private.oauth_tokens`.
alter table private.oauth_states enable row level security;
alter table private.oauth_states force row level security;

-- O `alter default privileges` da migração anterior só vale para tabelas
-- criadas *depois* dele — esta é uma delas, mas o grant explícito deixa a
-- intenção legível sem depender de ordem de migração.
grant select, insert, update, delete on private.oauth_states to service_role;
