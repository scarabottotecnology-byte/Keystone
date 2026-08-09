# 06 — Fluxo de Dados

Cobre o item 13 da seção 66.

---

## §1. O ciclo completo

Cada seta abaixo é uma FK real ou uma escrita de tabela — não uma metáfora. A
coluna direita nomeia o artefato de banco que registra a transição.

```
FONTES AUTORIZADAS
   │  WF-015 · A1 Market Intelligence
   ▼
ai_insights                          ← título, fonte, relevância, potencial
   │  A2 Content Strategist
   ▼
content_ideas.source_insight_id      ← a origem de mercado fica registrada
   │  A2 distribui pelas regras semanais
   ▼
content_calendar                     ← slot, canal, formato, horário
   │  A3 Content Factory
   ▼
content_assets                       ← hook, copy, CTA, mídia, variações
   │  A4 Content Reviewer
   ▼
content_reviews.score                ← < 70 volta para ajuste
   │  aprovação (humana ou auto)
   ▼
publishing_jobs                      ← lock, attempt, correlation_id
   │  WF-002 · social-publish
   ▼
social_posts.external_post_id        ← prova de que saiu, e onde
   │  WF-003 a cada 6 h
   ▼
social_post_metrics                  ← snapshot diário, sem sobrescrever
   │  WF-004 · A5 Performance Analyst
   ▼
ai_learnings                         ← evidência + confiança + amostra
   │
   └──────────▶ realimenta A2 e A3 na próxima geração

                         ─── e, em paralelo ───

social_posts / landing page / formulário
   │  WF-007 · lead-capture
   ▼
leads.origin_asset_id                ← O ELO CRÍTICO da atribuição
   │
   ├─▶ lead_events        (timeline)
   ├─▶ lead_scores        (0–100)
   └─▶ touchpoints        (canal, peça, momento, posição)

                         ─── e, do outro lado ───

icp_profiles
   │  WF-005 · company-discovery (fonte oficial/licenciada)
   ▼
companies + company_signals
   │  WF-006 · scoring-recompute
   ▼
prospect_scores.breakdown            ← por critério, com cobertura declarada
   │  A6 Prospect Researcher
   ▼
company_research.grounded_on         ← só afirma o que tem lastro
   │  priorização
   ▼
campaign_contacts
   │  WF-008/009 · A7 Personalizer
   │  ANTES DE ENVIAR: suppression_list → consents → daily_cap → horário
   ▼
outreach_messages.personalization    ← fatos usados, auditável
   │  resposta recebida
   ▼
whatsapp_conversations               ← A8 Qualifier, ai_mode
   │  gatilho de handoff
   ▼
HUMANO ASSUME
   │
   ▼
opportunities                        ← origin_asset_id, origin_campaign_id
   │  opportunity_stage_history
   ▼
WON / LOST
   │  WF-013 · attribution
   ▼
attribution_results                  ← 4 modelos, valor em R$ por peça e canal
   │
   ▼
ai_learnings                         ← "este conteúdo + este perfil + esta
   │                                     abordagem converte"
   └──────────▶ NOVO CICLO, melhor informado
```

---

## §2. Por que a origem é capturada no momento do evento

O ponto de falha clássico neste tipo de sistema é tentar reconstruir atribuição
depois. Não funciona: quando a venda fecha, ninguém lembra qual post o cliente
viu três meses antes, e o dado não está em lugar nenhum.

Por isso `origin_asset_id`, `origin_campaign_id` e `origin_channel` são gravados
**no instante da criação** de `leads` e `opportunities`, mesmo nas fases em que
ainda não existe tela de atribuição. É barato agora e impossível depois.

`touchpoints` é a versão granular: cada interação vira uma linha, com `position`
na jornada. Isso permite os quatro modelos de atribuição sobre o mesmo dado, sem
recomputar nada a partir de fontes que já não existem.

---

## §3. Atribuição

Quatro modelos, todos calculados, nenhum eleito como verdade:

| Modelo | Distribuição | O que revela |
|---|---|---|
| `first_touch` | 100% ao primeiro toque | O que **descobre** clientes |
| `last_touch` | 100% ao último toque | O que **fecha** |
| `linear` | Igual entre todos | Contribuição bruta |
| `position_based` | 40% primeiro, 40% último, 20% meio | Padrão dos dashboards |

A leitura interessante está na **divergência**. Um canal alto em `first_touch` e
baixo em `last_touch` é canal de topo — cortá-lo por parecer improdutivo no
relatório de fechamento é um erro caro, e ver os quatro modelos lado a lado
impede esse erro.

Perguntas da seção 32, todas respondíveis por `JOIN`:

| Pergunta | Caminho |
|---|---|
| Pipeline gerado pelo LinkedIn? | `attribution_results` → `channel='linkedin'` |
| Quanto veio do Instagram? | idem, `channel='instagram'` |
| Qual conteúdo gerou mais reuniões? | `touchpoints` → `opportunity_stage_history` (stage `meeting`) |
| Qual campanha gerou mais oportunidades? | `opportunities.origin_campaign_id` |
| Qual tema gerou mais vendas? | `attribution_results` → `content_assets` → `content_ideas` → `content_pillars` |

---

## §4. Daily Growth Cycle (seção 36)

Horários padrão, todos configuráveis em `automation_definitions`.

| Hora | Workflow | Produz | Modo |
|---|---|---|---|
| 06:00 | WF-015 Market Intelligence | `ai_insights` do dia | auto |
| 07:00 | WF-001 Content Generation | ideias + peças em `draft` | auto |
| 07:30 | (dentro do WF-001) Review | `content_reviews`, seleção dos melhores | auto |
| 08:00 | WF-002 Publishing | `social_posts` | auto (peça aprovada) |
| 09:00 | WF-005 Company Discovery | `companies`, `company_signals` | auto |
| 10:00 | WF-006 Scoring | `prospect_scores`, `lead_scores` | auto |
| 10:30 | A6 Prospect Researcher | `company_research` | auto |
| 11:00 | WF-008/009 Outreach | mensagens enviadas | **approval_required** |
| dia | WF-010 Follow-up (horária) | avanço de sequência | auto |
| dia | WF-007 Lead Capture (webhook) | `leads` | auto |
| 22:00 | WF-004 Performance Analysis | `ai_learnings` | auto |
| 23:00 | WF-013 Growth Intelligence | views, Growth Score, `ai_recommendations` | auto |
| contínuo | WF-014 Error Monitoring | alertas | auto |

O resultado é a tela que a seção 72 descreve: ao abrir o Command Center pela
manhã, o operador vê o que o sistema já fez — e o que espera decisão dele.

**Nota sobre a ordem.** Discovery às 09:00 e outreach às 11:00 no mesmo dia é
apertado para revisão humana. Na prática, o outreach das 11:00 processa a fila
aprovada do dia anterior, não a descoberta de duas horas antes. Isso é
intencional: dá tempo real de revisão sem travar a cadência diária.

---

## §5. Growth Score (seção 52)

```
GROWTH SCORE = Σ (peso_i × normalizado_i)
```

| Componente | Peso padrão | Base |
|---|---|---|
| Content Performance | 15 | engajamento e alcance vs. média móvel de 90 dias |
| Lead Generation | 15 | leads no período vs. meta |
| Prospecting | 15 | prospects contatados e taxa de resposta |
| Pipeline | 20 | valor de pipeline criado vs. meta |
| Conversion | 15 | taxa de avanço entre estágios |
| Revenue | 20 | receita fechada vs. meta |

Pesos e metas em `growth_score_config`. Snapshot diário em
`growth_score_snapshots` — sem histórico, um score isolado não diz nada; o que
informa é a tendência.

Normalização contra meta e média móvel própria, não contra benchmark externo
inventado. Cada componente expõe o valor bruto ao lado do normalizado, para que o
número seja auditável em vez de mágico.

---

## §6. Retenção e ciclo de vida do dado

| Dado | Retenção | Depois |
|---|---|---|
| `automation_logs` | 90 dias | purge |
| `integration_logs` | 180 dias | agregado mensal, detalhe purgado |
| `ai_invocations` | 24 meses | mantém agregado de custo |
| `error_logs` resolvidos | 12 meses | purge |
| `social_post_metrics` | integral | base histórica de aprendizado |
| `leads` / `opportunities` | integral | base de aprendizado e prova comercial |
| `contacts` sem interação | 24 meses | anonimização (ver `07 §6`) |
| `whatsapp_messages` | 24 meses | anonimização do conteúdo |
| `suppression_list` | **perpétua** | hash apenas; opt-out não expira |
| `audit_log` | 5 anos | requisito de auditoria |

A purga roda como job mensal, registrada em `automation_runs` como qualquer outra
automação — inclusive porque apagar dado por engano precisa ser rastreável.
