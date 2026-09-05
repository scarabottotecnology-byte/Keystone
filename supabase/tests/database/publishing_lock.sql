-- FASE 6 · subtarefa 11 — concorrência e idempotência da publicação.
--
-- O critério de aceite é explícito: "dois workers disputando o mesmo job: um
-- vence" e "execução dupla do WF-002 produz uma publicação". Publicar duas
-- vezes na página de uma consultoria é dano de marca — é a razão de existir
-- das três camadas descritas em `social-publish/index.ts`, e este arquivo
-- prova as que vivem no banco.
--
-- Limitação honesta desta suíte: pgTAP roda numa única conexão, então o que
-- se prova aqui é a garantia de *transição de estado* (o segundo `claim` não
-- encontra mais o job disponível), não o paralelismo real de duas conexões
-- simultâneas. O `for update skip locked` da função existe para o caso
-- paralelo e não é exercitado por este teste — está registrado em
-- docs/21-EXECUCAO-FASE-6.md como o que falta para fechar a prova.
begin;

select plan(9);

-- ── Cenário ──────────────────────────────────────────────────────────────────
create temp table fixture as
with org as (
  select id from organizations where slug = 'keystone'
),
asset as (
  insert into content_assets (organization_id, channel, headline, status)
  select id, 'linkedin', 'Peça para o teste de lock', 'approved' from org
  returning id, organization_id
),
account as (
  insert into social_accounts (organization_id, provider, external_account_id, token_ref)
  select id, 'linkedin', 'urn:li:organization:pgtap', 'ref-pgtap' from org
  returning id, organization_id
)
select
  (select id from org)     as org_id,
  (select id from asset)   as asset_id,
  (select id from account) as account_id;

-- A conta nasce com `integration` no default `direct`, e desde
-- `20260822130000_claim_skips_unconfigured_accounts.sql` o `claim` só
-- reivindica job cuja conta tenha credencial — para `direct`, uma linha em
-- `private.oauth_tokens` casando por `token_ref`. Sem ela a conta é pulada,
-- e este arquivo, que existe para provar o lock, nunca chegava a exercitar
-- lock nenhum: as asserções de `count = 0` passavam por vacuidade.
insert into private.oauth_tokens (
  ref, organization_id, provider, access_token, expires_at
)
select 'ref-pgtap', org_id, 'linkedin', 'token-pgtap', now() + interval '1 day'
  from fixture;

insert into publishing_jobs (organization_id, asset_id, social_account_id, run_at)
select org_id, asset_id, account_id, now() - interval '5 minutes' from fixture;

-- ── Worker A reivindica ──────────────────────────────────────────────────────
create temp table claim_a as
select * from claim_publishing_job(
  (select org_id from fixture), 'worker-A', 10
);

select is(
  (select count(*)::int from claim_a),
  1,
  'worker A reivindica o job vencido'
);

select is(
  (select status::text from publishing_jobs),
  'locked',
  'e o job fica travado'
);

select is(
  (select locked_by from publishing_jobs),
  'worker-A',
  'com o nome de quem travou registrado'
);

select is(
  (select attempt from publishing_jobs),
  1,
  'e a tentativa contabilizada — sem isso o job retentaria para sempre'
);

-- ── Worker B tenta o mesmo job ───────────────────────────────────────────────
create temp table claim_b as
select * from claim_publishing_job(
  (select org_id from fixture), 'worker-B', 10
);

select is(
  (select count(*)::int from claim_b),
  0,
  'worker B não recebe nada — o job já é de A (a garantia da subtarefa 11)'
);

select is(
  (select locked_by from publishing_jobs),
  'worker-A',
  'e o dono do lock não muda por causa da segunda tentativa'
);

-- ── Job fora da janela não é reivindicado ────────────────────────────────────
update publishing_jobs set status = 'pending', locked_by = null, attempt = 0,
       run_at = now() + interval '1 hour';

select is(
  (select count(*)::int from claim_publishing_job(
    (select org_id from fixture), 'worker-C', 10
  )),
  0,
  'job agendado para o futuro não é reivindicado antes da hora'
);

-- ── Job que esgotou as tentativas para de ser reivindicado ───────────────────
update publishing_jobs set status = 'failed', run_at = now() - interval '1 minute',
       attempt = max_attempts;

select is(
  (select count(*)::int from claim_publishing_job(
    (select org_id from fixture), 'worker-D', 10
  )),
  0,
  'job que esgotou max_attempts não volta para a fila — vai para revisão humana'
);

-- ── Idempotência: a mesma chave não gera duas publicações ───────────────────
-- Terceira camada da defesa: mesmo que lock e chave determinística falhem, a
-- restrição do banco recusa a segunda linha.
insert into social_posts (organization_id, social_account_id, channel, idempotency_key)
select org_id, account_id, 'linkedin', 'chave-repetida' from fixture;

select throws_ok(
  $$ insert into social_posts (organization_id, social_account_id, channel, idempotency_key)
     select org_id, account_id, 'linkedin', 'chave-repetida' from fixture $$,
  '23505',
  null,
  'a mesma chave de idempotência não entra duas vezes — execução dupla do WF-002 dá uma publicação'
);

select * from finish();
rollback;
