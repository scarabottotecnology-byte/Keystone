# 20 — Execução da FASE 5 (em andamento)

Registro do que já foi construído da FASE 5 — AI Content Factory + Review.
Segue os STEPs 11 e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** parcial, mesmo ritmo da FASE 4. A camada de dado — marca,
metodologia, base de conhecimento com pgvector, `content_assets`/
`content_reviews`, e os sete prompts globais de A3/A4 — está pronta e
verificada. Os agentes A3 (Content Factory) e A4 (Content Reviewer) como
Edge Functions, o pipeline de ingestão da base de conhecimento, o editor de
peça, a biblioteca de conteúdo e o WF-001 ainda não.

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

---

## Verificação

| | |
|---|---|
| Migrações | 3 aplicadas ao projeto remoto (`brand_and_knowledge_base`, `content_factory_and_review`, `content_factory_seed`), cada uma verificada antes da próxima |
| `get_advisors(security)` | zero lints, após cada migração |
| RLS | `ENABLE` + `FORCE` em toda tabela nova, confirmado por catálogo generalizado |
| `anon` × tabelas novas | zero políticas — testado por catálogo e por comportamento (`brand_profiles`, `knowledge_chunks`, `content_assets`) |
| `anon` × `app.match_knowledge` | `has_function_privilege('anon', ..., 'EXECUTE')` → `false`, sem revoke extra necessário — `app.*` não recebe o `pg_default_acl` automático que atinge `public.*` |
| `app.match_knowledge` isolamento cross-org | 4/4 asserções — verificado manualmente contra o banco remoto, dado de teste revertido |
| Seed | `brand_profiles` (1), `brand_services` (2), `content_pillars` com `methodology_id` (2), `ai_providers` `openai` (1), `ai_prompts` A3+A4 (7) — todos confirmados por contagem direta |
| Typecheck/lint/test/build | pendente nesta entrada — roda na conclusão desta camada, junto com a regeneração de `types.ts` |

---

## Pendente nesta fase

| Subtarefa | O que falta |
|---|---|
| 3 | Pipeline de ingestão (upload → Storage → extração de texto → chunking → embedding → indexação) — nenhuma Edge Function ainda |
| 6 | Agente A3 (Content Factory) como Edge Function — hoje só os seis prompts e o schema existem |
| 7 | Geração de variações (`variant_of`) — depende de A3 existir |
| 8 | Agente A4 (Content Reviewer) como Edge Function |
| 9 | Editor de peça no frontend |
| 10 | Biblioteca de conteúdo e fila de aprovação |
| 11 | WF-001 (n8n), cron 07:00 |
| 12 | Teste de respeito à marca e ao limiar — a regra existe no prompt de A4, mas não foi exercitada ponta a ponta porque A3/A4 ainda não rodam de verdade |

**Decisão de escopo pendente para a subtarefa 3:** extrair texto de PDF/
PPTX/DOCX em runtime Deno (Edge Function) exige uma biblioteca de parsing
binário ainda não avaliada neste projeto. Os dois caminhos que não dependem
disso — `url` (reaproveitando `extractPlainText`/`truncate` de
`market-intelligence/sourceContent.ts`) e `manual` (texto colado
diretamente) — são o que a próxima sessão implementa primeiro; PDF/PPTX/DOCX
ficam como `source_type` aceito no schema, mas a ingestão desses três
recusa com erro explícito até a biblioteca ser escolhida — nunca finge
sucesso com texto mal extraído.

**Ação humana antes de qualquer execução real:** além de `ANTHROPIC_API_KEY`
(já pendente da FASE 4), `OPENAI_API_KEY` precisa ser configurada como Edge
Function secret antes que a ingestão gere qualquer embedding real.
