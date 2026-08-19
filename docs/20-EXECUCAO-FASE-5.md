# 20 — Execução da FASE 5

Registro do que foi construído na FASE 5 — AI Content Factory + Review.
Segue os STEPs 11 e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** completa, no que este projeto pode entregar sem uma biblioteca
de parsing de PDF/PPTX/DOCX ainda avaliada (ver decisão de escopo no fim).
A camada de dado (marca, metodologia, base de conhecimento com pgvector,
`content_assets`/`content_reviews`, sete prompts globais), os agentes A3
(Content Factory) e A4 (Content Reviewer) como Edge Functions, o pipeline
de ingestão da base de conhecimento e as telas de ideias/biblioteca em
`/content` estão prontos, deployados e verificados. WF-001 (n8n) e a
geração de variações (`variant_of`) ficam para quando houver decisão de
produto sobre seleção automática — ver "Pendente" no fim.

---

## Migração `brand_and_knowledge_base`

`brand_profiles`/`brand_services` — administração de organização, não
trabalho operacional do dia a dia (a distinção que a FASE 4 estabeleceu com
`app.is_org_operator`): tom, público e a metodologia proprietária mudam
raramente e afetam toda geração de conteúdo, por isso usam
`app.is_org_admin` para escrita. `content_pillars`/`knowledge_documents`
continuam em `app.is_org_operator` — curadoria de conteúdo é trabalho do
dia a dia.

`create extension vector` — pgvector 0.8.2, já disponível no projeto, nunca
instalada até esta migração. `knowledge_documents`/`knowledge_chunks`
seguem `docs/02 §4.2` à risca: `vector(1536)`, índice HNSW por cosseno,
`organization_id` denormalizado em `knowledge_chunks` para a RLS filtrar sem
juntar com `knowledge_documents` a cada linha do índice.

**`knowledge_chunks` sem política de escrita para `authenticated`.** Só
`tenant_select`. Nenhum humano grava embedding à mão — só o pipeline de
ingestão, via `service_role`, que ignora RLS como sempre. Mesmo desenho de
`ai_invocations`/`automation_logs` na FASE 4.

## Achado real: `app.match_knowledge` vazaria conhecimento entre organizações

A assinatura documentada em `docs/03-APIS-E-INTEGRACOES.md`
(`app.match_knowledge(p_query_embedding, p_limit)`) confia inteiramente na
RLS de `knowledge_chunks` para o isolamento — via `SECURITY INVOKER`. Isso
protege um chamador `authenticated` de verdade, mas A1 e A3 chamam a base de
conhecimento como `service_role`, sem sessão de usuário (mesmo padrão de A1
na FASE 4) — e `service_role` tem `BYPASSRLS`: a política `tenant_select`
simplesmente não se aplica a ele. Uma função só com `p_query_embedding`/
`p_limit`, chamada por A3 via `service_role`, devolveria o chunk mais
similar de **qualquer** organização — a base de conhecimento de um cliente
vazando para o conteúdo gerado de outro. Categoricamente pior que o achado
da view `ai_usage_daily` na FASE 4 (aquele vazava custo interno; este
vazaria propriedade intelectual de consultoria para o texto publicado de
outra organização).

**Corrigido** adicionando `p_organization_id` obrigatório, filtrado
explicitamente no `where` da função — o mesmo princípio já registrado em
`market-intelligence`/`content-strategist`: escopo por organização é
aplicado explicitamente em código sempre que quem chama pode ser
`service_role`, nunca só implicitamente por RLS. `SECURITY INVOKER`
permanece correto e foi mantido — para um chamador `authenticated` real, a
RLS segue como segunda camada de defesa.

**Prova dedicada**, fora de `rls_anon.sql` de propósito (não é `anon` versus
política, é `service_role` versus filtro em código — classe de teste
diferente): `supabase/tests/database/match_knowledge_isolation.sql`. Duas
organizações de teste, dois chunks com **embedding idêntico** (de propósito
— para que a diferença de distância vetorial não mascare uma falha de
isolamento), quatro asserções provando que cada organização só recebe o
próprio chunk. Verificado manualmente contra o banco remoto (dentro de
`begin`/`rollback`, sem deixar dado de teste para trás) antes de commitar.

## Migração `content_factory_and_review`

`content_assets`/`content_reviews` conforme `docs/02 §4.3`, mais as duas FKs
que a FASE 4 adiou (`content_pillars.methodology_id → brand_services`,
`content_calendar.asset_id → content_assets`) — ambas as colunas tinham zero
linhas preenchidas até aqui, nenhum dado para validar contra a nova
constraint.

**`content_reviews` é imutável por desenho** — mesmo raciocínio de
`audit_log`: corrigir uma nota é gerar uma revisão nova, não editar a
antiga. Só `SELECT` e `INSERT`, sem política de `UPDATE`/`DELETE`.

## Achado real: `grounded_on` ausente de `content_assets` no documento 02

A definição de `content_assets` em `docs/02-MODELO-DE-DADOS.md §4.3` tinha
`ai_generated` e `model`, mas não `grounded_on jsonb` — apesar de P7 (`docs/02
§1`) exigir os três em toda tabela que guarda o que a IA gerou, do critério
de aceite da própria FASE 5 ser explícito ("RAG consultado; afirmação sobre
serviço com `grounded_on`", docs/09) e de A3 existir justamente para
consultar `app.match_knowledge` e preencher este campo (docs/05 §3: "chunks
usados ficam registrados em `grounded_on` do registro gerado"). Sem a
coluna, a regra de fundamentação do RAG não teria onde gravar a prova.
Corrigido na migração e no documento — `content_assets.grounded_on jsonb not
null default '[]'`.

## Seed: marca, metodologia, provedor de embeddings, sete prompts

**Marca real da Keystone** — posicionamento, tom, público, diferenciais,
palavras proibidas e preferidas — escrita com o que os documentos deste
projeto realmente afirmam sobre a consultoria (consultoria de controladoria
e FP&A B2B, direta e técnica, implementação não só diagnóstico).

**ORBITA e RICE, sem inventar a metodologia.** O conteúdo completo dos dois
métodos proprietários não está descrito em nenhum documento deste
repositório — só o propósito de cada um ("budget e acompanhamento", docs/02
§4.2; "custos", docs/12 subtarefa 5). `brand_services.methodology` fica
`null` de propósito: escrever a metodologia de fato seria fabricar
propriedade intelectual que não existe neste projeto — exatamente o tipo de
alucinação que A1–A9 são desenhados para nunca cometer. `description` e
`target_pain` usam só o que os documentos afirmam; um admin preenche
`methodology` via Settings quando a tela existir. Os dois pilares mais
próximos (`budget`, `custos`) foram ligados a `orbita`/`rice` via
`methodology_id` — os outros 11 pilares seguem sem vínculo, porque forçar um
vínculo falso seria pior que deixar nulo.

**Provedor `openai`, para embeddings.** `vector(1536)` é a dimensão do
`text-embedding-3-small` — não existe endpoint de embeddings na Anthropic
Messages API, então a base de conhecimento precisa de um segundo provedor
configurado desde já. Mesmo racional do provedor `anthropic` da FASE 4:
`config` sem preço, para que `estimateCostUsd` continue devolvendo `null` em
vez de um custo inventado; a chave real (`OPENAI_API_KEY`) será um Edge
Function secret quando o pipeline de ingestão for construído, nunca uma
coluna de banco.

**Sete prompts globais** (`organization_id null`, mesmo desenho da FASE 4):
seis etapas de A3 (`content_factory.angle`, `.hook`, `.structure`, `.copy`,
`.cta`, `.visual_brief` — o pipeline separado e versionado que docs/05 §4
descreve) e um de A4 (`content_reviewer.evaluate`). A etapa `structure`
carrega a regra de fundamentação do RAG explicitamente no `system_prompt`
("se o contexto vier vazio... a seção não faz essa afirmação"); `evaluate`
reprova a peça independentemente da média se usar palavra proibida ou
afirmar sobre serviço sem `grounded_on`. `model_hint` de A4
(`claude-opus-5`) é deliberadamente distinto dos seis prompts de A3
(`claude-sonnet-5`) — "revisor usa modelo diferente do gerador" (docs/05 §4)
verificável comparando a coluna, não só arquiteturalmente esperado.

As dimensões do Content Score usam chave `jsonb` em ASCII/snake_case
(`aderencia_icp`, não "aderência ao ICP") — corrigido também em
`docs/02-MODELO-DE-DADOS.md`, que só tinha o rótulo acentuado, ambíguo como
chave de dado.

## pgTAP

`rls_anon.sql` estendido de 29 para 35 asserções — um representante
testado por comportamento por migração desta fase (`brand_profiles`,
`knowledge_chunks`, `content_assets`), mesma convenção da FASE 4. As duas
provas de catálogo (zero política para `anon`; `FORCE ROW LEVEL SECURITY`
em toda tabela) continuam gerais e cobrem o resto sem listar nome.

`match_knowledge_isolation.sql`, arquivo novo: as quatro asserções do
achado de `app.match_knowledge`, descrito acima.

## Achado real: `app.match_knowledge` inalcançável pelo cliente supabase-js

Ao começar `content-factory`, ficou claro que `caller.db.rpc(...)` (a mesma
API que `rpc_command_center`/`rpc_next_best_actions` já usam) só alcança
funções do schema `public` — é assim que PostgREST expõe RPC por padrão, e
este projeto não declara nenhum `db.schema` alternativo
(`supabase/config.toml` não tem a chave). `app.match_knowledge` vive em
`app`, pensado até aqui só para uso interno de RLS/trigger — inalcançável
de fora.

**Corrigido** com o mesmo padrão já usado para as duas RPCs do Command
Center (`command_center_growth_score.sql`): um wrapper fino em
`public.match_knowledge`, `SECURITY INVOKER`, que só repassa para
`app.match_knowledge` — nenhuma lógica de segurança duplicada, só exposto.
Migração `public_match_knowledge_wrapper.sql`.

**Achado dentro do achado:** o primeiro `get_advisors(security)` depois de
criar o wrapper voltou com `function_search_path_mutable` — o wrapper não
fixava `search_path`, ao contrário de toda outra função deste projeto.
Corrigido na migração seguinte (`match_knowledge_wrapper_search_path.sql`)
antes de seguir. `anon` confirmado sem `EXECUTE` (`has_function_privilege`
→ `false`) e uma chamada funcional real contra o banco remoto validaram o
wrapper antes de ser usado por `content-factory`.

## Achado real: `content_formats` estava vazia

A FASE 4 criou a tabela mas nunca semeou nenhuma linha — não havia
consumidor até A3 precisar de um `format_id` para saber canal e limites da
peça (docs/05 §4: "ideia, formato, marca, RAG" são a entrada de A3). Sem
isso, não haveria o que escolher no payload de `content-factory`. Corrigido
com três formatos de partida (`text_post`/`carousel` no LinkedIn,
`single_image` no Instagram) — migração `content_formats_seed.sql`, mesmo
racional de "ponto de partida razoável, não regra do master prompt" da
seed de `content_calendar_rules` na FASE 4.

## `_shared/ai-gateway/embeddings.ts` — módulo novo, separado de `invoke()`

`invoke()` é moldado para chat completions com `output_schema` estruturado
por tool forçada — não existe endpoint de embeddings na Anthropic Messages
API, e a forma da chamada (texto → vetor, sem prompt de sistema, sem
schema) é fundamentalmente diferente. `embed()` chama a OpenAI diretamente,
com a mesma disciplina de custo do resto do gateway: grava em
`ai_invocations` (`provider: 'openai'`), e `costUsd` é `null` — nunca um
zero fabricado — quando `ai_providers.config.pricing` não tem o modelo.
Usado por `knowledge-ingest` (embedding de cada chunk) e por
`content-factory` (embedding da consulta antes de `match_knowledge`).

`sourceContent.ts` (limpeza de HTML) migrou de `market-intelligence/` para
`_shared/` — `knowledge-ingest` precisa exatamente da mesma limpeza para o
caminho `url`, e duplicar o módulo manteria duas cópias do mesmo
comportamento. `market-intelligence/index.ts` só teve o import ajustado.

## Edge Function `knowledge-ingest`

Interativa (JWT de operador), mesmo padrão de auth de `content-strategist`.
`source_type` aceita os cinco valores reais da coluna
(`manual`/`url`/`pdf`/`pptx`/`docx`, docs/02 §4.2), mas o handler recusa
`pdf`/`pptx`/`docx` com `bad_request` explícito — decisão de escopo
detalhada no fim deste documento.

Fluxo: verifica papel (`owner`/`admin`/`operator`) → extrai texto
(`manual`: já vem pronto; `url`: busca + `extractPlainText`) → recusa
conteúdo vazio ou maior que 200.000 caracteres (nunca trunca em silêncio —
truncar apagaria parte real do documento, diferente do truncamento
deliberado de A1 sobre um único prompt) → calcula checksum SHA-256 e grava
`knowledge_documents` (`status: 'processing'`) pelo `caller.db`, contando
com a constraint `unique(organization_id, checksum)` para detectar
reenvio do mesmo conteúdo e devolver `conflict`, não indexar de novo →
`chunk.ts` fatia o texto (~800 tokens/~120 de sobreposição, fronteira de
frase quando possível) → cada chunk vira um `embed()` e é gravado em
`knowledge_chunks` por um cliente `service_role` próprio da função —
`knowledge_documents` usa `caller.db` (política `operator_insert`/
`operator_update` de verdade), mas `knowledge_chunks` não tem política de
escrita para `authenticated` por desenho, então só `service_role` grava.
Falha de embedding num chunk não derruba os demais; documento fica
`failed` só se **nenhum** chunk foi indexado.

`chunk.ts` é módulo puro — 8 testes, incluindo cobertura total do texto
entre chunks e ausência de laço infinito quando a sobreposição configurada
excede o próprio chunk.

## Edge Function `content-factory` (Agentes A3 + A4)

Interativa (JWT de operador), disparada por "gerar peça a partir desta
ideia" — mesmo padrão de A2. Recebe `idea_id` + `format_id`, carrega
ideia/formato/pilar/marca pelo `caller.db`, e executa o pipeline de seis
etapas de A3 em sequência via `invoke()` (ângulo → hook → RAG → estrutura
→ copy → CTA → briefing visual), sem passar `caller.db` para `invoke()`/
`embed()` — mesmo racional já registrado em `content-strategist`: um
`operator` não tem `INSERT` em `ai_invocations`, e usar o cliente do
chamador ali descartaria o registro de custo em silêncio.

**RAG com degradação, não aborto.** A consulta vetorial (`embed()` +
`match_knowledge` via `caller.db.rpc`) roda entre as etapas hook e
estrutura. Se o embedding falhar (ex.: `OPENAI_API_KEY` ausente), o
pipeline segue com contexto vazio em vez de abortar a geração inteira —
"recuperação vazia" já é um estado válido e tratado pela regra de
fundamentação (docs/05 §3), então uma etapa auxiliar falhando não deveria
impedir a peça de existir.

**Falha em qualquer etapa de A3 aborta antes de gravar.** Nada é inserido
em `content_assets` até as seis etapas terminarem — uma peça pela metade
seria pior que nenhuma. As chamadas já feitas continuam registradas em
`ai_invocations` (custo real e visível) mesmo que o resultado final não
seja salvo.

**Por que A4 roda dentro da mesma função, não numa Edge Function
separada.** A3 e A4 continuam distintos onde importa — prompts,
`output_schema` e `model_hint` diferentes (`content_factory.*` em
`claude-sonnet-5`, `content_reviewer.evaluate` em `claude-opus-5`), com o
gateway escolhendo o modelo por prompt, não por função que chama. O padrão
documentado (docs/04 §1) prevê n8n orquestrando duas chamadas via um
`automation-dispatch` compartilhado — escopo da FASE 20, ainda não
construído (mesma lacuna já registrada para `market-intelligence` na FASE
4). Sem esse orquestrador, separar A3/A4 em duas funções só empurraria a
responsabilidade de encadear as duas chamadas para o frontend, sem ganho
real. Falha só de A4 (depois de A3 já ter gravado a peça) não desfaz a
peça — ela fica `status: 'review'` sem `content_reviews`, visível como
pendente de revisão, nunca escondida.

`ragContext.ts` (formatação do contexto de RAG e consolidação de
`grounded_on`) é módulo puro, separado do `index.ts` — 7 testes, incluindo
o caso de um `chunk_id` citado pelo modelo que não bate com nenhum chunk
recuperado (preservado com campos nulos, nunca descartado em silêncio).

## Deploy

Cinco Edge Functions ativas no projeto remoto: `invite-member`,
`market-intelligence`, `content-strategist` (FASES 2 e 4) e agora
`content-factory` e `knowledge-ingest` (`verify_jwt: true` nas duas —
ambas interativas). Confirmado por `list_edge_functions`. Mesma limitação
de sempre: verificação ponta a ponta por HTTP direto não foi possível
nesta sandbox (proxy de saída bloqueia HTTPS a `*.supabase.co`); a
confiança vem do deploy bem-sucedido, dos testes unitários dos módulos
puros e da revisão de código.

## Frontend: `/content`

`src/modules/content/` — `ContentPage.tsx` reúne `ContentIdeasSection`
(lista `content_ideas`, cada uma com o botão "Gerar peça" que abre
`GeneratePieceDialog` — escolhe o formato e chama `content-factory`) e
`ContentLibrary` (lista `content_assets` com a revisão mais recente de
`content_reviews` embutida, canal, status, hashtags, contagem de
`grounded_on`, e um botão "Aprovar").

**Aprovação bloqueada por score, não só avisada.** Score abaixo de 70
(padrão citado em docs/05 §4, ainda sem tela de configuração — mesmo
racional de `slot_time`/`channel` fixos na seed da FASE 4) desabilita o
botão e mostra a sugestão de A4 em vez dele; sem revisão nenhuma (A4
falhou), o botão também fica desabilitado — nunca aprova o que não foi
avaliado. Aprovar grava `approved_by`/`approved_at` pelo `caller.db` do
próprio operador, sujeito a `operator_update`.

`Content` virou `active` em `navigation.ts` (fase 5) — mesmo padrão de
Intelligence/Calendar na FASE 4: o módulo ativo declara na própria
descrição o que ainda falta (editor de peça campo a campo, fila de
aprovação com filtro), nunca esconde atrás de um placeholder de tela
inteira.

---

## Verificação

| | |
|---|---|
| Migrações | 6 aplicadas ao projeto remoto (`brand_and_knowledge_base`, `content_factory_and_review`, `content_factory_seed`, `public_match_knowledge_wrapper`, `match_knowledge_wrapper_search_path`, `content_formats_seed`), cada uma verificada antes da próxima |
| `get_advisors(security)` | zero lints — inclusive depois de corrigir o `search_path` do wrapper |
| RLS | `ENABLE` + `FORCE` em toda tabela nova, confirmado por catálogo generalizado |
| `anon` × tabelas novas | zero políticas — testado por catálogo e por comportamento (`brand_profiles`, `knowledge_chunks`, `content_assets`) |
| `anon` × `match_knowledge` | `has_function_privilege('anon', ..., 'EXECUTE')` → `false` para `app.match_knowledge` (schema sem grant automático) e para `public.match_knowledge` (revoke explícito, achado do wrapper) |
| `app.match_knowledge` isolamento cross-org | 4/4 asserções — verificado manualmente contra o banco remoto, dado de teste revertido |
| Seed | `brand_profiles` (1), `brand_services` (2), `content_pillars` com `methodology_id` (2), `ai_providers` `openai` (1), `ai_prompts` A3+A4 (7), `content_formats` (3) — todos confirmados por contagem direta |
| Edge Functions | `content-factory` e `knowledge-ingest` deployadas, `status: ACTIVE`, confirmado por `list_edge_functions` |
| Typecheck/lint/test/build | limpos — 148 testes (25 novos: `chunk` 8, `knowledge-ingest/validate` 7, `content-factory/validate` 3, `content-factory/ragContext` 7); `types.ts` regenerado duas vezes (schema, depois `match_knowledge`) |

---

## Pendente nesta fase

| Subtarefa | O que falta |
|---|---|
| 7 | Geração de variações (`variant_of`) — o pipeline gera uma peça por vez; um botão "gerar variação" reusando a mesma ideia/formato é extensão direta quando houver demanda de comparação de performance (FASE 9) |
| 9 | Editor de peça campo a campo — a biblioteca hoje mostra e permite aprovar, mas editar manualmente headline/hook/body/cta ainda não tem tela |
| 10 | Fila de aprovação com filtro (por status, canal, score) — a biblioteca lista tudo, sem filtro ainda |
| 11 | WF-001 (n8n) — não construído nesta sessão; ver decisão abaixo |
| 12 | Teste de respeito à marca e ao limiar ponta a ponta com IA real — a regra existe nos prompts e o bloqueio de aprovação por score é real no frontend, mas não foi exercitado com uma chamada de IA de verdade (sem `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` configuradas nesta sessão) |
| — | Upload de documento na base de conhecimento não tem tela — `knowledge-ingest` está real e deployada, mas só chamável hoje via `supabase.functions.invoke` direto, sem formulário |

**Decisão de escopo: WF-001 adiado.** Diferente de A1/A2 na FASE 4, A3
(`content-factory`) foi construído como **interativo** (JWT de operador),
não automação — decisão deliberada: "Daily Content Generation" (cron
07:00) implica selecionar automaticamente quais ideias geram peça a cada
manhã, uma decisão de produto (que critério? quantas por dia?) que este
projeto ainda não tomou. Construir o cron sem essa decisão significaria
inventar um critério de seleção que ninguém pediu. O botão "Gerar peça" no
frontend é o caminho real e testável entregue agora; WF-001 fica para
quando a seleção automática for de fato especificada.

**Decisão de escopo definitiva para a subtarefa 3: PDF/PPTX/DOCX
continuam fora.** Extrair texto desses formatos em runtime Deno exige uma
biblioteca de parsing binário que este projeto não avaliou e que estava
fora do orçamento razoável desta sessão. Os dois caminhos que não
dependem disso — `url` (reaproveitando `extractPlainText`/`truncate`,
agora em `_shared/sourceContent.ts`) e `manual` (texto colado diretamente)
— estão implementados e reais. `pdf`/`pptx`/`docx` continuam no
vocabulário aceito pelo schema (é o valor real da coluna, docs/02 §4.2),
mas `knowledge-ingest` recusa os três com `bad_request` explícito — nunca
finge sucesso com texto mal extraído. Revisitar quando uma biblioteca for
avaliada e escolhida.

**Ação humana antes de qualquer execução real:** `ANTHROPIC_API_KEY` (A1,
A2, A3, A4) e `OPENAI_API_KEY` (embeddings de `knowledge-ingest` e do RAG
de A3) precisam ser configuradas como Edge Function secrets — nenhuma foi
configurada nesta sessão. Sem elas, os agentes devolvem `misconfigured`
corretamente, nunca uma simulação.
