# 05 — Agentes de IA

Cobre o item 12 da seção 66.

---

## §1. Camada de abstração

O Master Prompt (seção 3) exige arquitetura desacoplada de fornecedor, camada
própria de prompts, controle de custo, logs e fallback. Isso se materializa numa
única porta de entrada: **`ai-gateway`**.

```
┌────────────────────────────────────────────────────────────┐
│  Consumidores (Edge Functions dos módulos)                 │
│  content-generate · content-review · market-intelligence   │
│  prospect-research · lead-qualify · growth-strategist       │
└─────────────────────────┬──────────────────────────────────┘
                          │ invoke({ promptKey, variables,
                          │          subject, correlationId })
                          ▼
┌────────────────────────────────────────────────────────────┐
│  ai-gateway                                                 │
│   1. carrega ai_prompts (key + versão ativa)               │
│   2. monta contexto: marca + serviços + RAG + aprendizados │
│   3. resolve provedor por ai_providers.priority            │
│   4. verifica orçamento diário da organização              │
│   5. chama o provedor · valida saída contra output_schema  │
│   6. em falha → próximo provedor (fallback)                │
│   7. grava ai_invocations (tokens, custo, latência)        │
└─────────────────────────┬──────────────────────────────────┘
                          ▼
        ┌─────────────┬─────────────┬─────────────┐
        │  Anthropic  │   OpenAI    │   Google    │  (chaves no Vault)
        └─────────────┴─────────────┴─────────────┘
```

### Contrato

```ts
type AIInvokeInput = {
  promptKey: string;
  promptVersion?: number;          // omitido = versão ativa
  variables: Record<string, unknown>;
  context?: { useRag?: boolean; useLearnings?: boolean; useBrand?: boolean };
  subject?: { type: string; id: string };
  correlationId?: string;
  maxCostUsd?: number;
};

type AIInvokeResult<T> =
  | { ok: true;  data: T; invocationId: string; provider: string;
      model: string; costUsd: number }
  | { ok: false; error: { code: AIErrorCode; message: string };
      invocationId: string };
```

Retorno como resultado tipado, não exceção. Falha de IA é evento esperado, e
`try/catch` espalhado pelo código de domínio esconde tratamento — o discriminated
union obriga o chamador a lidar com o caso de erro no compilador.

### Saída estruturada

Todo prompt declara `output_schema` (JSON Schema) em `ai_prompts`. O gateway
valida a resposta contra ele antes de devolver. Falha de validação → uma
retentativa com a mensagem de erro anexada; se falhar de novo, erro. **Nenhuma
saída de LLM chega ao banco sem passar por schema.** Sem isso, um modelo que
devolve prosa onde deveria devolver JSON corrompe dados silenciosamente.

### Fallback

`ai_providers.priority` ordena a cadeia. Fallback dispara em erro de rede, `5xx`,
rate limit e timeout — **não** em falha de validação de schema (que é problema de
prompt, não de provedor, e trocar de modelo apenas mascara). `ai_invocations`
grava `fallback_from` para que a taxa de fallback seja medível.

### Controle de custo

- `estimated_cost_usd` calculado por invocação a partir da tabela de preço do
  modelo, gravado em `ai_invocations`.
- Orçamento diário por organização, verificado **antes** da chamada. Estourou:
  operações de prioridade baixa são recusadas; as críticas seguem e geram alerta.
- Dashboard `AI COST / MONTH`, `/ LEAD`, `/ OPPORTUNITY` sobre `ai_usage_daily`.
- Cache de prompt do provedor usado onde houver — o bloco de contexto (marca,
  serviços, metodologia) é grande, estável e repetido em toda chamada, que é
  exatamente o caso em que cache de prompt paga.

---

## §2. Gestão de prompts

Prompts são **dados versionados em `ai_prompts`**, não literais no código.

Razões: permitir ajuste sem deploy; comparar versões contra resultado real
(`ai_invocations.prompt_version` cruzado com performance); e reverter uma versão
ruim em segundos.

Regras:

- Versão é **imutável**. Alterar um prompt cria `version + 1`; a anterior é
  desativada, nunca editada. Sem isso a análise histórica mente.
- `variables[]` declara as variáveis exigidas; o gateway recusa invocação com
  variável faltando em vez de interpolar `undefined` no meio do prompt.
- Prompts globais (`organization_id is null`) servem de padrão; a organização
  pode sobrescrever por chave.

### Camadas de contexto

Todo prompt de geração recebe, nesta ordem:

1. **Marca** — `brand_profiles`: posicionamento, tom, público, diferenciais,
   palavras proibidas e preferidas.
2. **Serviços e metodologia** — `brand_services`, incluindo ORBITA e RICE.
3. **RAG** — trechos de `knowledge_chunks` relevantes à tarefa.
4. **Aprendizados** — `ai_learnings` ativos e de alta confiança para o domínio.
5. **Tarefa** — o pedido específico.

A camada 4 é o que fecha o loop de aprendizado. Sem ela, `ai_learnings` seria uma
tabela bonita que ninguém lê, e o sistema geraria o mesmo conteúdo mediano
indefinidamente.

---

## §3. RAG (seção 58)

```
Documento (PDF, PPTX, DOCX, URL)
   → Storage + knowledge_documents (status=uploaded)
   → extração de texto
   → chunking semântico (~800 tokens, overlap ~120)
   → embedding
   → knowledge_chunks (+ vector) → status=indexed
```

Recuperação: busca vetorial via `app.match_knowledge` (HNSW, cosseno), filtrada
por `organization_id` sob RLS, limitada aos N melhores acima de um limiar de
similaridade.

**Regra de fundamentação.** Para perguntas sobre serviços, metodologia, cases e
posicionamento, o agente responde **apenas** a partir dos trechos recuperados. Se
a recuperação vier vazia ou abaixo do limiar, a resposta é *"não há informação
sobre isso na base de conhecimento"* — nunca uma resposta plausível inventada
(seção 58). Um sistema que inventa um case de cliente causa dano real e
irreversível à credibilidade de uma consultoria.

Chunks usados ficam registrados em `grounded_on` do registro gerado, tornando a
afirmação rastreável até a fonte na UI.

---

## §4. Catálogo de agentes

Nove agentes. Cada um é uma Edge Function com prompts próprios, entradas e saídas
tipadas e efeitos colaterais explicitamente delimitados.

| # | Agente | Entrada | Saída | Escreve em | Fase |
|---|---|---|---|---|---|
| A1 | Market Intelligence | Fontes configuradas, pilares, ICP | Insights com relevância e potencial comercial | `ai_insights` | 4 |
| A2 | Content Strategist | Insights, pilares, regras, aprendizados | Ideias distribuídas no calendário | `content_ideas`, `content_calendar` | 4 |
| A3 | Content Factory | Ideia, formato, marca, RAG | Hook, copy, CTA, hashtags, briefing visual, variações | `content_assets` | 5 |
| A4 | Content Reviewer | Peça, marca, ICP | Score 0–100 por dimensão + sugestões | `content_reviews` | 5 |
| A5 | Performance Analyst | Métricas do post, histórico | Diagnóstico, causa, aprendizado, próxima ação | `ai_learnings` | 9 |
| A6 | Prospect Researcher | Empresa, sinais, ICP, serviços | Resumo, dor provável, serviço, abordagem, prioridade | `company_research` | 13 |
| A7 | Outreach Personalizer | Contato, empresa, pesquisa, template | Mensagem personalizada + fatos usados | `outreach_messages` | 14 |
| A8 | Conversational Qualifier | Histórico da conversa, ICP | Resposta, sinais captados, decisão de handoff | `whatsapp_messages` | 16 |
| A9 | Growth Strategist | Todo o ecossistema (views agregadas) | Diagnóstico e recomendações executáveis | `ai_recommendations` | 19 |

### A1 — Market Intelligence

Analisa fontes **configuradas e autorizadas** (feeds, publicações setoriais,
indicadores econômicos públicos), não "a internet". Cada insight nasce com
`source` e `source_url` obrigatórios; insight sem fonte rastreável é descartado
pelo gateway na validação de schema.

### A3 — Content Factory

Executa o pipeline da seção 11 (ideia → ângulo → hook → estrutura → copy → CTA →
visual) em etapas separadas, não numa chamada monolítica. Cada etapa é um prompt
versionado, avaliável e substituível isoladamente. Custa mais tokens; entrega
qualidade mensurável e depurável por etapa.

Gera variações para teste. `content_assets.variant_of` liga a variação à
original, e a performance comparada alimenta A5.

### A4 — Content Reviewer

Avalia as dez dimensões da seção 12. Abaixo do limiar configurado
(padrão: 70), a peça não avança para `approved` e recebe sugestões acionáveis.

**O revisor é um modelo diferente do gerador.** Um modelo avaliando o próprio
texto tende a se aprovar. Configurável em `ai_prompts.model_hint`.

### A5 — Performance Analyst

Produz o formato da seção 17 (performance, por quê, o que aprendemos, próxima
ação) e grava em `ai_learnings` com `evidence` e `sample_size`.

**Guarda-corpo estatístico:** um aprendizado não é promovido a `is_active` com
amostra abaixo do mínimo configurável. Sem isso, um post que foi bem por acaso
vira "aprendizado" e enviesa toda a geração seguinte — o sistema aprenderia
ruído e pioraria com confiança crescente.

### A8 — Conversational Qualifier

Pré-qualifica; **não vende** (seção 29). Faz as perguntas de diagnóstico
(momento da empresa, unidades, planejamento financeiro atual, orçamento,
acompanhamento realizado vs. orçado, principal desafio) e registra os sinais.

Nunca: faz proposta, cita preço, promete prazo, ou negocia. Isso está no prompt
**e** é verificado por pós-processamento — o gateway barra saídas contendo padrão
de valor monetário ou compromisso comercial. Prompt é instrução, não garantia;
para regra que não pode falhar, é preciso verificação determinística.

### A9 — Growth Strategist

O agente central da seção 34. Lê views agregadas — nunca linhas cruas — e produz
as respostas da seção 34 mais uma lista priorizada de ações (seção 35).

Cada recomendação sai com `action` tipado quando for executável, alimentando o
botão **EXECUTAR** da seção 49.

---

## §5. Next Best Action

Não é uma chamada de LLM. É uma **consulta SQL determinística** sobre estado
real, reordenada e explicada pelo A9:

```
prospects com ICP Score alto e stage='prioritized' sem contato
leads status='new' há mais de N horas
campaign_contacts com resposta não lida
conversas em handoff sem responsável
oportunidades com next_action_at vencido
slots de calendário sem conteúdo aprovado para as próximas 48 h
peças em 'review' há mais de 24 h
```

A ordenação é por impacto esperado (valor potencial × probabilidade × urgência).
A IA escreve a justificativa; a matemática vem do banco. Um assistente comercial
que erra a contagem de prospects não é usado duas vezes — e LLM não é o
instrumento certo para contar linhas.

---

## §6. Human handoff (seção 30)

Gatilhos são **regra determinística**, avaliada a cada mensagem recebida, em
paralelo ao julgamento do modelo:

| Gatilho | Detecção |
|---|---|
| Pedido explícito de humano | padrão + classificação |
| Pedido de proposta ou preço | padrão + classificação |
| Pedido de reunião | padrão + classificação |
| Sinal de negociação | classificação |
| Reclamação ou insatisfação | classificação |
| Dúvida fora da base de conhecimento | RAG abaixo do limiar |
| Confiança baixa do próprio agente | score do modelo |
| Mais de N trocas sem progresso | contador |
| Pedido de não contato | padrão → **também** grava em `suppression_list` |

Ao disparar: `whatsapp_conversations.ai_mode := 'assist'`, `handoff_reason` e
`handoff_at` preenchidos, notificação ao responsável, conversa no topo da Inbox.
A IA permanece como **assistente interno** — sugere resposta ao operador, não
envia (seção 30).

O botão **ASSUMIR CONVERSA** é irreversível por sessão: retomar o modo autônomo
exige ação deliberada. Uma IA que reassume uma negociação sozinha depois que um
humano interveio é um risco comercial inaceitável.

---

## §7. Guarda-corpos

Consolidação das restrições que impedem o sistema de inventar dado. Vêm da seção
64 e são requisito, não zelo excessivo.

**G1 — Nenhum agente escreve dado de contato.** `contacts.email`,
`contacts.phone` e `contacts.linkedin_url` são graváveis apenas por integração
com fonte declarada. Aplicado por permissão de coluna no Postgres, não por
convenção — o papel usado pelo `ai-gateway` não tem `UPDATE` nessas colunas.

**G2 — Nenhum agente escreve fato sobre empresa.** A pesquisa (A6) grava em
`company_research`, que é interpretação assumida. Campos cadastrais em
`companies` só vêm de fonte oficial ou licenciada.

**G3 — Toda afirmação sobre a empresa cliente é fundamentada.** Serviços,
metodologia, cases e posicionamento vêm de RAG com `grounded_on` preenchido.

**G4 — Personalização usa apenas fato verificável.** `outreach_messages.
personalization` registra exatamente quais fatos foram usados, com origem. É
auditável: dá para pegar uma mensagem enviada e conferir se cada afirmação tinha
lastro. Sem contexto suficiente, o sistema usa mensagem base em vez de inventar
contexto (seção 26).

**G5 — Saída sempre validada por schema** antes de tocar o banco.

**G6 — Toda invocação é registrada**, inclusive as que falharam. Sem exceção.

**G7 — Nenhum agente executa ação de efeito externo diretamente.** Agentes
produzem *propostas* (`ai_recommendations`, rascunhos, mensagens em fila). A
execução passa por `automation_definitions.approval_mode`. Esta é a tradução
técnica do princípio human-in-the-loop da seção 51.

---

## §8. Sistema de aprovação (seção 50)

`approval_mode` por automação, com os padrões iniciais:

| Ação | Padrão | Racional |
|---|---|---|
| Gerar conteúdo | `auto` | Rascunho não tem efeito externo |
| Publicar conteúdo aprovado | `auto` | Já passou por revisão humana |
| Aprovar conteúdo | `manual` | Julgamento de marca |
| Primeira abordagem | `approval_required` | Primeiro contato com pessoa real |
| Follow-up de sequência já aprovada | `auto` | A decisão foi tomada na aprovação |
| Resposta da IA em conversa | `approval_required` no início | Migra para `auto` quando a qualidade for comprovada |
| Enviar proposta | `manual` | Decisão comercial |
| Fechar venda | `manual` | Decisão comercial |
| Executar recomendação da IA | `approval_required` | Depende da ação |

Configurável por organização. Os padrões são deliberadamente conservadores:
soltar automação é fácil e reversível, retirar uma mensagem enviada não é.
