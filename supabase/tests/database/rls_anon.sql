-- Regressão do achado C-01 — FASE 2, subtarefa 12.
--
-- O achado original: políticas de RLS concedendo SELECT, INSERT e DELETE ao
-- papel `anon` com `USING (true)`. RLS habilitada dava aparência de proteção;
-- a condição anulava tudo.
--
-- Este arquivo prova a ausência da mesma classe de falha nas tabelas desta
-- FASE. `anon` não deve ler, escrever, alterar nem apagar linha nenhuma —
-- não porque alguém lembrou de negar, mas porque nenhuma política o concede.
--
-- Roda via `supabase test db` (usa pgTAP, harness padrão da Supabase CLI).
-- Convenção: um `describe` por tabela, testando as quatro operações.
--
-- A partir da FASE 3, o arquivo também prova a ausência de uma segunda classe
-- de falha, irmã da primeira mas em função e não em tabela: o schema `public`
-- deste projeto concede EXECUTE a `anon` por padrão em toda função nova
-- (`pg_default_acl`, não herdado de `PUBLIC` — ver a migração
-- `command_center_revoke_anon_execute.sql`). Uma RPC nova que esqueça o
-- revoke explícito por role fica chamável por qualquer um, sem sessão
-- nenhuma — e passaria despercebida sem um teste que olhe o catálogo.
-- A partir da FASE 4, as duas provas de catálogo (linhas ~260 abaixo) deixam
-- de listar tabela por nome e passam a varrer todo o schema `public` — a
-- lista manual já tinha sete entradas e ia crescer a cada fase; generalizar
-- agora é o que a FASE 22 pede antecipado ("matriz gerada do catálogo... uma
-- tabela sem política falha o CI por omissão"). As tabelas anteriores a esta
-- fase continuam com bloco de comportamento próprio, abaixo; as desta fase
-- (FASE 4) têm um representante de cada migração testado por comportamento
-- (`ai_invocations`, `ai_prompts`, `content_pillars`) — o resto já está
-- coberto estruturalmente pela varredura de catálogo, que não lista nome.
begin;

select plan(29);

-- ── organizations ────────────────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from organizations),
  0,
  'anon não enxerga nenhuma organização via SELECT'
);

select throws_ok(
  $$ insert into organizations (slug, legal_name, display_name)
     values ('invasor', 'x', 'x') $$,
  '42501',
  null,
  'anon não consegue inserir organização'
);

select lives_ok(
  $$ update organizations set display_name = 'invadido' where slug = 'keystone' $$,
  'UPDATE de anon não lança erro'
);
reset role; -- anon também não vê a linha por SELECT — a checagem abaixo precisa do papel privilegiado
select is(
  (select display_name from organizations where slug = 'keystone'),
  'Keystone',
  'e não altera a linha — FORCE RLS faz o UPDATE não achar nada para mudar'
);

set local role anon;
select lives_ok(
  $$ delete from organizations where slug = 'keystone' $$,
  'DELETE de anon não lança erro'
);
reset role;
select is(
  (select count(*)::int from organizations where slug = 'keystone'),
  1,
  'e a organização Keystone continua existindo — o DELETE não apagou nada'
);

-- ── profiles ─────────────────────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from profiles),
  0,
  'anon não enxerga nenhum perfil'
);

select throws_ok(
  $$ insert into profiles (id, full_name) values (gen_random_uuid(), 'x') $$,
  '42501',
  null,
  'anon não consegue inserir perfil'
);

reset role;

-- ── memberships ──────────────────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from memberships),
  0,
  'anon não enxerga nenhum vínculo'
);

select throws_ok(
  $$ insert into memberships (organization_id, user_id)
     values (
       (select id from organizations limit 1),
       gen_random_uuid()
     ) $$,
  '42501',
  null,
  'anon não consegue se auto-conceder um vínculo'
);

reset role;

-- ── audit_log ────────────────────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from audit_log),
  0,
  'anon não enxerga a trilha de auditoria'
);

select throws_ok(
  $$ insert into audit_log (organization_id, action, subject_type)
     values ((select id from organizations limit 1), 'x', 'x') $$,
  '42501',
  null,
  'anon não consegue escrever na trilha de auditoria'
);

reset role;

-- ── idempotency_keys ─────────────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from idempotency_keys),
  0,
  'anon não enxerga chave de idempotência nenhuma'
);

select throws_ok(
  $$ insert into idempotency_keys (organization_id, scope, key)
     values ((select id from organizations limit 1), 'x', 'x') $$,
  '42501',
  null,
  'anon não consegue gravar chave de idempotência'
);

reset role;

-- ── growth_score_config ─────────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from growth_score_config),
  0,
  'anon não enxerga configuração de Growth Score nenhuma'
);

select throws_ok(
  $$ insert into growth_score_config (organization_id)
     values ((select id from organizations limit 1)) $$,
  '42501',
  null,
  'anon não consegue gravar configuração de Growth Score'
);

reset role;

-- ── growth_score_snapshots ──────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from growth_score_snapshots),
  0,
  'anon não enxerga snapshot de Growth Score nenhum'
);

select throws_ok(
  $$ insert into growth_score_snapshots (organization_id, snapshot_date)
     values ((select id from organizations limit 1), current_date) $$,
  '42501',
  null,
  'anon não consegue gravar snapshot de Growth Score'
);

reset role;

-- ── ai_invocations (FASE 4 — débito da FASE 1) ──────────────────────────────
set local role anon;

select is(
  (select count(*)::int from ai_invocations),
  0,
  'anon não enxerga nenhuma invocação de IA'
);

select throws_ok(
  $$ insert into ai_invocations (organization_id, operation, provider, model, status)
     values ((select id from organizations limit 1), 'x', 'x', 'x', 'success') $$,
  '42501',
  null,
  'anon não consegue gravar invocação de IA'
);

reset role;

-- ── ai_prompts (FASE 4) ──────────────────────────────────────────────────────
-- O caso extra aqui: existe prompt com `organization_id null` (global) de
-- verdade na base — os prompts de A1/A2, semeados nesta fase. A política é
-- `to authenticated`, então `anon` não deveria enxergar nem esse, mesmo sendo
-- "de todo mundo". Testar isso é o que distingue "RLS bloqueia por role" de
-- "RLS bloqueia só por organização" — são condições diferentes na mesma
-- política, e só uma delas foi exercitada nas tabelas anteriores.
set local role anon;

select is(
  (select count(*)::int from ai_prompts),
  0,
  'anon não enxerga nenhum prompt — nem os globais (organization_id null)'
);

select throws_ok(
  $$ insert into ai_prompts (key, system_prompt, user_template)
     values ('invasor', 'x', 'x') $$,
  '42501',
  null,
  'anon não consegue gravar prompt'
);

reset role;

-- ── content_pillars (FASE 4) ─────────────────────────────────────────────────
set local role anon;

select is(
  (select count(*)::int from content_pillars),
  0,
  'anon não enxerga nenhum pilar de conteúdo — nem os 13 da Keystone'
);

select throws_ok(
  $$ insert into content_pillars (organization_id, name, slug)
     values ((select id from organizations limit 1), 'x', 'x') $$,
  '42501',
  null,
  'anon não consegue gravar pilar de conteúdo'
);

reset role;

-- ── rpc_command_center() e rpc_next_best_actions() ──────────────────────────
-- Não é RLS — é EXECUTE na função em si. Ver a nota no topo do arquivo: o
-- privilégio padrão do schema concede isso a `anon` a menos que alguém
-- revogue explicitamente por role.
set local role anon;

select throws_ok(
  $$ select rpc_command_center() $$,
  '42501',
  'permission denied for function rpc_command_center',
  'anon não pode chamar rpc_command_center — sem GRANT, não só sem sessão'
);

select throws_ok(
  $$ select rpc_next_best_actions() $$,
  '42501',
  'permission denied for function rpc_next_best_actions',
  'anon não pode chamar rpc_next_best_actions — sem GRANT, não só sem sessão'
);

reset role;

-- ── O catálogo confirma a ausência estrutural, não só o comportamento ───────
-- As duas provas se complementam: os testes acima provam que a tentativa
-- falha; esta prova por que ela falha — porque a política não existe, não
-- porque algo mais a está bloqueando de forma incidental.
--
-- Varre TODO o schema `public`, não uma lista de nomes escrita à mão — uma
-- tabela nova sem política contra `anon` falha este teste automaticamente,
-- nunca por alguém lembrar de acrescentá-la na lista.
select is(
  (
    select count(*)::int
      from pg_policies
     where schemaname = 'public'
       and 'anon' = any(roles)
  ),
  0,
  'nenhuma política, em nenhuma tabela de public, concede qualquer coisa a anon'
);

select is(
  (
    select bool_and(relforcerowsecurity)
      from pg_class
     where relnamespace = 'public'::regnamespace
       and relkind = 'r'  -- tabela comum; exclui view (ai_usage_daily) e sequence
  ),
  true,
  'FORCE ROW LEVEL SECURITY está ativo em toda tabela de public — vale até para o dono'
);

-- Generaliza a descoberta desta fase para toda função presente e futura:
-- nenhuma função de `public` pode conceder EXECUTE a `anon`. Uma RPC nova
-- que esqueça o revoke por role falha este teste, em vez de ficar exposta em
-- silêncio até alguém notar.
select is(
  (
    select count(*)::int
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  0,
  'nenhuma função de public concede EXECUTE a anon'
);

select * from finish();
rollback;
