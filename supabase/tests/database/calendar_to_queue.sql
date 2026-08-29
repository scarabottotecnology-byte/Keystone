-- A ponte calendário → fila.
--
-- `enqueue_due_publications` é o elo que faltava: sem ele o worker rodava a
-- cada 15 minutos sobre uma fila que ninguém enchia. O risco agora é o
-- oposto — enfileirar o que não devia. Este arquivo prova as quatro recusas
-- que importam, e que cada uma delas **diz o motivo** em vez de descartar o
-- item em silêncio.
--
-- Roda inteiro dentro de uma transação com `rollback`: nada aqui sobra no
-- banco, nem mesmo em caso de falha no meio.
begin;

select plan(11);

-- ── Cenário ─────────────────────────────────────────────────────────────────
--
-- Duas organizações: a Keystone (que já tem as contas do Buffer) e uma
-- organização de teste sem conta nenhuma, para exercitar a recusa por
-- ausência de canal sem mexer nas contas reais.
create temp table fixture as
with org as (
  select id from organizations where slug = 'keystone'
),
outra_org as (
  insert into organizations (slug, legal_name, display_name)
  values ('org-teste-ponte', 'Org Teste Ponte LTDA', 'Org Teste Ponte')
  returning id
),
-- Peça aprovada, no canal que tem exatamente uma conta conectada.
peca_ok as (
  insert into content_assets (organization_id, channel, headline, status)
  select org.id, 'linkedin', 'Peça aprovada', 'approved' from org
  returning id, organization_id
),
-- Peça ainda em revisão: não pode entrar na fila.
peca_em_revisao as (
  insert into content_assets (organization_id, channel, headline, status)
  select org.id, 'linkedin', 'Peça em revisão', 'review' from org
  returning id
),
-- Peça aprovada numa organização sem nenhuma conta conectada.
peca_sem_conta as (
  insert into content_assets (organization_id, channel, headline, status)
  select outra_org.id, 'linkedin', 'Peça órfã', 'approved' from outra_org
  returning id
),
-- Item vencido, tudo em ordem: deve virar job.
cal_ok as (
  insert into content_calendar
    (organization_id, asset_id, channel, scheduled_for, status)
  select organization_id, id, 'linkedin', now() - interval '5 minutes',
         'scheduled'
  from peca_ok
  returning id
),
-- Item vencido, mas a peça não está aprovada.
cal_em_revisao as (
  insert into content_calendar
    (organization_id, asset_id, channel, scheduled_for, status)
  select (select id from org), id, 'linkedin', now() - interval '7 minutes',
         'scheduled'
  from peca_em_revisao
  returning id
),
-- Item muito no futuro: fora do horizonte, não deve ser tocado.
cal_futuro as (
  insert into content_calendar
    (organization_id, asset_id, channel, scheduled_for, status)
  select organization_id, id, 'linkedin', now() + interval '10 days',
         'scheduled'
  from peca_ok
  returning id
),
-- Item vencido numa organização sem conta conectada no canal.
cal_sem_conta as (
  insert into content_calendar
    (organization_id, asset_id, channel, scheduled_for, status)
  select (select id from outra_org), id, 'linkedin',
         now() - interval '5 minutes', 'scheduled'
  from peca_sem_conta
  returning id
)
select
  (select id from org)             as org_id,
  (select id from outra_org)       as outra_org_id,
  (select id from cal_ok)          as cal_ok,
  (select id from cal_em_revisao)  as cal_em_revisao,
  (select id from cal_futuro)      as cal_futuro,
  (select id from cal_sem_conta)   as cal_sem_conta;

-- ── Primeira varredura ──────────────────────────────────────────────────────
create temp table varredura_1 as
select * from enqueue_due_publications(
  (select org_id from fixture), 60
);

-- Escopado ao item do cenário de propósito: contar o total de enfileirados
-- quebraria em qualquer banco que já tenha calendário real vencido, e a
-- propriedade que interessa é sobre este item, não sobre a contagem.
select is(
  (select outcome from varredura_1
    where calendar_item_id = (select cal_ok from fixture)),
  'queued',
  'o item vencido com peça aprovada e conta única vira job'
);

select isnt(
  (select job_id from varredura_1
    where calendar_item_id = (select cal_ok from fixture)),
  null,
  'o job criado tem identificador'
);

-- ── Recusa 1: peça não aprovada ─────────────────────────────────────────────
select is(
  (select outcome from varredura_1
    where calendar_item_id = (select cal_em_revisao from fixture)),
  'skipped',
  'peça em revisão não entra na fila'
);

select matches(
  (select enqueue_error from content_calendar
    where id = (select cal_em_revisao from fixture)),
  'review',
  'o motivo gravado nomeia o status que barrou — não some em silêncio'
);

-- ── Recusa 2: horizonte ─────────────────────────────────────────────────────
select is(
  (select count(*)::int from varredura_1
    where calendar_item_id = (select cal_futuro from fixture)),
  0,
  'item fora do horizonte não é sequer avaliado'
);

select is(
  (select enqueued_at from content_calendar
    where id = (select cal_futuro from fixture)),
  null,
  'item futuro segue não enfileirado'
);

-- ── Recusa 3: nenhuma conta conectada no canal ──────────────────────────────
create temp table varredura_outra as
select * from enqueue_due_publications(
  (select outra_org_id from fixture), 60
);

select is(
  (select outcome from varredura_outra
    where calendar_item_id = (select cal_sem_conta from fixture)),
  'skipped',
  'sem conta conectada no canal, o item não vira job'
);

select matches(
  (select enqueue_error from content_calendar
    where id = (select cal_sem_conta from fixture)),
  'Nenhuma conta',
  'e o motivo diz que falta conta, em vez de deixar o item mudo'
);

-- ── Isolamento entre organizações ───────────────────────────────────────────
--
-- A função é `security invoker`, mas quem chama é `service_role`, que tem
-- BYPASSRLS. O filtro explícito por organização é o que impede a varredura
-- de uma organização alcançar o calendário da outra.
select is(
  (select count(*)::int from varredura_outra
    where calendar_item_id in (
      select id from content_calendar
       where organization_id = (select org_id from fixture)
    )),
  0,
  'a varredura de uma organização não toca no calendário da outra'
);

-- ── Reexecução não duplica ──────────────────────────────────────────────────
--
-- É a garantia que sustenta um cron de 15 em 15 minutos: rodar de novo sobre
-- o mesmo calendário não pode gerar uma segunda publicação.
create temp table varredura_2 as
select * from enqueue_due_publications(
  (select org_id from fixture), 60
);

select is(
  (select count(*)::int from varredura_2
    where calendar_item_id = (select cal_ok from fixture)),
  0,
  'a segunda varredura nem revisita o item já enfileirado'
);

select is(
  (select count(*)::int from publishing_jobs
    where calendar_id = (select cal_ok from fixture)),
  1,
  'e continua existindo um único job para aquele item de calendário'
);

select * from finish();
rollback;
