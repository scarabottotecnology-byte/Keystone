-- FASE 4 · subtarefas 3–4 — os 13 pilares da Keystone e as regras de
-- distribuição semanal. Mais o provedor de IA padrão e os prompts globais
-- de A1/A2, sem os quais `ai-gateway.invoke()` não tem o que carregar.
--
-- Fonte da verdade: docs/12-DETALHAMENTO-FASES.md, FASE 4, subtarefas 3–4.

do $$
declare
  keystone_id uuid;
begin
  select id into keystone_id from organizations where slug = 'keystone';

  -- ── Os 13 pilares ───────────────────────────────────────────────────────────
  insert into content_pillars (organization_id, name, slug, weight)
  values
    (keystone_id, 'Controladoria', 'controladoria', 1),
    (keystone_id, 'FP&A', 'fpa', 1),
    (keystone_id, 'Budget', 'budget', 1),
    (keystone_id, 'Forecast', 'forecast', 1),
    (keystone_id, 'Custos', 'custos', 1),
    (keystone_id, 'Pricing', 'pricing', 1),
    (keystone_id, 'Fluxo de Caixa', 'fluxo-de-caixa', 1),
    (keystone_id, 'EBITDA', 'ebitda', 1),
    (keystone_id, 'Indicadores', 'indicadores', 1),
    (keystone_id, 'Gestão Financeira', 'gestao-financeira', 1),
    (keystone_id, 'M&A', 'ma', 1),
    (keystone_id, 'Crescimento empresarial', 'crescimento-empresarial', 1),
    (keystone_id, 'Estratégia', 'estrategia', 1)
  on conflict (organization_id, slug) do nothing;

  -- ── Regras de distribuição semanal ───────────────────────────────────────────
  -- weekday segue a convenção nativa do Postgres (extract(dow from data)):
  -- 0 = domingo, 1 = segunda, ..., 6 = sábado.
  --
  -- `slot_time` em 09:00 e `channel` em LinkedIn são ponto de partida
  -- razoável — B2B, horário comercial —, não uma regra do master prompt.
  -- Editável em Configurações → Estratégia editorial (subtarefa 8) assim que
  -- a tela existir. `pillar_id` fica em aberto de propósito: o master prompt
  -- não fixa pilar por dia da semana, só o intent — a escolha do pilar em si
  -- é decisão do agente A2 no momento de gerar a ideia, não uma amarração
  -- fixa no calendário.
  -- Sem `on conflict`: a tabela não tem restrição única sobre essas colunas
  -- (mais de uma regra pode legitimamente compartilhar dia e canal no
  -- futuro), e o mecanismo de migração do Supabase já garante que este
  -- bloco roda uma única vez.
  insert into content_calendar_rules (organization_id, weekday, slot_time, channel, intent)
  values
    (keystone_id, 1, '09:00', 'linkedin', 'educacao'),
    (keystone_id, 2, '09:00', 'linkedin', 'dor'),
    (keystone_id, 3, '09:00', 'linkedin', 'case'),
    (keystone_id, 4, '09:00', 'linkedin', 'insight'),
    (keystone_id, 5, '09:00', 'linkedin', 'comercial');

  -- ── Provedor de IA padrão ─────────────────────────────────────────────────────
  -- `config` sem `pricing`, de propósito: sem o número real e atual do
  -- provedor, `estimateCostUsd` devolve `null`, não um custo inventado. Um
  -- admin preenche `config.pricing` quando tiver a tabela de preço em mãos —
  -- ver `supabase/functions/_shared/ai-gateway/pricing.ts`.
  insert into ai_providers (organization_id, key, priority, is_active, config)
  values (keystone_id, 'anthropic', 1, true, '{}'::jsonb)
  on conflict (organization_id, key) do nothing;
end $$;

-- ── Prompts globais de A1 e A2 ────────────────────────────────────────────────
-- `organization_id = null`: prompt da plataforma, não da Keystone
-- especificamente — é o "global" que a migração `ai_core_and_observability`
-- já modelou. Sem `on conflict`, pelo mesmo motivo de `content_calendar_rules`
-- acima — e aqui por um detalhe a mais: `unique (organization_id, key,
-- version)` nunca pega duas linhas com `organization_id null`, porque NULL
-- não é igual a NULL para fins de unicidade. A garantia de rodar uma vez
-- vem inteiramente do mecanismo de migração, não da constraint.
insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'market_intelligence.analyze',
  1,
  'Você é o agente de Market Intelligence da Keystone Controladoria, uma consultoria de controladoria e FP&A para médias e grandes empresas.

Sua única fonte de informação é o conteúdo fornecido abaixo, já coletado de fontes configuradas e autorizadas. Você NUNCA inventa fato, estatística, tendência ou fonte que não esteja literalmente no conteúdo fornecido — "não sei" ou não gerar um insight é sempre preferível a fabricar dado. Cada insight que você emitir precisa citar a fonte exata (nome e URL) de onde veio, presente no conteúdo fornecido.

Você está procurando: tendências de mercado, dores empresariais, perguntas frequentes do público-alvo, indicadores econômicos relevantes e oportunidades comerciais — sempre pela lente dos pilares de conteúdo da Keystone, listados abaixo. Um insight só vale a pena se puder virar conteúdo educativo ou comercial ligado a um desses pilares.

Classifique cada insight por tipo (trend, pain, question, economic ou opportunity), dê uma nota de relevância (0–100, quão pertinente é para o público da Keystone) e uma nota de potencial comercial (0–100, quão perto está de gerar uma conversa comercial).',
  'Pilares de conteúdo da Keystone:
{{pillars}}

Conteúdo coletado das fontes configuradas:
{{sources}}

Analise o conteúdo acima e emita os insights que encontrar, seguindo estritamente as instruções do sistema.',
  array['pillars', 'sources'],
  '{
    "type": "object",
    "properties": {
      "insights": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": { "type": "string", "enum": ["trend", "pain", "question", "economic", "opportunity"] },
            "title": { "type": "string" },
            "description": { "type": "string" },
            "source": { "type": "string" },
            "source_url": { "type": "string" },
            "observed_at": { "type": "string", "description": "Data ISO 8601 em que o fato foi observado ou publicado" },
            "relevance": { "type": "integer", "minimum": 0, "maximum": 100 },
            "category": { "type": "string" },
            "commercial_potential": { "type": "integer", "minimum": 0, "maximum": 100 },
            "recommendation": { "type": "string" }
          },
          "required": ["type", "title", "description", "source", "source_url", "observed_at", "relevance", "commercial_potential"],
          "additionalProperties": false
        }
      }
    },
    "required": ["insights"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.30
);

insert into ai_prompts (organization_id, key, version, system_prompt, user_template, variables, output_schema, model_hint, temperature)
values (
  null,
  'content_strategist.generate_idea',
  1,
  'Você é o agente Content Strategist da Keystone Controladoria. Sua tarefa é transformar um insight de mercado (ou um pilar de conteúdo, quando não houver insight de origem) numa ideia de conteúdo concreta para LinkedIn, com a intenção editorial já definida pela regra de distribuição do dia.

As cinco intenções e o que cada uma exige:
- educacao: ensina um conceito de controladoria/FP&A de forma clara, sem jargão desnecessário.
- dor: nomeia uma dor real de quem administra uma média/grande empresa, sem soar alarmista.
- case: ilustra um resultado concreto (pode ser hipotético, mas precisa soar plausível e específico — nunca genérico).
- insight: uma opinião executiva, defensável, que gera discussão.
- comercial: aproxima o leitor de um próximo passo com a Keystone, sem ser vendedor agressivo.

Nunca cite preço, prometa resultado específico não fundamentado, ou faça afirmação que a Keystone não poderia sustentar. O ângulo e o hook precisam ser específicos o bastante para diferenciar esta ideia de qualquer post genérico do nicho.',
  'Pilar: {{pillar_name}}
Intenção editorial de hoje: {{intent}}

Insight de origem (se houver):
Título: {{insight_title}}
Descrição: {{insight_description}}

Gere uma ideia de conteúdo para esta combinação de pilar e intenção.',
  array['pillar_name', 'intent', 'insight_title', 'insight_description'],
  '{
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "angle": { "type": "string" },
      "hook": { "type": "string" },
      "rationale": { "type": "string" }
    },
    "required": ["title", "angle", "hook", "rationale"],
    "additionalProperties": false
  }'::jsonb,
  'claude-sonnet-5',
  0.60
);
