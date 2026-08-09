# 01 — Arquitetura

Cobre os itens 1 a 5 exigidos pela seção 66 do Master Prompt.

---

## §1. Visão do sistema

### O que estamos construindo

Keystone Growth OS é um **sistema operacional de crescimento comercial**: um ciclo
fechado que vai de inteligência de mercado até receita registrada, e devolve o
resultado da venda como insumo de aprendizado para o próximo ciclo.

A distinção prática entre isto e uma ferramenta de social media é uma só: aqui,
**todo conteúdo publicado carrega identidade até a oportunidade fechada**. Um post
não termina em métricas de engajamento — ele termina em `attribution_results` com
um valor em reais associado. Essa exigência de rastreabilidade ponta a ponta é o
que dita quase todas as decisões de modelagem deste documento.

### A pergunta que o sistema responde

> "Quais ações de marketing e prospecção têm maior probabilidade de gerar a
> próxima venda?"

Isto não é slogan; é um critério de arquitetura executável. Toda tabela, todo
endpoint e todo agente deste documento foi avaliado por: *contribui para responder
isso?* O que não contribuía foi cortado.

Consequências concretas dessa escolha:

- `content_assets` referencia `content_ideas`, que referencia `ai_insights` — a
  origem de mercado de cada peça é rastreável.
- `leads`, `opportunities` e `touchpoints` carregam `origin_asset_id` e
  `origin_campaign_id`. Sem isso, atribuição é impossível a posteriori.
- `ai_learnings` é uma tabela de primeira classe, não um log. O aprendizado é
  produto.
- Nenhum dashboard tem "curtidas" como métrica primária.

### Princípio operacional: cada módulo alimenta o próximo

```
                        ┌──────────────────────────────────┐
                        │        AI GROWTH STRATEGIST      │
                        │   (lê tudo, recomenda, prioriza) │
                        └───────┬──────────────────┬───────┘
                                │                  │
   MERCADO ──▶ INTELLIGENCE ──▶ CONTENT ──▶ PUBLISHING ──▶ ANALYTICS
                     │             STRATEGY      │             │
                     │                │          │             │
                     │                ▼          ▼             ▼
                     │           AI CONTENT   SOCIAL       PERFORMANCE
                     │            FACTORY     POSTS         ANALYST
                     │                                         │
                     ▼                                         ▼
              ICP ENGINE ──▶ COMPANY ──▶ PROSPECT ──▶ LEAD ENGINE
                             DISCOVERY   INTELLIGENCE      │
                                              │            │
                                              ▼            ▼
                                        OUTREACH ──▶ QUALIFICATION
                                        (email/WA)         │
                                                           ▼
                                                    HUMAN HANDOFF
                                                           │
                                                           ▼
                                              CRM ──▶ OPPORTUNITY ──▶ WON
                                                                       │
                                                           ┌───────────┘
                                                           ▼
                                                  ATTRIBUTION ENGINE
                                                           │
                                                           ▼
                                                    AI LEARNINGS ──┐
                                                                   │
                        └──────────────────────────────────────────┘
                                    (realimenta o topo)
```

O loop de retorno não é decorativo. `ai_learnings` é lido como contexto em toda
geração de conteúdo e em todo scoring — é o mecanismo pelo qual "no dia seguinte o
sistema fica melhor" (seção 72) deixa de ser figura de linguagem.

### Fronteira explícita: o que o sistema não decide

O sistema executa pesquisa, análise, produção, organização, classificação,
publicação, monitoramento e pré-qualificação. **A decisão comercial permanece
humana** (seção 51). Isto está codificado, não apenas documentado:

- `automation_definitions.approval_mode` ∈ `auto | approval_required | manual`
- `whatsapp_conversations.ai_mode` ∈ `autonomous | assist | off`
- Gatilhos de handoff são regra de banco, não julgamento do modelo (ver `05 §6`).

---

## §2. Arquitetura

### Visão de camadas

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENTE  — React SPA (Vite)                                        │
│  Nunca vê: token OAuth, chave de LLM, service_role, segredo algum.  │
│  Fala com: PostgREST (RLS) e Edge Functions (JWT do usuário).       │
└───────────────┬─────────────────────────────────┬───────────────────┘
                │ supabase-js (anon key + JWT)    │ fetch + JWT
                ▼                                 ▼
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│  PostgREST                    │   │  EDGE FUNCTIONS (Deno)          │
│  CRUD e leitura agregada      │   │  Fronteira de confiança.        │
│  Toda query passa por RLS     │   │  Toda chamada externa.          │
│  Agregação via RPC SECURITY   │   │  Valida JWT → resolve org →     │
│  INVOKER                      │   │  aplica regra → registra log.   │
└───────────────┬───────────────┘   └────────┬───────────────┬────────┘
                │                            │               │
                ▼                            ▼               ▼
┌─────────────────────────────────┐  ┌──────────────┐  ┌──────────────┐
│  POSTGRES                       │  │ VAULT/private│  │  EXTERNO     │
│  public   → exposto, com RLS    │  │ Tokens OAuth │  │  LinkedIn    │
│  private  → nunca exposto       │  │ Chaves API   │  │  Meta/IG     │
│  app      → funções auxiliares  │  │ Nunca sai    │  │  WhatsApp    │
│  pgvector para RAG              │  │ do servidor  │  │  E-mail      │
└─────────────────────────────────┘  └──────────────┘  │  LLMs        │
                ▲                                      │  CNPJ        │
                │ service_role, rede restrita          └──────────────┘
┌───────────────┴─────────────────┐                            ▲
│  n8n — ORQUESTRADOR             │────────────────────────────┘
│  Agenda, retry, fan-out.        │   (sempre via Edge Function,
│  NÃO contém regra de negócio.   │    nunca direto do n8n)
└─────────────────────────────────┘
```

### As quatro invariantes da arquitetura

Estas quatro regras não admitem exceção. Se uma implementação futura precisar
violá-las, isso exige um novo ADR, não uma exceção pontual.

**I-1 — O frontend não possui segredos.**
Se uma operação exige credencial que não seja o JWT do próprio usuário, ela
acontece em Edge Function. Isto elimina por construção a classe inteira de
vulnerabilidade "token no bundle". Corolário: o cliente nunca chama LinkedIn,
Meta, WhatsApp, provedor de e-mail ou LLM diretamente.

**I-2 — Toda linha de negócio pertence a uma organização.**
Toda tabela de negócio tem `organization_id NOT NULL` e política de RLS que a
filtra. Não existe tabela "global" com dados de cliente. Detalhado em `07 §2`.

**I-3 — n8n orquestra, não decide.**
n8n resolve *quando* e *quantas vezes*; a Edge Function resolve *o quê*. A razão é
testabilidade: regra em TypeScript versionado tem teste unitário e code review;
regra dentro de nó de workflow em JSON não tem nenhum dos dois. Ver ADR-006.

**I-4 — Nenhum efeito colateral externo sem chave de idempotência.**
Publicar, enviar e-mail, enviar WhatsApp, criar lead, criar oportunidade — todos
passam por `idempotency_keys` ou constraint natural única. Reexecução de workflow
é normal e esperada; publicação duplicada não é. Ver `04 §3`.

### Por que Supabase e não um backend próprio

Trade-off assumido explicitamente. Supabase entrega auth, RLS, storage, realtime,
pgvector e funções serverless num só produto, o que para uma equipe pequena vale
mais que a flexibilidade de um backend dedicado. O custo é acoplamento: RLS em SQL
é menos expressiva que regra em código e o debugging de política é pior.

A mitigação é a fronteira de Edge Functions: regra complexa vive em TypeScript
testável, e RLS carrega apenas a responsabilidade de isolamento de tenant — que é
exatamente o tipo de regra simples e uniforme que RLS faz bem. Se um dia for
preciso sair do Supabase, o que precisa ser reescrito são as funções e as
políticas, não o modelo de dados.

### Estrutura de diretórios alvo

```
/
├── docs/                          # este diretório
├── src/
│   ├── app/                       # composição: router, providers, guards
│   ├── modules/                   # UM diretório por módulo de negócio
│   │   ├── command-center/
│   │   ├── intelligence/
│   │   ├── content/
│   │   ├── calendar/
│   │   ├── social/
│   │   ├── analytics/
│   │   ├── leads/
│   │   ├── prospects/
│   │   ├── campaigns/
│   │   ├── inbox/
│   │   ├── pipeline/
│   │   ├── automations/
│   │   ├── ai-insights/
│   │   └── settings/
│   ├── components/
│   │   ├── ui/                    # shadcn — PRESERVADO
│   │   └── shared/                # componentes transversais do produto
│   ├── lib/                       # utilitários puros e testáveis
│   ├── integrations/supabase/
│   └── types/
├── supabase/
│   ├── migrations/                # versionado, sequencial, reversível
│   └── functions/                 # Edge Functions (Deno)
│       ├── _shared/               # auth, logging, idempotência, erros
│       ├── ai-gateway/
│       ├── social-publish/
│       └── …
├── n8n/workflows/                 # exports JSON versionados
└── tests/
    ├── unit/  ├── db/  └── e2e/
```

Cada `modules/<nome>/` contém `pages/`, `components/`, `hooks/`, `api/`,
`types.ts`. Regra: um módulo pode importar de `components/ui`, `lib` e `shared`;
**não pode importar de outro módulo**. Dependência entre domínios passa por
`lib/` ou pelo banco. Isso mantém a extração para SaaS multiempresa viável.

---

## §3. Stack

| Camada | Escolha | Justificativa |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Já presente e correto |
| Estilo | Tailwind + shadcn/ui (Radix) | 48 componentes já disponíveis |
| Estado servidor | TanStack Query | Já presente; cache e invalidação |
| Estado URL | `nuqs` ou searchParams nativo | Filtros compartilháveis por link |
| Formulários | react-hook-form + zod | Já instalados, subutilizados |
| Gráficos | Recharts | Já presente |
| Tabelas | TanStack Table | **A adicionar** — listas grandes precisam de virtualização |
| Datas | date-fns + `date-fns-tz` | Fuso `America/Sao_Paulo` é regra de negócio |
| Banco | PostgreSQL (Supabase) | — |
| Vetores | pgvector | RAG sem infra adicional (ADR-007) |
| Auth | Supabase Auth | — |
| Arquivos | Supabase Storage | Knowledge base, mídia de post |
| Serverless | Edge Functions (Deno) | Fronteira de confiança |
| Orquestração | n8n (self-hosted) | Agenda, retry, fan-out |
| IA | Camada própria sobre múltiplos provedores | ADR-005 |
| Testes | Vitest, pgTAP, Playwright | Unit, RLS, E2E |
| CI | GitHub Actions | **A adicionar** |

### Adições ao `package.json` (FASE 1)

`@tanstack/react-table`, `date-fns-tz`, `nuqs`, `@supabase/ssr` (se houver SSR
futuro), `ulid`. Nada mais é adicionado sem justificativa em ADR — o inchaço de
dependência é dívida de segurança.

---

## §4. Mapa de módulos

15 módulos. Coluna "Fase" indica quando nasce; coluna "Depende de" é a razão da
ordem do roadmap.

| # | Módulo | Responsabilidade | Depende de | Fase |
|---|---|---|---|---|
| M00 | **Platform** | Auth, organizations, memberships, RBAC, settings, audit | — | 1–2 |
| M01 | **Command Center** | Visão executiva, Growth Score, Next Best Action | M00 | 3 |
| M02 | **Market Intelligence** | Descoberta de oportunidade de conteúdo e comercial | M00, M14 | 4 |
| M03 | **Content Strategy** | Pilares, temas, ideias, calendário editorial, campanhas | M02 | 4 |
| M04 | **AI Content Factory** | Geração de copy, roteiro, carrossel, briefing visual | M03, M14 | 5 |
| M05 | **Content Review** | Content Score 0–100 e sugestões de melhoria | M04 | 5 |
| M06 | **Social Publishing** | Contas, agendamento, publicação, jobs, erros | M05 | 6–7 |
| M07 | **Social Analytics** | Coleta de métricas e métricas derivadas | M06 | 8 |
| M08 | **AI Performance Analyst** | Análise por peça e registro de aprendizado | M07 | 9 |
| M09 | **Lead Engine** | Captura, deduplicação, scoring, ciclo de vida | M00 | 10 |
| M10 | **ICP Engine** | Construtor visual de ICP com pesos, ICP Score | M09 | 11 |
| M11 | **Company Discovery** | Descoberta de empresas por fonte oficial/licenciada | M10 | 12 |
| M12 | **Prospect Intelligence** | Perfil, sinais, pesquisa e priorização | M11, M14 | 13 |
| M13 | **Outreach Engine** | Campanhas, sequências, opt-out, envio, entrega | M12 | 14–15 |
| M14 | **AI Core** | Gateway, prompts, RAG, custo, aprendizado, agentes | M00 | 1, 5, 19 |
| M15 | **CRM & Attribution** | Pipeline, oportunidades, atribuição, receita | M09, M13 | 17–18 |
| M17 | **Automation & Observability** | Definições, execuções, logs, alertas | M00 | 20–21 |

**Nota sobre M14 (AI Core).** Aparece na FASE 1 porque o `ai-gateway` e as tabelas
`ai_invocations` / `ai_prompts` precisam existir antes da primeira chamada de LLM
de qualquer módulo. Construir o gateway depois significa refatorar todos os
consumidores — e perder o histórico de custo dos primeiros meses.

---

## §5. Mapa de telas

Sidebar conforme seção 43 do Master Prompt.

| Rota | Tela | Conteúdo principal | Fonte de dados | Fase |
|---|---|---|---|---|
| `/login` | Login | E-mail/senha, magic link, recuperação | Supabase Auth | 2 |
| `/onboarding` | Onboarding | Criar org, convidar time, marca inicial | `organizations`, `memberships` | 2 |
| `/` | **Command Center** | Growth Score, KPIs de receita e pipeline, AI Growth Insight, Next Best Action, atividade automática | RPC `rpc_command_center` | 3 |
| `/intelligence` | Market Intelligence | Feed de insights com relevância e potencial comercial; "gerar ideia a partir deste insight" | `ai_insights` | 4 |
| `/content` | Content Center | Ideias, biblioteca, revisão, publicados | `content_ideas`, `content_assets` | 4–5 |
| `/content/:id` | Editor de peça | Copy, variações, CTA, mídia, Content Score, histórico | `content_assets`, `content_reviews` | 5 |
| `/content/strategy` | Estratégia editorial | Pilares, temas, regras de distribuição semanal | `content_pillars`, `content_calendar_rules` | 4 |
| `/calendar` | Calendário | Mês / semana / dia / lista; canal, formato, status, score, métricas | `content_calendar` | 4 |
| `/social` | Social | Contas conectadas, saúde de token, fila, histórico, falhas | `social_accounts`, `publishing_jobs` | 6–7 |
| `/analytics` | Analytics | Alcance, engajamento, CTR, leads por canal, Content ROI | `social_post_metrics` + views | 8 |
| `/analytics/content/:id` | Análise da peça | Performance, "por quê", aprendizado, próxima ação | `ai_learnings` | 9 |
| `/leads` | Lead Center | Novos, qualificados, quentes, sem resposta, em follow-up, convertidos | `leads`, `lead_scores` | 10 |
| `/leads/:id` | Lead | Timeline, origem, conteúdo de origem, score, ações | `lead_events` | 10 |
| `/prospects` | Prospect Center | Empresas com ICP Score, filtros por segmento, UF, status, campanha | `prospects`, `prospect_scores` | 12–13 |
| `/prospects/:id` | Prospect | Perfil, sinais, motivos do score, contatos, pesquisa da IA | `company_research`, `prospect_signals` | 13 |
| `/prospects/icp` | ICP Builder | Construtor visual de critérios com pesos, simulação de score | `icp_profiles` | 11 |
| `/campaigns` | Campanhas | Lista, performance por etapa, taxa de resposta, opt-out | `campaigns`, `campaign_steps` | 14 |
| `/campaigns/:id` | Editor de sequência | D0/D3/D7/D14/D30, condições, canal, template, encerramento | `campaign_steps` | 14 |
| `/inbox` | Inbox unificada | Conversas WhatsApp e e-mail, modo da IA, botão **ASSUMIR CONVERSA** | `whatsapp_conversations` | 15–16 |
| `/pipeline` | Pipeline (Kanban) | Cards com empresa, contato, valor, score, origem, última atividade, próxima ação | `opportunities` | 17 |
| `/pipeline/:id` | Oportunidade | Estágio, valor, probabilidade, histórico, atribuição de origem | `opportunity_stage_history` | 17 |
| `/automations` | Automações | Catálogo, cron, modo de aprovação, últimas execuções, taxa de erro | `automation_definitions`, `automation_runs` | 20 |
| `/automations/runs/:id` | Execução | Timeline por passo, payload, erro, correlation ID | `automation_logs` | 21 |
| `/ai-insights` | AI Insights | Feed de recomendações: problema, evidência, recomendação, impacto, botão **EXECUTAR** | `ai_recommendations` | 19 |
| `/settings/*` | Configurações | Organization, Brand, AI, Social, WhatsApp, Email, ICP, Automation, Notifications, Security, Billing | diversas | 2+ |

### Linguagem visual

Posicionamento premium e executivo (seção 7) traduzido em regras verificáveis,
para que "sofisticado" não vire questão de gosto em code review:

- **Dark-first**, com tema claro suportado. Superfícies em cinza-azulado profundo,
  não preto puro.
- **Uma cor de acento apenas**, usada para ação primária e destaque de dado. Cor
  em gráfico serve para codificar informação, nunca para decorar.
- **Semântica restrita a três estados**: positivo, atenção, negativo. Sem paleta
  arco-íris.
- **Números são o elemento visual dominante.** Tipografia tabular alinhada à
  direita em toda métrica; densidade de informação acima de espaço em branco.
- **Todo KPI carrega comparação** (período anterior ou meta). Número solto não
  informa.
- **Zero ilustração, zero emoji na navegação** — o `💰` atual sai.
- Estados de vazio explicam o que o sistema fará, não pedem desculpas.

A paleta e os tokens concretos entram em `src/index.css` na FASE 1, substituindo
o tema padrão do Lovable.
