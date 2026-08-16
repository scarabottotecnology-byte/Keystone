# 19 — Execução da FASE 4

Registro do que foi construído na FASE 4 — Content Strategy + Market
Intelligence. Segue os STEPs 11 e 12 do método (DOCUMENT e REPORT) do
documento 09.

**Status:** completa. Infraestrutura de dado, `ai-gateway`, os dois agentes
(A1 `market-intelligence`, A2 `content-strategist`) como Edge Functions
deployadas, o export do workflow WF-015 e as telas de Intelligence e
Calendar estão prontos e verificados. Falta apenas ação humana fora do
código: configurar `ANTHROPIC_API_KEY` como secret e validar A1/A2 ponta a
ponta com uma chamada real (ver "Pendente" no fim).

---

## O débito da FASE 1, cobrado nesta fase

`ai-gateway` foi adiado na FASE 1 (subtarefas 9–10) porque dependia de
`organizations`, que só nasceu na FASE 2. A FASE 4 é a primeira que
realmente precisa dele — os agentes A1 e A2 só existem através dele
("nenhum código de produto chama provedor diretamente", documento 03 §3.7).
Em vez de empilhar FASE 4 sobre uma dívida, esta sessão fechou a dívida
primeiro.

## Migração `ai_core_and_observability`

`ai_providers`, `ai_prompts` (com `organization_id null` = prompt global da
plataforma), `ai_invocations`, a view `ai_usage_daily`,
`automation_definitions`, `automation_runs`, `automation_logs`,
`integration_logs`, `error_logs` — RLS forçada desde a criação em todas,
seguindo docs/02-MODELO-DE-DADOS.md §4.9/§4.10 exatamente.

**`ai_usage_daily` com `security_invoker = true`.** Sem essa opção (PG15+,
disponível — o projeto roda PostgreSQL 17.6), a view rodaria com o
privilégio de quem a criou e ignoraria a RLS de `ai_invocations` por baixo:
qualquer um com `SELECT` na view veria o custo de IA de todas as
organizações. Mesma classe do achado C-01, agora em view.

**`automation_runs` sem política de UPDATE para o cliente.** Uma automação
fecha a própria execução via `service_role` — não há sessão de usuário para
agir em nome de, e este é exatamente o caso legítimo de `service_role`
(diferente do C-01, que era RLS *pretendendo* proteger e falhando por
política solta).

## Achado real: `anon` executava as duas RPCs do Command Center

Descoberto ao verificar `has_function_privilege('anon', ..., 'EXECUTE')`
diretamente contra o catálogo, ainda na abertura desta fase: `revoke all on
function ... from public` não bastou. O schema `public` deste projeto tem um
privilégio padrão (`pg_default_acl`, role `postgres`) que concede `EXECUTE`
a `anon` diretamente em toda função nova criada em `public` — não herdado de
`PUBLIC`. Confirmado empiricamente: `anon` conseguia chamar
`rpc_command_center()` e só era barrado pela exceção interna da função (sem
vínculo ativo), não pelo próprio `GRANT`.

**Corrigido** com a migração `command_center_revoke_anon_execute`.
**Generalizado** na suíte pgTAP: uma asserção de catálogo agora confirma que
nenhuma função de `public`, presente ou futura, concede `EXECUTE` a `anon` —
sem listar nome de função nenhum.

## `ai-gateway` — `supabase/functions/_shared/ai-gateway/`

Módulo compartilhado, não Edge Function HTTP separada — mesmo padrão de
`_shared/auth.ts`/`_shared/log.ts` da FASE 1. `service_role` aqui não é o
atalho do achado C-01: os agentes que chamam (A1, A2) são disparados por
cron via n8n, sem usuário logado para autenticar — é o caso legítimo de "não
há sessão para agir em nome de". O escopo por organização é aplicado
explicitamente em cada consulta do módulo, nunca implicitamente por RLS.

| Módulo | Responsabilidade | Testado |
|---|---|---|
| `types.ts` | Contrato `invoke()` — união discriminada, não exceção | — |
| `template.ts` | Substituição `{{variavel}}`, lança erro em vez de deixar literal passar | 6 testes |
| `pricing.ts` | Custo estimado; `null`, nunca `0`, sem preço configurado | 5 testes |
| `validate.ts` | Validação `ajv` contra `output_schema` | 6 testes |
| `providers/anthropic.ts` | Saída estruturada por *tool* forçada, não por instrução em texto | — |
| `gateway.ts` | Orquestração: prompt → orçamento → provedor → validação → fallback → registro | — |

**Saída estruturada por tool forçada.** A Messages API não tem modo JSON
nativo. Em vez de "peça JSON e torça" — o padrão que este projeto rejeita em
qualquer outro lugar (A8 barra saída com padrão de preço por
pós-processamento, não só por prompt) —, o provedor Anthropic define uma
*tool* cujo `input_schema` é o próprio `output_schema` do prompt, com
`tool_choice` fixo. `ajv` depois é a segunda camada, defesa em profundidade.

**Custo nunca fabricado.** `estimateCostUsd` devolve `null` quando
`ai_providers.config.pricing` não tem o modelo — o preço não é hardcoded no
módulo, viria de uma tabela do provedor que muda sem aviso. Um `null` aqui é
"custo desconhecido", nunca confundido com "não custou nada" — mesmo
raciocínio do `keystone-data/no-masking-fallback` (FASE 2), só que no
backend, por disciplina manual, já que Edge Functions ficam fora do ESLint
do frontend.

**Falha de schema não troca de provedor.** Até duas tentativas por provedor
— a segunda com o erro de validação anexado ao prompt —, porque saída fora
do schema é problema de prompt, não do provedor; trocar de modelo só
mascararia (documento 05 §1). Esgotadas as duas, aí sim o próximo provedor
da fila (`fallback_from` registrado).

**Verificação:** os três módulos puros (`template`, `pricing`, `validate`) —
17 testes no vitest. `gateway.ts` e `providers/anthropic.ts` não são
testáveis no vitest sem mockar `@supabase/supabase-js` e `fetch`
extensivamente; ficam sujeitos ao `deno check` do CI, não executado nesta
sandbox (sem Deno local, mesma limitação já registrada nas fases
anteriores). Nenhum provedor real foi chamado nesta sessão — sem
`ANTHROPIC_API_KEY` configurada como Edge Function secret, o gateway
devolve `misconfigured` de propósito, em vez de simular uma resposta.

## Migração `content_strategy_and_market_intelligence`

`market_intelligence_sources` — tabela não nomeada no documento 12 (que só
lista as de conteúdo e `ai_insights`), mas exigida pelo próprio A1: "analisa
fontes configuradas e autorizadas... não 'a internet'" (documento 05 §4).
Sem uma tabela de fontes essa frase não tinha onde se apoiar.

`ai_insights` com `source_url not null` — o documento 02 modelava como
opcional; corrigido nesta fase (na migração e na documentação) porque o
documento 05 e o critério de aceite da FASE 4 são explícitos: rastreabilidade
não é opcional.

`content_pillars`, `content_topics`, `content_formats`, `content_ideas`,
`content_calendar_rules`, `content_calendar`, `content_campaigns` — schema
do documento 02 §4.3, com duas colunas que apontam para tabelas da FASE 5
(`content_pillars.methodology_id` → `brand_services`, `content_calendar.asset_id`
→ `content_assets`) criadas sem a FK, que a FASE 5 acrescenta quando a
tabela do outro lado existir.

**`app.is_org_operator()`, novo helper de RLS.** Estratégia editorial é
trabalho operacional do dia a dia, não administração de organização — dali
em diante, toda tabela de domínio de negócio usa este helper (role
`owner`/`admin`/`operator`) para INSERT/UPDATE/DELETE, reservando
`app.is_org_admin` para configuração de organização de verdade.
`ai_insights` é a exceção deliberada: `INSERT` fica em `admin_insert`, não
`operator_insert` — um `operator_insert` deixaria qualquer membro inserir
"insight" sem passar pela validação de fonte do `ai-gateway`.

## Seed: os 13 pilares e as regras de distribuição semanal

Os 13 pilares da Keystone (Controladoria, FP&A, Budget, Forecast, Custos,
Pricing, Fluxo de Caixa, EBITDA, Indicadores, Gestão Financeira, M&A,
Crescimento empresarial, Estratégia) e as cinco regras semanais
(segunda=educação … sexta=comercial), exatamente como o documento 12
especifica. `slot_time` 09:00 e `channel` LinkedIn são ponto de partida
razoável, não regra do master prompt — editável quando a tela de estratégia
editorial existir.

Também os prompts globais de A1 (`market_intelligence.analyze`) e A2
(`content_strategist.generate_idea`), com `output_schema` completo, e o
provedor Anthropic ativado para a Keystone (`config` sem `pricing` — um
admin preenche quando tiver a tabela de preço real em mãos).

## pgTAP: catálogo generalizado

A suíte de regressão do achado C-01 (`rls_anon.sql`) tinha uma lista de
nomes de tabela nas duas provas de catálogo, que já estava em sete entradas
e ia crescer a cada fase. Generalizada para varrer todo o schema `public`
sem listar nome — antecipa o que a FASE 22 pede ("matriz gerada do
catálogo... tabela sem política falha o CI por omissão"). As tabelas desta
fase ganharam um representante testado por comportamento cada
(`ai_invocations`, `ai_prompts`, `content_pillars`) — o resto está coberto
estruturalmente pela varredura, que não decide por nome.

29 asserções ao todo, cada uma verificada manualmente contra o banco remoto
antes de commitar — mesma disciplina de toda fase anterior.

## Agente A1 — `market-intelligence` (Edge Function)

Disparado por cron (n8n, WF-015), sem sessão de usuário. Autentica por
cabeçalho compartilhado `x-automation-secret`, comparado contra o secret
`AUTOMATION_WEBHOOK_SECRET` — não é o atalho do achado C-01: não existe
sessão para contornar, é o mecanismo correto para uma chamada
máquina-a-máquina. Roda inteiramente com `service_role`, escopando por
organização explicitamente em cada consulta, nunca por RLS implícita.

Fluxo: resolve a organização Keystone pelo slug → abre `automation_runs`
(`running`) → busca `market_intelligence_sources` ativas (zero fontes fecha
a execução como `succeeded` com `items_processed: 0`, sem chamar o
gateway) → busca `content_pillars` ativos → busca e limpa o HTML de cada
fonte em paralelo (`Promise.allSettled`, timeout de 15s, truncamento em
6000 caracteres por fonte) → se todas as fontes falharem, fecha a execução
`failed` e devolve 502 → chama `invoke()` do `ai-gateway` com
`market_intelligence.analyze` → grava cada insight retornado em
`ai_insights` (falha por linha é registrada, não interrompe as demais) →
fecha a execução `succeeded` com as contagens.

`supabase/functions/market-intelligence/sourceContent.ts` — módulo puro de
limpeza de HTML (`extractPlainText`, `truncate`), 6 testes.

**Simplificação deliberada:** o padrão documentado (documento 04 §1) prevê
um `automation-dispatch` compartilhado que n8n chamaria antes/depois da
função de domínio para gerir o ciclo de vida de `automation_runs`. Esse
dispatcher é escopo da FASE 20, ainda não construído. Em vez de bloquear A1
nele, `market-intelligence` gerencia a própria linha de `automation_runs`
diretamente — registrado aqui e em `n8n/workflows/README.md` como
simplificação consciente, a ser refeita quando a FASE 20 entregar o
dispatcher para as ~15 automações.

## Agente A2 — `content-strategist` (Edge Function)

Disparado interativamente por um operador a partir do feed de insights —
diferente de A1, tem sessão de usuário real. Autentica via `authenticate()`
de `_shared/auth.ts` (JWT do chamador). Antes de gastar qualquer chamada de
IA, verifica o papel do chamador em `memberships` (`owner`/`admin`/
`operator`) e devolve `forbidden` cedo caso contrário.

Lê o insight e o pilar através do cliente RLS-escopado do chamador — um ID
de outra organização simplesmente não é encontrado, sem checagem manual
adicional. Chama `invoke()` do `ai-gateway` **sem** passar o cliente do
chamador como dependência: um `operator` não tem `INSERT` em
`ai_invocations` (política `admin_insert`), e passar o cliente do chamador
faria esse registro de custo falhar silenciosamente. O gateway cai então no
próprio `service_role` só para essa gravação de bookkeeping — a gravação de
domínio (`content_ideas`) continua pelo cliente do chamador, que impõe
`operator_insert` de verdade.

`supabase/functions/content-strategist/validate.ts` — `generateIdeaSchema`
(zod): `insight_id`, `pillar_id`, `intent`. 5 testes.

## Deploy

Ambas as funções deployadas no projeto remoto (`rplnjrqpzqznbxfascqs`),
status `ACTIVE`: `market-intelligence` (`verify_jwt: false`, secret de
automação) e `content-strategist` (`verify_jwt: true`, JWT de usuário).
Verificação ponta a ponta por HTTP direto não foi possível nesta sandbox —
o proxy de saída bloqueia HTTPS direto a `*.supabase.co`, mesma limitação
já registrada desde a FASE 2. A confiança vem de três fontes: deploy bem-
sucedido (falharia em erro de resolução de import), os testes unitários dos
módulos puros, e revisão de código.

## WF-015 (n8n) — `n8n/workflows/WF-015-market-intelligence.json`

Export versionado: nó Cron (`0 6 * * 1-5`), nó Code gerando um
correlation ID leve, nó HTTP Request chamando
`{{$env.SUPABASE_PROJECT_URL}}/functions/v1/market-intelligence` com
`x-automation-secret` via credencial nomeada (nenhum segredo em texto no
arquivo — o valor real vive no credential store do n8n), nó `noOp` como
placeholder de falha. `n8n/workflows/README.md` documenta a convenção de
export, a lacuna do `automation-dispatch` (acima) e os passos manuais antes
de ativar o cron de verdade (`ANTHROPIC_API_KEY`,
`AUTOMATION_WEBHOOK_SECRET`, pelo menos uma fonte ativa, import e teste
manual no n8n).

## Frontend: Intelligence (`/intelligence`)

`src/modules/intelligence/` — `IntelligencePage.tsx` reúne
`EditorialStrategySection` (pilares e regras de calendário, somente
leitura — o editor é a subtarefa 8, deliberadamente adiada; as políticas
`operator_insert`/`operator_update` já existem para quando ele for
construído) e `InsightsFeed` (lista `ai_insights` com badge de tipo,
relevância e potencial comercial — `null` aparece como "sem nota", nunca
como zero fabricado — e o botão que abre `GenerateIdeaDialog`, que chama
`content-strategist` e invalida o feed no sucesso).

Consolida o que o documento 01 descreve como duas telas (`/content/strategy`
+ `/intelligence`) numa só, porque `navigation.ts` — a fonte de verdade
atual — não tem uma entrada de navegação separada para "estratégia
editorial". Registrado como consolidação deliberada dado o estado atual da
navegação, revisitável se um dia a sidebar precisar separar as duas.

## Frontend: Calendar (`/calendar`)

`src/modules/calendar/` — quatro visualizações (`MonthView`, `WeekView`,
`DayView`, `ListView`) sobre `useCalendarItems()`, todas mostrando
`EmptyCalendarNotice` quando vazias. `content_calendar` é estruturalmente
vazia nesta fase — `content_calendar.asset_id` aponta para
`content_assets`, que só nasce na FASE 5 — então o estado vazio é hoje o
único estado possível, e é honesto, não um placeholder de tela inteira.
`MonthView`/`WeekView` constroem a grade de dias com `date-fns`
(`eachDayOfInterval`, `startOfWeek`/`endOfWeek`, `startOfMonth`/
`endOfMonth`), localizado em `ptBR`.

---

## Verificação

| | |
|---|---|
| Typecheck | limpo (`types.ts` regenerado contra o projeto remoto após as migrações desta fase) |
| Lint | 0 erros, 9 avisos (mesmos de sempre) |
| Testes | 123 passando (17 do `ai-gateway` + 6 de `sourceContent` + 5 de `content-strategist/validate`) |
| Build | ✓ |
| `get_advisors(security)` | zero lints, contra o projeto remoto, após cada migração |
| RLS | `ENABLE` + `FORCE` em toda tabela nova, confirmado por catálogo generalizado |
| `anon` × tabelas | zero políticas, confirmado por catálogo generalizado (não lista mais nome) |
| `anon` × funções | zero `EXECUTE`, confirmado por catálogo generalizado |
| `rpc_command_center`/`rpc_next_best_actions` | verificadas de novo após a correção — `permission denied`, não mais a exceção interna |
| pgTAP | 29 asserções, cada uma verificada manualmente contra o banco remoto |

---

## Pendente nesta fase

| Subtarefa | O que falta |
|---|---|
| 7 | WF-015 exportado e documentado, mas nenhuma instância n8n real está conectada a este projeto ainda — o import e o teste manual descritos em `n8n/workflows/README.md` são passo humano |
| 8 | Editor de regras de distribuição (hoje `EditorialStrategySection` é somente leitura; as políticas de escrita já existem) |
| 12 | Teste de rejeição de insight sem fonte — a proteção existe (`source_url not null` + `output_schema` exige `source`/`source_url`), mas não foi exercitada ponta a ponta porque A1 ainda não rodou com uma chave de IA real |

Subtarefas 5, 6, 9, 10 e 11 foram concluídas nesta sessão (agentes A1/A2,
feed de insights, ação de gerar ideia, calendário editorial).

**Ação humana antes de qualquer execução real:** `ANTHROPIC_API_KEY` precisa
ser configurada como Edge Function secret (`supabase secrets set`) antes que
A1 ou A2 produzam qualquer saída real — sem ela, o gateway devolve
`misconfigured` corretamente, não uma simulação. Nenhum provedor de IA foi
chamado de verdade nesta sessão.
