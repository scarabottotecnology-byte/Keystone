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
begin;

select plan(16);

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

-- ── O catálogo confirma a ausência estrutural, não só o comportamento ───────
-- As duas provas se complementam: os testes acima provam que a tentativa
-- falha; esta prova por que ela falha — porque a política não existe, não
-- porque algo mais a está bloqueando de forma incidental.
select is(
  (
    select count(*)::int
      from pg_policies
     where schemaname = 'public'
       and tablename in (
             'organizations', 'profiles', 'memberships',
             'audit_log', 'idempotency_keys'
           )
       and 'anon' = any(roles)
  ),
  0,
  'nenhuma política, em nenhuma das cinco tabelas, concede qualquer coisa a anon'
);

select is(
  (
    select bool_and(relforcerowsecurity)
      from pg_class
     where relnamespace = 'public'::regnamespace
       and relname in (
             'organizations', 'profiles', 'memberships',
             'audit_log', 'idempotency_keys'
           )
  ),
  true,
  'FORCE ROW LEVEL SECURITY está ativo nas cinco — vale até para o dono da tabela'
);

select * from finish();
rollback;
