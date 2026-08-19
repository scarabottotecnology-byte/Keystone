-- FASE 5 · subtarefa 6 (preparação) — ACHADO: `content_formats` está vazia.
--
-- A FASE 4 criou a tabela mas nunca semeou nenhuma linha — não havia
-- consumidor que precisasse de uma até agora. `content_assets.format_id`
-- não é opcional na prática: A3 precisa saber o canal e os limites do
-- formato antes de escrever a etapa `copy` (docs/05 §4: "ideia, formato,
-- marca, RAG" são a entrada de A3). Sem uma linha em `content_formats`,
-- não há o que escolher no payload de `content-factory` — corrigido aqui.
--
-- Três formatos de partida, cobrindo os dois canais que o resto do projeto
-- já usa (LinkedIn nas regras de calendário da FASE 4; Instagram citado no
-- roadmap como FASE 6/7). `spec` documentado por `docs/02 §4.3`: "limites de
-- caracteres, nº de slides, proporção" — ponto de partida razoável, não
-- regra do master prompt, editável quando a tela de configuração existir.
do $$
declare
  keystone_id uuid;
begin
  select id into keystone_id from organizations where slug = 'keystone';

  insert into content_formats (organization_id, key, channel, spec)
  values
    (keystone_id, 'text_post', 'linkedin', '{"char_limit": 3000}'::jsonb),
    (keystone_id, 'carousel', 'linkedin', '{"slides": 8, "char_limit_per_slide": 300}'::jsonb),
    (keystone_id, 'single_image', 'instagram', '{"char_limit": 2200, "aspect_ratio": "4:5"}'::jsonb)
  on conflict (organization_id, key, channel) do nothing;
end $$;
