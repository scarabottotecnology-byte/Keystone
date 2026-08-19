-- FASE 5 · subtarefa 5 — marca, metodologia e os prompts globais de A3/A4.
--
-- Fonte da verdade: docs/12-DETALHAMENTO-FASES.md, FASE 5, subtarefa 5, e
-- docs/05-AGENTES-DE-IA.md §4 (A3, A4). Mesmo racional da seed da FASE 4:
-- sem estas linhas, `ai-gateway.invoke()` não tem prompt para carregar
-- quando as Edge Functions A3/A4 forem construídas.
--
-- NOTA sobre `brand_services.methodology`: o texto completo dos métodos
-- ORBITA e RICE é propriedade intelectual da Keystone e não está descrito
-- em nenhum documento deste repositório — só o propósito de cada um
-- ("budget e acompanhamento", "custos", docs/02 §4.2 e docs/12 subtarefa 5).
-- Inventar o conteúdo da metodologia proprietária seria fabricar IP que não
-- existe — o oposto do que este projeto testa contra em todo agente A1–A9.
-- `methodology` fica `null`; um admin preenche via Settings quando a tela
-- existir. `description` e `target_pain` usam só o que os documentos afirmam.
do $$
declare
  keystone_id uuid;
  orbita_id   uuid;
  rice_id     uuid;
begin
  select id into keystone_id from organizations where slug = 'keystone';

  -- ── Marca ───────────────────────────────────────────────────────────────────
  insert into brand_profiles (
    organization_id, name, positioning, tone, audience,
    differentiators, forbidden_words, preferred_words
  )
  values (
    keystone_id,
    'Keystone Controladoria',
    'Consultoria de controladoria e FP&A que profissionaliza a gestão financeira de médias e grandes empresas, com metodologia própria em vez de genérica.',
    'Direto, técnico sem ser hermético, autoridade sem arrogância — como um controller sênior explicando para outro executivo, nunca como um vendedor.',
    'CFOs, controllers e sócios de médias e grandes empresas cuja gestão financeira não acompanhou o crescimento do negócio.',
    array[
      'Metodologia própria (ORBITA e RICE), não genérica',
      'Implementação, não só diagnóstico',
      'Controladoria como parceira estratégica, não centro de custo'
    ],
    array['garantido', 'o melhor do mercado', 'sem esforço', 'revolucionário', 'ninja', 'guru'],
    array['controladoria estratégica', 'previsibilidade financeira', 'decisão orientada a dado', 'margem', 'fluxo de caixa']
  )
  on conflict do nothing;

  -- ── Metodologia ────────────────────────────────────────────────────────────
  insert into brand_services (organization_id, name, slug, description, target_pain, is_proprietary)
  values
    (keystone_id, 'Método ORBITA', 'orbita',
     'Metodologia proprietária da Keystone para budget e acompanhamento orçamentário.',
     'Orçamento que não é acompanhado de perto e perde relevância ao longo do ano.',
     true),
    (keystone_id, 'Método RICE', 'rice',
     'Metodologia proprietária da Keystone para gestão de custos.',
     'Custo que não é rastreado por produto, centro ou canal, escondendo o que de fato dá margem.',
     true)
  on conflict (organization_id, slug) do nothing;

  select id into orbita_id from brand_services where organization_id = keystone_id and slug = 'orbita';
  select id into rice_id   from brand_services where organization_id = keystone_id and slug = 'rice';

  -- Liga os dois pilares mais próximos de cada método — a FK que a migração
  -- anterior acrescentou a `content_pillars.methodology_id` agora tem o que
  -- referenciar. Os outros 11 pilares seguem sem `methodology_id`: nem todo
  -- pilar de conteúdo corresponde a um método proprietário específico, e
  -- forçar um vínculo falso seria pior que deixar nulo.
  update content_pillars set methodology_id = orbita_id
   where organization_id = keystone_id and slug = 'budget' and methodology_id is null;

  update content_pillars set methodology_id = rice_id
   where organization_id = keystone_id and slug = 'custos' and methodology_id is null;

  -- ── Provedor de embeddings ────────────────────────────────────────────────
  -- `vector(1536)` em `knowledge_chunks` é a dimensão do `text-embedding-3-
  -- small` da OpenAI — não há endpoint de embeddings na Anthropic Messages
  -- API. Mesmo racional do provedor `anthropic` semeado na FASE 4: sem
  -- `config.pricing`, `estimateCostUsd` devolve `null`, nunca um custo
  -- inventado. A chave de fato (`OPENAI_API_KEY`) é um Edge Function secret,
  -- não uma coluna aqui — mesmo padrão de `ANTHROPIC_API_KEY`.
  insert into ai_providers (organization_id, key, priority, is_active, config)
  values (keystone_id, 'openai', 1, true, '{"embedding_model": "text-embedding-3-small", "embedding_dimensions": 1536}'::jsonb)
  on conflict (organization_id, key) do nothing;
end $$;

-- ── Prompts globais de A3 (Content Factory) ──────────────────────────────────
-- Pipeline em seis etapas separadas (docs/05 §4 — "ângulo → hook → estrutura
-- → copy → CTA → visual", cada uma um prompt versionado e substituível
-- isoladamente). `organization_id = null` — mesmo desenho da FASE 4, prompt
-- da plataforma, não da Keystone especificamente.

insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_factory.angle',
  1,
  'Você é a primeira etapa do agente Content Factory da Keystone Controladoria. Sua única tarefa é confirmar ou refinar o ângulo de uma ideia de conteúdo já aprovada, adaptando-o ao formato e ao canal específicos desta peça — sem mudar a intenção editorial nem inventar um ângulo novo que a ideia original não sustente.

Nunca cite preço, prometa resultado específico não fundamentado, ou faça afirmação que a Keystone não poderia sustentar.',
  'Ideia:
Título: {{idea_title}}
Ângulo original: {{idea_angle}}
Hook original: {{idea_hook}}
Racional: {{idea_rationale}}
Intenção editorial: {{intent}}
Pilar: {{pillar_name}}

Formato desta peça: {{format_key}}
Especificação do formato: {{format_spec}}

Marca:
Tom: {{brand_tone}}
Público: {{brand_audience}}
Diferenciais: {{brand_differentiators}}

Confirme ou refine o ângulo para este formato específico.',
  array['idea_title', 'idea_angle', 'idea_hook', 'idea_rationale', 'intent', 'pillar_name', 'format_key', 'format_spec', 'brand_tone', 'brand_audience', 'brand_differentiators'],
  '{
    "type": "object",
    "properties": {
      "refined_angle": { "type": "string" },
      "target_pain_point": { "type": "string" },
      "differentiator_used": { "type": "string" }
    },
    "required": ["refined_angle", "target_pain_point"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.40
);

insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_factory.hook',
  1,
  'Você escreve o hook — a primeira ou duas linhas que decidem se o leitor continua lendo. Precisa ser específico ao ângulo desta peça, nunca genérico o bastante para caber em qualquer post do nicho de controladoria/FP&A. Respeite o limite prático do formato: em feeds sociais, as primeiras linhas aparecem truncadas antes do "ver mais".',
  'Ângulo: {{refined_angle}}
Dor-alvo: {{target_pain_point}}
Intenção editorial: {{intent}}
Pilar: {{pillar_name}}
Formato: {{format_key}}

Marca:
Tom: {{brand_tone}}
Palavras preferidas: {{preferred_words}}
Palavras proibidas: {{forbidden_words}}

Escreva o hook desta peça.',
  array['refined_angle', 'target_pain_point', 'intent', 'pillar_name', 'format_key', 'brand_tone', 'preferred_words', 'forbidden_words'],
  '{
    "type": "object",
    "properties": {
      "hook": { "type": "string" },
      "hook_rationale": { "type": "string" }
    },
    "required": ["hook", "hook_rationale"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.60
);

insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_factory.structure',
  1,
  'Você organiza a peça em seções (beats) antes da redação final. Regra de fundamentação, sem exceção: qualquer afirmação sobre um serviço, metodologia ou case específico da Keystone só pode vir do contexto de conhecimento fornecido abaixo. Se o contexto vier vazio ou não cobrir o que a seção precisaria afirmar, a seção não faz essa afirmação — fica no nível do ensinamento geral, sem citar o serviço. Nunca invente um case ou detalhe de metodologia que não esteja literalmente no contexto. Cada seção que usar o contexto lista os IDs de trecho usados em `grounded_on`; uma seção que não usou contexto nenhum devolve `grounded_on` vazio.',
  'Ângulo: {{refined_angle}}
Hook: {{hook}}
Intenção editorial: {{intent}}
Pilar: {{pillar_name}}
Formato: {{format_key}}
Especificação do formato: {{format_spec}}

Contexto de conhecimento recuperado (trechos com ID):
{{rag_context}}

Organize a estrutura desta peça em seções.',
  array['refined_angle', 'hook', 'intent', 'pillar_name', 'format_key', 'format_spec', 'rag_context'],
  '{
    "type": "object",
    "properties": {
      "sections": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "purpose": { "type": "string" },
            "key_point": { "type": "string" },
            "grounded_on": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["title", "purpose", "key_point", "grounded_on"],
          "additionalProperties": false
        }
      }
    },
    "required": ["sections"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.40
);

insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_factory.copy',
  1,
  'Você escreve o corpo final da peça a partir da estrutura já aprovada, no tom da marca, respeitando rigorosamente as palavras proibidas (nunca usá-las, em nenhuma forma) e preferindo as palavras preferidas quando naturalmente cabíveis. Siga os limites de caracteres/formato descritos na especificação do formato. Não introduza afirmação nova sobre serviço ou case que não estivesse já em alguma seção da estrutura — a estrutura já decidiu o que tem lastro.',
  'Hook: {{hook}}
Estrutura (seções): {{structure}}
Formato: {{format_key}}
Especificação do formato: {{format_spec}}

Marca:
Tom: {{brand_tone}}
Palavras proibidas (nunca usar): {{forbidden_words}}
Palavras preferidas: {{preferred_words}}

Escreva o headline e o corpo final da peça, e sugira hashtags relevantes ao pilar.',
  array['hook', 'structure', 'format_key', 'format_spec', 'brand_tone', 'forbidden_words', 'preferred_words'],
  '{
    "type": "object",
    "properties": {
      "headline": { "type": "string" },
      "body": { "type": "string" },
      "hashtags": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["headline", "body", "hashtags"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.50
);

insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_factory.cta',
  1,
  'Você escreve o CTA (chamada para ação) final da peça, alinhado à intenção editorial:
- educacao, dor, case, insight: convite a continuar a conversa (comentar, salvar, compartilhar) — nunca empurra para venda.
- comercial: aproxima de um próximo passo real com a Keystone (ex.: agendar uma conversa), sem ser agressivo e sem citar preço.',
  'Corpo da peça: {{body}}
Intenção editorial: {{intent}}
Pilar: {{pillar_name}}

Escreva o CTA desta peça.',
  array['body', 'intent', 'pillar_name'],
  '{
    "type": "object",
    "properties": {
      "cta": { "type": "string" }
    },
    "required": ["cta"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.50
);

insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_factory.visual_brief',
  1,
  'Você escreve o briefing visual desta peça — uma descrição acionável do que a imagem, carrossel ou vídeo de acompanhamento deve mostrar, para quem for produzir a peça visual (designer humano ou um agente de geração de imagem). Descreva composição, elementos e mensagem visual central; não descreva texto literal a ser escrito na peça, isso já está no corpo.',
  'Headline: {{headline}}
Corpo: {{body}}
Formato: {{format_key}}
Especificação do formato: {{format_spec}}

Escreva o briefing visual desta peça.',
  array['headline', 'body', 'format_key', 'format_spec'],
  '{
    "type": "object",
    "properties": {
      "visual_brief": { "type": "string" }
    },
    "required": ["visual_brief"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.60
);

-- ── Prompt global de A4 (Content Reviewer) ───────────────────────────────────
-- Modelo diferente do gerador (docs/05 §4: "um modelo avaliando o próprio
-- texto tende a se aprovar") — `model_hint` aqui é distinto de todos os seis
-- prompts de A3 acima, não só nominalmente: é uma família de modelo
-- diferente, escolhida para segunda opinião crítica.
insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_reviewer.evaluate',
  1,
  'Você é o revisor de conteúdo da Keystone Controladoria — um segundo modelo, deliberadamente distinto de quem gerou a peça, avaliando com ceticismo, não confirmando o que já foi escrito.

Avalie a peça abaixo nestas dez dimensões, cada uma de 0 a 100: clareza, relevancia, aderencia_icp, forca_hook, argumentacao, cta, posicionamento, potencial_comercial, risco_generico (100 = nada genérico, é específico e defensável; 0 = poderia ser de qualquer concorrente), consistencia_marca (tom e palavras proibidas respeitados).

Regras que reprovam a peça independentemente da média:
- Uso de qualquer palavra da lista de palavras proibidas da marca.
- Afirmação sobre um serviço ou case da Keystone sem `grounded_on` correspondente preenchido.

O score final é a média das dez dimensões, ajustada para baixo se alguma regra acima for violada — nesse caso, registre a violação em `issues` com severidade "blocker". `suggestions` precisa ser acionável: o que mudar, não só o que está errado.',
  'Peça a revisar:
Headline: {{headline}}
Hook: {{hook}}
Corpo: {{body}}
CTA: {{cta}}
Hashtags: {{hashtags}}
Briefing visual: {{visual_brief}}
grounded_on desta peça: {{grounded_on}}

Contexto:
Pilar: {{pillar_name}}
Intenção editorial: {{intent}}
Tom da marca: {{brand_tone}}
Palavras proibidas: {{forbidden_words}}
Palavras preferidas: {{preferred_words}}

Avalie a peça.',
  array['headline', 'hook', 'body', 'cta', 'hashtags', 'visual_brief', 'grounded_on', 'pillar_name', 'intent', 'brand_tone', 'forbidden_words', 'preferred_words'],
  '{
    "type": "object",
    "properties": {
      "score": { "type": "integer", "minimum": 0, "maximum": 100 },
      "dimensions": {
        "type": "object",
        "properties": {
          "clareza": { "type": "integer", "minimum": 0, "maximum": 100 },
          "relevancia": { "type": "integer", "minimum": 0, "maximum": 100 },
          "aderencia_icp": { "type": "integer", "minimum": 0, "maximum": 100 },
          "forca_hook": { "type": "integer", "minimum": 0, "maximum": 100 },
          "argumentacao": { "type": "integer", "minimum": 0, "maximum": 100 },
          "cta": { "type": "integer", "minimum": 0, "maximum": 100 },
          "posicionamento": { "type": "integer", "minimum": 0, "maximum": 100 },
          "potencial_comercial": { "type": "integer", "minimum": 0, "maximum": 100 },
          "risco_generico": { "type": "integer", "minimum": 0, "maximum": 100 },
          "consistencia_marca": { "type": "integer", "minimum": 0, "maximum": 100 }
        },
        "required": ["clareza", "relevancia", "aderencia_icp", "forca_hook", "argumentacao", "cta", "posicionamento", "potencial_comercial", "risco_generico", "consistencia_marca"],
        "additionalProperties": false
      },
      "issues": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "severity": { "type": "string", "enum": ["blocker", "warning", "note"] },
            "description": { "type": "string" }
          },
          "required": ["severity", "description"],
          "additionalProperties": false
        }
      },
      "suggestions": { "type": "string" }
    },
    "required": ["score", "dimensions", "issues", "suggestions"],
    "additionalProperties": false
  }'::jsonb,
  'claude-opus-5',
  0.20
);
