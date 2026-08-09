# 11 — Plano de Estrutura no ClickUp (Growth OS)

Especificação da pasta de produto a ser criada no ClickUp. Este documento é o
contrato do que será criado — serve tanto para a criação automatizada quanto para
criação manual, se preferir.

> **Escopo.** Esta pasta contém **apenas o projeto do aplicativo**. As 53 fichas
> comerciais existentes (listas GROWTH, GERAL, COMERCIAL — Claude Version, POP)
> não são tocadas: são a operação comercial da consultoria, não o software.
> Portal Crimson e a Controladoria da Oficial Farma são projetos de outra empresa
> e não têm relação alguma com isto.

---

## Destino

| | |
|---|---|
| Workspace | `90133024540` |
| Espaço | **KEYSTONE** — `901313737868` |
| Pasta nova | **GROWTH OS — Produto** |
| Listas | 7 (uma por eixo) |
| Fichas | 24 (uma por fase) |

### Premissa das datas

Início em **segunda-feira, 10/08/2026**, com os prazos derivados das estimativas
em semanas do documento `09-ROADMAP-E-ACEITE.md`. O **Eixo D corre em paralelo ao
Eixo C** (depende apenas da FASE 3), que é o cenário recomendado no roadmap.
As datas são derivadas, não compromisso — ajuste na pasta depois de criada.

> A FASE 2 encolheu de 3 para 2 semanas quando o Cost Intelligence saiu do
> escopo (documento 15), e a FASE 5 cresceu de 2,5 para 3,5 quando a geração de
> arte entrou (documento 14). As duas quase se anulam, mas as datas das fases
> intermediárias abaixo ainda são as originais. Recalcular ao criar as fichas.

---

## Estrutura

### EIXO A — Fundação
*Estrutura técnica, banco, autenticação, multi-tenant e a tela executiva.
Nenhum outro eixo pode começar antes deste terminar.*

| Ficha | Prazo | Est. |
|---|---|---|
| **FASE 1 — Fundação técnica** | 24/08/2026 | 2 sem |
| **FASE 2 — Banco, autenticação e multi-tenant** | 07/09/2026 | 2 sem |
| **FASE 3 — Command Center** | 24/09/2026 | 1,5 sem |

### EIXO B — Conteúdo
*Inteligência de mercado, estratégia editorial e a fábrica de conteúdo com IA.*

| Ficha | Prazo | Est. |
|---|---|---|
| **FASE 4 — Content Strategy + Market Intelligence** | 12/10/2026 | 2,5 sem |
| **FASE 5 — AI Content Factory + Review** | 29/10/2026 | 2,5 sem |

### EIXO C — Publicação e Análise
*Integração com as redes, coleta de métricas e o primeiro loop de aprendizado.
Depende de aprovação de terceiros — ver as fichas de bloqueio na FASE 1.*

| Ficha | Prazo | Est. |
|---|---|---|
| **FASE 6 — LinkedIn** | 16/11/2026 | 2,5 sem |
| **FASE 7 — Meta / Instagram** | 30/11/2026 | 2 sem |
| **FASE 8 — Social Analytics** | 14/12/2026 | 2 sem |
| **FASE 9 — AI Performance Analyst** | 24/12/2026 | 1,5 sem |

### EIXO D — Demanda
*Captura de leads, ICP, descoberta de empresas e inteligência de prospecção.
Corre em paralelo ao Eixo C — depende apenas da FASE 3.*

| Ficha | Prazo | Est. |
|---|---|---|
| **FASE 10 — Lead Engine** | 08/10/2026 | 2 sem |
| **FASE 11 — ICP Engine** | 19/10/2026 | 1,5 sem |
| **FASE 12 — Company Discovery** | 05/11/2026 | 2,5 sem |
| **FASE 13 — Prospect Intelligence** | 19/11/2026 | 2 sem |

### EIXO E — Relacionamento
*Abordagem por e-mail e WhatsApp, qualificação por IA e CRM. É o eixo de maior
risco de conformidade: o primeiro em que o sistema fala com pessoas reais.*

| Ficha | Prazo | Est. |
|---|---|---|
| **FASE 14 — E-mail Outreach** | 14/01/2027 | 3 sem |
| **FASE 15 — WhatsApp** | 01/02/2027 | 2,5 sem |
| **FASE 16 — AI Qualification** | 15/02/2027 | 2 sem |
| **FASE 17 — CRM + Pipeline** | 01/03/2027 | 2 sem |

### EIXO F — Inteligência
*Atribuição de receita, agente estratégico e o ciclo diário automático.*

| Ficha | Prazo | Est. |
|---|---|---|
| **FASE 18 — Attribution** | 15/03/2027 | 2 sem |
| **FASE 19 — AI Growth Strategist** | 29/03/2027 | 2 sem |
| **FASE 20 — Daily Growth Cycle** | 08/04/2027 | 1,5 sem |

### EIXO G — Produção
*Observabilidade, LGPD, testes, hardening e deploy.*

| Ficha | Prazo | Est. |
|---|---|---|
| **FASE 21 — Observabilidade e segurança** | 22/04/2027 | 2 sem |
| **FASE 22 — Testes completos** | 06/05/2027 | 2 sem |
| **FASE 23 — Hardening** | 17/05/2027 | 1,5 sem |
| **FASE 24 — Deploy** | 24/05/2027 | 1 sem |

---

## Conteúdo de cada ficha

O conteúdo completo — descrição e subtarefas de cada uma das 24 fichas — está
especificado em **[`12-DETALHAMENTO-FASES.md`](./12-DETALHAMENTO-FASES.md)**, que
é a fonte da verdade para a criação.

Cada ficha recebe, na descrição:

1. **Objetivo** — o que a fase entrega.
2. **Por que esta fase existe** — a razão técnica ou de risco por trás dela, para
   que quem executar entenda a decisão em vez de só seguir a lista.
3. **Critérios de aceite** — checklist markdown marcável dentro do card.
4. **Dependência** e **referência** ao documento de arquitetura.

Cada ficha recebe também suas **subtarefas**, nomeadas com a etiqueta do STEP do
método de execução (`[DATABASE]`, `[BACKEND]`, `[TEST]`…), cada uma com a
especificação do que precisa ser feito.

A ficha só é fechada quando todos os critérios estiverem marcados — é a
`Definição de COMPLETE` do documento 09 aplicada dentro do ClickUp.

### Volume real

| | |
|---|---|
| Fichas de fase | 24 |
| Subtarefas | 208 |
| Critérios de aceite | 139 |
| Total de objetos no ClickUp | **240** |

---

## Prioridades

| Prioridade | Fichas | Motivo |
|---|---|---|
| `urgent` | FASE 1, FASE 2 | Sem tenancy e RLS forçada não existe nem a primeira tela real, e retrofitar isolamento depois de haver dado é ordem de magnitude pior |
| `high` | FASES 3, 6, 7, 14, 15, 21 | Gargalos de caminho crítico ou de conformidade |
| `normal` | demais | — |

---

## Observação sobre bloqueadores externos

Três itens da FASE 1 não são código e têm semanas de espera por terceiros:
o pedido de acesso ao LinkedIn Community Management API, o App Review da Meta
e a verificação de negócio do WhatsApp. Eles entram como critérios de aceite
da FASE 1 justamente para não serem esquecidos — se ficarem para as FASES 6, 7
e 15, travam o roadmap.

---

## Estado da execução

### Criado no ClickUp

| Objeto | ID | Situação |
|---|---|---|
| Pasta **GROWTH OS — Produto** | `901318739362` | ✅ |
| EIXO A — Fundação | `901328129599` | ✅ |
| EIXO B — Conteúdo | `901328129600` | ✅ |
| EIXO C — Publicação e Análise | `901328129601` | ✅ |
| EIXO D — Demanda | `901328129602` | ✅ |
| EIXO E — Relacionamento | `901328129603` | ✅ |
| EIXO F — Inteligência | `901328129604` | ✅ |
| EIXO G — Produção | `901328129605` | ✅ |
| FASE 1 — Fundação técnica | `86ajy2jwa` | ✅ completa, 14 subtarefas |
| FASE 2 — Banco, auth e multi-tenant | `86ajy2jwg` | ⚠️ 4 de 13 subtarefas — **as 4 criadas descrevem o escopo antigo e precisam ser revistas** |
| FASE 3 — Command Center | `86ajy2jwh` | ⚠️ 0 de 9 subtarefas |

**29 de 240 objetos criados (12%).**

### O que falta

| Pendência | Volume |
|---|---|
| FASE 2 — rever as 4 subtarefas criadas e criar as 9 restantes | 13 |
| FASE 3, subtarefas | 9 |
| Fichas de fase dos eixos B a G | 21 |
| Subtarefas dos eixos B a G | 172 |

### Histórico

| Data | Evento |
|---|---|
| 08/08 · tarde | Estrutura especificada. Criação bloqueada por rate limit (224 min). Reagendada. |
| 08/08 · 18:10 | Segunda tentativa: ainda bloqueado, 126 min restantes. |
| 08/08 · 20:35 | Cota liberada. Pasta, 7 listas, 3 fichas do EIXO A e 18 subtarefas criadas. |
| 08/08 · 20:38 | **Cota diária esgotada em ~29 objetos** — 1438 min (24 h) para renovar. Reagendado para 09/08 às 20:51. |
| 09/08 · 08:05 | Ainda bloqueado, 746 min — a cota é da conta, não deste projeto. Ver a nota abaixo. |

### Nota sobre o limite da API

O bloqueio de 1438 minutos indica **cota diária**, não janela deslizante: renova
uma vez por dia. Na prática, cerca de 30 objetos por dia.

A cota é da conta, não deste projeto: **outras integrações ligadas à mesma
chave a consomem**, e é por isso que o limite bate com pouquíssimas chamadas
feitas aqui. Não é problema de código, e não se resolve dentro deste
repositório — é agendamento de quem usa a API e quando.

Se a velocidade importar, a saída independente disso é **criar as 21 fichas de
fase primeiro e as subtarefas depois**: em um dia o roadmap inteiro fica
visível, e o detalhe entra ao longo da semana. É a ordem já programada para a
próxima execução.

### Correção pendente de aplicar

A FASE 5 mudou depois que o documento 12 foi escrito. Ver
[`14-GERACAO-DE-ARTE-E-AUTOMACAO.md`](./14-GERACAO-DE-ARTE-E-AUTOMACAO.md):
passou de 2,5 para 3,5 semanas e ganhou geração automática de arte. A ficha da
FASE 5 deve ser criada a partir do documento 14, não do 12 — e os prazos das
fases seguintes deslocam uma semana.
