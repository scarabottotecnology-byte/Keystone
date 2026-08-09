# KEYSTONE GROWTH OS — Documentação de Arquitetura

**Status:** FASE 0 — Discovery e Arquitetura · **CONCLUÍDA**
**Próximo comando esperado:** `EXECUTE FASE 1`
**Data:** 2026-08-08 · revisto em 2026-08-09
**Repositório:** `scarabottotecnology-byte/Keystone`
**Branch:** `claude/keystone-growth-os-architecture-62okww`

---

## O que é este diretório

Este é o entregável da FASE 0. Nenhum código de produto foi escrito, nenhuma
migração foi aplicada e nenhuma tela foi criada. O objetivo desta fase é
estabelecer o contrato de arquitetura que governa as FASES 1 a 24.

> **Regra de execução:** a FASE 1 não deve começar antes da aprovação deste
> documento. Alterações posteriores à arquitetura devem ser registradas como
> novos ADRs em `10-DECISOES-ARQUITETURAIS-ADR.md`, nunca por edição silenciosa.

---

## Índice

| # | Documento | Conteúdo |
|---|---|---|
| 00 | [Auditoria do repositório de origem](./00-AUDITORIA-ESTADO-ATUAL.md) | STEP 1 — auditoria do Centro de Custos, achados CRITICAL/HIGH/MEDIUM/LOW. Outro produto: nada aqui é herdado |
| 01 | [Arquitetura](./01-ARQUITETURA.md) | Visão do sistema, arquitetura, stack, mapa de módulos, mapa de telas |
| 02 | [Modelo de Dados](./02-MODELO-DE-DADOS.md) | Entidades, relacionamentos, DDL de contrato, enums, índices |
| 03 | [APIs e Integrações](./03-APIS-E-INTEGRACOES.md) | Superfície de API interna, integrações externas, limites reais verificados |
| 04 | [Workflows n8n](./04-WORKFLOWS-N8N.md) | WF-001 a WF-014, idempotência, retry, correlation ID |
| 05 | [Agentes de IA](./05-AGENTES-DE-IA.md) | Camada de abstração, agentes, prompts, RAG, controle de custo |
| 06 | [Fluxo de Dados](./06-FLUXO-DE-DADOS.md) | Ciclo mercado → receita → aprendizado, atribuição, Daily Growth Cycle |
| 07 | [Segurança, LGPD e Multi-tenant](./07-SEGURANCA-LGPD-MULTITENANT.md) | RLS, isolamento, segredos, base legal, direitos do titular |
| 08 | [Observabilidade e Testes](./08-OBSERVABILIDADE-E-TESTES.md) | Estratégia de logs, métricas, alertas, pirâmide de testes |
| 09 | [Roadmap e Critérios de Aceite](./09-ROADMAP-E-ACEITE.md) | FASE 1 a 24, definição de COMPLETE, critérios objetivos por fase |
| 10 | [Decisões Arquiteturais (ADR)](./10-DECISOES-ARQUITETURAIS-ADR.md) | ADR-001 a ADR-013, incluindo as decisões irreversíveis sinalizadas |

### Documentos posteriores à FASE 0

Correções e planos escritos depois que a arquitetura foi entregue. Onde
divergirem dos documentos acima, **eles prevalecem**.

| # | Documento | Conteúdo |
|---|---|---|
| 11 | [Plano ClickUp](./11-PLANO-CLICKUP-GROWTH-OS.md) | Estrutura de pastas, listas e fichas do projeto |
| 12 | [Detalhamento das fases](./12-DETALHAMENTO-FASES.md) | Descrição e subtarefas das 24 fichas |
| 13 | [Execução da FASE 1](./13-EXECUCAO-FASE-1.md) | O que já foi construído e o que falta |
| 14 | [Geração de arte e automação](./14-GERACAO-DE-ARTE-E-AUTOMACAO.md) | Correção: a arte é composta por template, não gerada por modelo. Altera a FASE 5 |
| 15 | [Reversão do ADR-001](./15-REVERSAO-ADR-001-INFRAESTRUTURA.md) | ADR-013: infraestrutura própria. Tira o Cost Intelligence do escopo |
| 16 | [Fatia vertical de publicação](./16-FATIA-VERTICAL-PUBLICACAO.md) | **Ordem de execução vigente.** Substitui a sequência fase a fase. Corrige o mecanismo de renderização do documento 14 |

---

## Rastreabilidade com o Master Prompt

O Master Prompt (seção 66) exige 20 conteúdos no documento de arquitetura.
Mapeamento auditável:

| # | Exigência | Onde está |
|---|---|---|
| 1 | Visão do sistema | 01 §1 |
| 2 | Arquitetura | 01 §2 |
| 3 | Stack | 01 §3 |
| 4 | Mapa de módulos | 01 §4 |
| 5 | Mapa de telas | 01 §5 |
| 6 | Modelo de dados | 02 §1–§3 |
| 7 | Entidades | 02 §4 |
| 8 | Relacionamentos | 02 §5 |
| 9 | APIs | 03 §1–§2 |
| 10 | Integrações | 03 §3 |
| 11 | Workflows n8n | 04 |
| 12 | Agentes de IA | 05 |
| 13 | Fluxo de dados | 06 |
| 14 | Segurança | 07 §1–§4 |
| 15 | LGPD | 07 §6 |
| 16 | Multi-tenant | 07 §2 |
| 17 | Estratégia de logs | 08 §1–§3 |
| 18 | Estratégia de testes | 08 §4 |
| 19 | Roadmap | 09 §2 |
| 20 | Critérios de aceite | 09 §3 |

---

## Sinalizações que exigem decisão humana antes da FASE 1

Estes pontos estão detalhados nos ADRs e **bloqueiam ou atrasam fases específicas**.
Não são impedimento para iniciar a FASE 1, mas precisam ser acionados agora porque
têm lead time externo.

1. **ADR-013 — Infraestrutura própria.** Repositório e Supabase só do Growth OS,
   sem herdar nada de outro produto. Substitui o ADR-001. Ver documento 15.
2. **ADR-002 — Multi-tenant desde a FASE 2.** O banco nasce vazio, então toda
   tabela nasce com `organization_id` e RLS forçada. É a razão pela qual a FASE 2
   não pode ser pulada — retrofitar tenancy depois é ordem de magnitude pior.
3. **LinkedIn Community Management API** exige empresa registrada, Página verificada
   e aprovação em duas etapas (Development Tier → Standard Tier). **Iniciar o pedido
   na FASE 1**, não na FASE 6, sob pena de bloquear o roadmap por semanas.
4. **Meta / Instagram App Review** leva tipicamente 4–6 semanas incluindo revisão.
   **Iniciar na FASE 1.**
5. **WhatsApp Business** exige verificação de negócio e templates aprovados por
   categoria. **Iniciar na FASE 1.**
6. **Fonte de dados de CNPJ** — decidir entre carga dos dados abertos da Receita
   Federal (mensal, gratuito, pesado) e API licenciada (custo recorrente). ADR-009.
