# 09 — Roadmap e Critérios de Aceite

Cobre os itens 19 e 20 da seção 66.

---

## §1. Como cada fase é executada

Todas as fases seguem o formato da seção 62: ANALYZE → PLAN → DATABASE →
BACKEND → AUTOMATION → FRONTEND → INTEGRATION → TEST → FIX → VALIDATE →
DOCUMENT → REPORT.

Nem toda fase tem todos os passos (uma fase sem integração externa pula o STEP 7),
mas TEST, VALIDATE e DOCUMENT nunca são pulados.

### Definição de COMPLETE (seção 63)

Uma fase só é marcada `COMPLETE` quando **todos** os itens abaixo são verdadeiros:

1. Funcional de ponta a ponta, com dado real — não mock.
2. Testes escritos e passando (unitário, banco, integração conforme o escopo).
3. Integrada com os módulos adjacentes.
4. Sem erro crítico ou alto em aberto.
5. Banco consistente: migração aplicada, reversível, sem coluna órfã.
6. Checklist de segurança de `07 §7` inteiramente marcado.
7. UX funcional: estados de carregamento, vazio e erro implementados.
8. Documentação atualizada neste diretório.
9. CI verde.

**Interface pronta não é fase pronta.** Onde uma funcionalidade for
intencionalmente parcial, isso é declarado no relatório da fase e visível na
própria UI (seção 64) — degradação explícita, nunca mock disfarçado de recurso.

---

## §2. Roadmap

Estimativas em semanas de trabalho, assumindo execução focada. São ordens de
grandeza para planejamento, não compromisso contratual.

### Bloco A — Fundação (FASES 1–3)

| Fase | Entrega | Est. | Dependência |
|---|---|---|---|
| **1** | Fundação técnica: estrutura de módulos, design system premium, CI, `_shared` de Edge Functions, `ai-gateway`, tabelas de IA e observabilidade | 2 | — |
| **2** | Banco + autenticação + RLS: `organizations`/`profiles`/`memberships`, RLS forçada em tudo, login, papéis, RPCs de agregação | 2 | 1 |
| **3** | Command Center: RPC agregada, KPIs, Growth Score, blocos AI Growth Insight e Next Best Action | 1,5 | 2 |

**Na FASE 1, além do código:** abrir os pedidos de acesso ao LinkedIn Community
Management API, ao App Review da Meta e à verificação do WhatsApp Business. São
semanas de espera que correm em paralelo ao desenvolvimento — abri-los na fase em
que serão usados trava o roadmap.

### Bloco B — Conteúdo (FASES 4–5)

| Fase | Entrega | Est. | Dependência |
|---|---|---|---|
| **4** | Content Strategy + Market Intelligence: pilares, temas, ideias, regras de distribuição, calendário, A1, A2, WF-015 | 2,5 | 3 |
| **5** | AI Content Factory + Review: A3, A4, editor de peça, variações, Content Score, biblioteca | 2,5 | 4 |

Ao fim da FASE 5 o sistema já produz valor real: gera pauta fundamentada em
mercado e entrega peças revisadas, mesmo sem publicar sozinho.

### Bloco C — Publicação e análise (FASES 6–9)

| Fase | Entrega | Est. | Dependência |
|---|---|---|---|
| **6** | LinkedIn: OAuth, `social_accounts`, `publishing_jobs`, WF-002, tratamento de erro e renovação | 2,5 | 5 + **aprovação LinkedIn** |
| **7** | Meta/Instagram: OAuth, publicação em dois passos, mídia com URL assinada | 2 | 6 + **App Review** |
| **8** | Social Analytics: WF-003, snapshots diários, métricas derivadas, telas | 2 | 7 |
| **9** | AI Performance Analyst: A5, `ai_learnings`, realimentação de A2/A3 | 1,5 | 8 |

**Risco concentrado.** As FASES 6 e 7 dependem de aprovação de terceiros. Plano
de contingência em `03 §3.1`: publicação assistida, com atribuição preservada.

A FASE 9 fecha o primeiro loop de aprendizado — é o marco em que o sistema deixa
de ser ferramenta e começa a ser sistema.

### Bloco D — Demanda (FASES 10–13)

| Fase | Entrega | Est. | Dependência |
|---|---|---|---|
| **10** | Lead Engine: captura, dedupe, timeline, scoring, Lead Center | 2 | 3 |
| **11** | ICP Engine: construtor visual com pesos, simulação, versionamento | 1,5 | 10 |
| **12** | Company Discovery: fonte de CNPJ, WF-005, deduplicação, Prospect Center | 2,5 | 11 + **ADR-009** |
| **13** | Prospect Intelligence: sinais, A6, priorização, perfil do prospect | 2 | 12 |

### Bloco E — Relacionamento (FASES 14–17)

| Fase | Entrega | Est. | Dependência |
|---|---|---|---|
| **14** | E-mail Outreach: campanhas, sequências D0–D30, A7, opt-out, supressão, webhooks, WF-008/010 | 3 | 13 |
| **15** | WhatsApp: Cloud API, templates, janela de 24 h, conversas, WF-009 | 2,5 | 14 + **verificação Meta** |
| **16** | AI Qualification: A8, gatilhos de handoff, Inbox, ASSUMIR CONVERSA | 2 | 15 |
| **17** | CRM + Pipeline: estágios configuráveis, Kanban, atividades, histórico | 2 | 16 |

A FASE 14 é a de maior risco de conformidade do roadmap. É a primeira em que o
sistema fala com pessoas reais e por isso os controles de `07 §5` são critério de
aceite, não melhoria posterior.

### Bloco F — Inteligência (FASES 18–20)

| Fase | Entrega | Est. | Dependência |
|---|---|---|---|
| **18** | Attribution: `touchpoints`, quatro modelos, views materializadas, Revenue Intelligence | 2 | 17 |
| **19** | AI Growth Strategist: A9, `ai_recommendations` com `action`, botão EXECUTAR, WF-013 | 2 | 18 |
| **20** | Daily Growth Cycle: todos os workflows ativos, painel de automações, modos de aprovação | 1,5 | 19 |

### Bloco G — Produção (FASES 21–24)

| Fase | Entrega | Est. | Dependência |
|---|---|---|---|
| **21** | Observabilidade + segurança: WF-014, alertas, DSR, ROPA, teste de balanceamento de legítimo interesse, revisão completa de RLS | 2 | 20 |
| **22** | Testes completos: E2E dos 10 fluxos, cobertura alvo, teste de carga | 2 | 21 |
| **23** | Hardening: performance, índices, custo de IA, correção de dívida | 1,5 | 22 |
| **24** | Deploy: ambientes, backup e restore testado, runbooks, monitoramento | 1 | 23 |

**Total aproximado: 51 semanas** de execução, com FASES 10–13 podendo correr em
paralelo às 6–9 se houver capacidade — o Bloco D depende apenas da FASE 3.

### Caminho crítico

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 ─┐
             └─▶ 10 → 11 → 12 → 13 ─┴─▶ 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24
```

A FASE 2 é o gargalo absoluto: tudo depende dela e ela contém a correção do
C-01.

---

## §3. Critérios de aceite por fase

Critérios objetivos e verificáveis. "Funciona bem" não é critério; "org A recebe
zero linhas da org B no teste automatizado" é.

### FASE 1 — Fundação técnica
- [ ] `src/modules/` criado; nenhum módulo importa de outro (verificado por lint)
- [ ] Design system premium aplicado; emoji removido da navegação
- [ ] CI roda lint, typecheck, unit e build; bloqueia merge em falha
- [ ] `_shared/` com auth, log, idempotência, erro e redação de segredo
- [ ] `ai-gateway` invoca ≥ 2 provedores com fallback comprovado por teste
- [ ] `ai_prompts`, `ai_invocations`, `automation_*`, `error_logs` criadas
- [ ] Custo e tokens gravados em toda invocação
- [ ] Pedidos LinkedIn, Meta e WhatsApp protocolados (comprovante anexado ao relatório)

### FASE 2 — Banco, autenticação e RLS
- [ ] Login, logout, recuperação e convite de membro da equipe funcionando
- [ ] `organizations`, `profiles`, `memberships` criadas; Keystone provisionada
- [ ] **Nenhuma política concede acesso a `anon`** (verificado por consulta ao catálogo)
- [ ] Todas as tabelas com RLS habilitada **e** forçada
- [ ] Suíte pgTAP: usuário sem vínculo não lê, escreve, altera nem apaga nada
- [ ] Teste de regressão de acesso anônimo no CI
- [ ] Toda tabela nasce com `organization_id NOT NULL`
- [ ] Agregação por RPC no servidor — nenhuma tela paginando para somar no cliente
- [ ] Advisors de segurança do Supabase sem alerta aberto

### FASE 3 — Command Center
- [ ] Carrega em < 2 s com dado de produção
- [ ] Uma única chamada RPC; nenhuma agregação no cliente
- [ ] Growth Score exibido com componentes e tendência
- [ ] Todo KPI mostra comparação com período anterior
- [ ] Blocos AI Growth Insight e Next Best Action populados por dado real
- [ ] Estado vazio explica o que o sistema fará

### FASE 4 — Content Strategy + Market Intelligence
- [ ] 13 pilares da Keystone cadastrados
- [ ] Regras de distribuição semanal configuráveis e aplicadas
- [ ] Calendário em mês, semana, dia e lista
- [ ] A1 gera insights com `source` e `source_url` obrigatórios
- [ ] Insight sem fonte rastreável é rejeitado
- [ ] "Gerar ideia a partir do insight" preenche `source_insight_id`

### FASE 5 — AI Content Factory + Review
- [ ] Pipeline em etapas separadas e versionadas
- [ ] Peça gerada respeita tom, palavras proibidas e preferidas
- [ ] RAG consultado; afirmação sobre serviço com `grounded_on`
- [ ] Content Score nas 10 dimensões da seção 12
- [ ] Score < limiar bloqueia aprovação e apresenta sugestões
- [ ] Revisor usa modelo distinto do gerador
- [ ] Variações ligadas por `variant_of`

### FASE 6 — LinkedIn
- [ ] OAuth com `state` assinado e PKCE
- [ ] Token em `private.oauth_tokens`; ausente do bundle (verificado por teste)
- [ ] Publicação real com `external_post_id` e permalink gravados
- [ ] Execução dupla do WF-002 produz uma publicação (teste de concorrência)
- [ ] Token expirado pausa jobs e alerta, sem acumular falhas
- [ ] Falha do LinkedIn não afeta outros módulos
- [ ] Se sem Standard Tier: modo assistido explícito na UI e documentado

### FASE 7 — Meta / Instagram
- [ ] Fluxo de dois passos implementado conforme documentação oficial
- [ ] Mídia por URL assinada de vida curta, revogada após publicar
- [ ] Rate limit de 200 chamadas/usuário/hora respeitado
- [ ] Container expirado é recriado, não republicado

### FASE 8 — Social Analytics
- [ ] Snapshot diário; nenhuma sobrescrita de métrica
- [ ] Reexecução no mesmo dia faz upsert, não duplica
- [ ] Engagement Rate, CTR, Lead Conversion Rate, Content ROI calculados
- [ ] Métricas indisponíveis na plataforma aparecem como indisponíveis, não como zero

### FASE 9 — AI Performance Analyst
- [ ] Formato da seção 17 (performance, por quê, aprendemos, próxima ação)
- [ ] `ai_learnings` com `evidence`, `confidence` e `sample_size`
- [ ] Aprendizado abaixo da amostra mínima não é ativado
- [ ] Aprendizados ativos entram no contexto de A2 e A3 (verificável no prompt logado)

### FASE 10 — Lead Engine
- [ ] `lead-capture` público com token, `zod`, rate limit e honeypot
- [ ] `dedupe_key` impede lead duplicado
- [ ] `origin_asset_id` e `origin_channel` preenchidos na origem
- [ ] Timeline completa em `lead_events`

### FASE 11 — ICP Engine
- [ ] Construtor visual com pesos somando 100
- [ ] Simulação de score sobre base real antes de salvar
- [ ] `breakdown` mostra contribuição e motivo por critério
- [ ] Critério sem dado é declarado; score normaliza pela cobertura
- [ ] Versionamento: alterar ICP não reescreve scores históricos

### FASE 12 — Company Discovery
- [ ] Fonte oficial ou licenciada; `source` e `source_updated_at` obrigatórios
- [ ] **Zero scraping** de plataforma com API oficial
- [ ] Deduplicação por CNPJ
- [ ] Campo sem dado fica nulo; nenhuma estimativa apresentada como fato

### FASE 13 — Prospect Intelligence
- [ ] A6 grava `grounded_on`; UI mostra apenas afirmação com lastro
- [ ] Sinais com `evidence_url` e `confidence`
- [ ] Priorização explicável no perfil
- [ ] Contato sem fonte permanece `unknown`; nenhum e-mail inferido (G1)

### FASE 14 — E-mail Outreach
- [ ] SPF, DKIM e DMARC verificados antes do primeiro envio
- [ ] Subdomínio dedicado
- [ ] Supressão verificada em todo envio (teste prova que suprimido não recebe)
- [ ] Opt-out em toda mensagem, processado automaticamente
- [ ] Resposta interrompe a sequência
- [ ] `daily_cap` respeitado; envio só em horário comercial
- [ ] Primeira abordagem em `approval_required`
- [ ] `personalization` registra os fatos usados
- [ ] Sem contexto suficiente, usa mensagem base (não inventa)
- [ ] Reexecução do WF-008 não reenvia (idempotência comprovada)

### FASE 15 — WhatsApp
- [ ] Templates aprovados por categoria correta
- [ ] Fora da janela de 24 h, só template (teste prova o bloqueio)
- [ ] `service_window_expires_at` atualizado em toda mensagem recebida
- [ ] Tier e quality rating respeitados; queda reduz cadência automaticamente
- [ ] Webhook com assinatura verificada
- [ ] Opt-out grava em `suppression_list`

### FASE 16 — AI Qualification
- [ ] A8 conduz o diagnóstico da seção 29
- [ ] **Nunca** cita preço, faz proposta ou promete prazo (verificação determinística, não só prompt)
- [ ] Todos os gatilhos de handoff disparam corretamente
- [ ] ASSUMIR CONVERSA muda `ai_mode` e notifica
- [ ] Após handoff, IA sugere ao operador e não envia
- [ ] Retomar modo autônomo exige ação deliberada

### FASE 17 — CRM + Pipeline
- [ ] 10 estágios da seção 31 configurados
- [ ] Kanban com os campos exigidos pela seção 48
- [ ] Toda mudança de estágio em `opportunity_stage_history`
- [ ] `origin_asset_id` e `origin_campaign_id` propagados do lead
- [ ] Criação de oportunidade é idempotente

### FASE 18 — Attribution
- [ ] Quatro modelos calculados; soma das parcelas = valor da oportunidade
- [ ] As cinco perguntas de `06 §3` respondidas na UI
- [ ] Views materializadas com refresh `CONCURRENTLY`
- [ ] Revenue Intelligence com todas as métricas da seção 33

### FASE 19 — AI Growth Strategist
- [ ] A9 responde as perguntas da seção 34
- [ ] Recomendação com problema, evidência, recomendação, impacto e ação
- [ ] Botão EXECUTAR só aparece com `action` válido
- [ ] `action` validado contra registro fechado antes de despachar
- [ ] Execução registrada em `audit_log` com resultado
- [ ] Next Best Action ordenada por consulta determinística

### FASE 20 — Daily Growth Cycle
- [ ] Todos os workflows exportados e versionados em `n8n/workflows/`
- [ ] Horários configuráveis por `automation_definitions`
- [ ] Modos de aprovação respeitados por automação
- [ ] Painel `/automations` com histórico e taxa de erro
- [ ] Ciclo completo executado ponta a ponta em ambiente de teste

### FASE 21 — Observabilidade + segurança
- [ ] WF-014 ativo com todos os alertas de `08 §3`
- [ ] Nenhum log com credencial (verificado por teste)
- [ ] `dsr-export` e `dsr-erase` funcionando
- [ ] Eliminação preserva `suppression_list`
- [ ] ROPA e teste de balanceamento de legítimo interesse documentados
- [ ] Aviso de privacidade publicado com operadores listados
- [ ] Revisão completa de RLS sem exceção pendente

### FASE 22 — Testes completos
- [ ] 10 fluxos E2E verdes
- [ ] ≥ 80% em `src/lib/` e utilitários compartilhados
- [ ] Matriz de RLS gerada do catálogo; tabela sem política falha o CI
- [ ] Teste de carga com volume realista
- [ ] Caos: provedor externo indisponível não derruba os demais módulos

### FASE 23 — Hardening
- [ ] Nenhuma query acima do orçamento de latência definido
- [ ] Índices revisados contra queries reais
- [ ] Custo de IA por operação medido e otimizado
- [ ] Componentes duplicados eliminados
- [ ] Dívida técnica registrada e priorizada

### FASE 24 — Deploy
- [ ] Ambientes dev e prod isolados, com segredos distintos
- [ ] Backup automático **com restauração testada** — backup não testado não é backup
- [ ] Runbooks: token expirado, workflow travado, falha de provedor, restauração
- [ ] Monitoramento e alertas em produção
- [ ] Checklist da seção 71 integralmente cumprido

---

## §4. Riscos do roadmap

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| LinkedIn nega ou atrasa o Standard Tier | Média | Alto | Pedido na FASE 1; modo assistido como contingência |
| Meta App Review reprova | Média | Alto | Preparar demo e política de privacidade cedo; 2 ciclos no cronograma |
| Custo de IA acima do previsto | Média | Médio | Orçamento por org desde a FASE 1; cache de prompt; modelo por tarefa |
| Qualidade do conteúdo abaixo do padrão premium | Média | Alto | Revisor separado, limiar de score, human-in-the-loop, aprendizado |
| Dado de CNPJ insuficiente para o ICP | **Alta** | Médio | Score normalizado por cobertura; sinais complementares; nunca inventar |
| Reputação de e-mail danificada | Média | Alto | Subdomínio dedicado, aquecimento, cap, supressão automática |
| Bloqueio de número no WhatsApp | Média | Alto | Cadência conservadora, opt-in, monitoramento de quality rating |
| Escopo crescendo além da capacidade | **Alta** | Alto | Definição de COMPLETE aplicada com rigor; nada avança com fase quebrada |

O risco de dado insuficiente para o ICP é o mais subestimado: o cadastro público
de CNPJ **não traz faturamento nem headcount**, que são dois dos cinco critérios
da seção 20. A mitigação não é estimar e apresentar como fato — é declarar a
cobertura do score, e essa decisão está em `03 §3.5`.
