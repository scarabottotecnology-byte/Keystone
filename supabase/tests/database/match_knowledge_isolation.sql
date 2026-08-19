-- Prova dedicada ao achado da migração `brand_and_knowledge_base.sql`
-- (FASE 5): sem o filtro explícito por `p_organization_id`,
-- `app.match_knowledge` vazaria conhecimento entre organizações quando
-- chamada por `service_role` (A1/A3) — que ignora RLS mesmo com FORCE
-- (BYPASSRLS). Este arquivo prova que o filtro em código segura a garantia
-- mesmo no caminho mais perigoso: um chamador com privilégio total.
--
-- Fora de `rls_anon.sql` de propósito: aquele arquivo prova o que `anon`
-- NÃO alcança por falta de política; este prova o que um chamador COM
-- privilégio total ainda assim não deveria devolver, por causa do filtro
-- explícito, não da RLS — uma classe de teste diferente.
--
-- O dono da conexão de teste (pgTAP roda como o dono do banco) não está
-- sujeito a RLS de tabela nenhuma aqui, mesmo com FORCE — a mesma ausência
-- de proteção que `service_role` tem em produção via BYPASSRLS. É
-- exatamente essa ausência que o teste precisa, para provar que o filtro em
-- código (não a RLS) é quem segura o isolamento neste caminho.
begin;

select plan(4);

do $$
declare
  org_a uuid;
  org_b uuid;
  doc_a uuid;
  doc_b uuid;
  probe vector(1536) := array_fill(1::float4, array[1536])::vector(1536);
begin
  insert into organizations (slug, legal_name, display_name)
  values ('pgtap-match-a', 'Org A de teste', 'Org A de teste')
  returning id into org_a;

  insert into organizations (slug, legal_name, display_name)
  values ('pgtap-match-b', 'Org B de teste', 'Org B de teste')
  returning id into org_b;

  insert into knowledge_documents (organization_id, title, source_type, status)
  values (org_a, 'Documento A', 'manual', 'indexed')
  returning id into doc_a;

  insert into knowledge_documents (organization_id, title, source_type, status)
  values (org_b, 'Documento B', 'manual', 'indexed')
  returning id into doc_b;

  -- Mesmo embedding nos dois chunks, de propósito: se o filtro por
  -- organização falhar, os dois empatam em similaridade e o de outra
  -- organização apareceria no resultado — o teste não deixa a diferença de
  -- distância vetorial mascarar uma falha de isolamento.
  insert into knowledge_chunks (organization_id, document_id, chunk_index, content, embedding)
  values (org_a, doc_a, 0, 'conteúdo da organização A', probe);

  insert into knowledge_chunks (organization_id, document_id, chunk_index, content, embedding)
  values (org_b, doc_b, 0, 'conteúdo da organização B', probe);
end $$;

select is(
  (
    select count(*)::int from app.match_knowledge(
      (select id from organizations where slug = 'pgtap-match-a'),
      (select array_fill(1::float4, array[1536])::vector(1536)),
      10, 0.0
    )
  ),
  1,
  'match_knowledge devolve exatamente 1 chunk para a organização A'
);

select is(
  (
    select document_id from app.match_knowledge(
      (select id from organizations where slug = 'pgtap-match-a'),
      (select array_fill(1::float4, array[1536])::vector(1536)),
      10, 0.0
    )
  ),
  (select id from knowledge_documents where organization_id = (select id from organizations where slug = 'pgtap-match-a')),
  'e é o documento da própria organização A, não o da B — mesmo com embedding idêntico'
);

select is(
  (
    select count(*)::int from app.match_knowledge(
      (select id from organizations where slug = 'pgtap-match-b'),
      (select array_fill(1::float4, array[1536])::vector(1536)),
      10, 0.0
    )
  ),
  1,
  'e o mesmo vale isoladamente para a organização B'
);

select is(
  (
    select document_id from app.match_knowledge(
      (select id from organizations where slug = 'pgtap-match-b'),
      (select array_fill(1::float4, array[1536])::vector(1536)),
      10, 0.0
    )
  ),
  (select id from knowledge_documents where organization_id = (select id from organizations where slug = 'pgtap-match-b')),
  'e é o documento da própria organização B, nunca o da A'
);

select * from finish();
rollback;
