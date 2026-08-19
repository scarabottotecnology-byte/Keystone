# 21 — Execução da FASE 6 (LinkedIn)

Registro do que foi construído na FASE 6 — publicação em rede social. Segue
os STEPs 11 e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** construída e verificada; **não deployada**. Schema, lock,
OAuth, worker de publicação, WF-002, tela `/social` e a suíte pgTAP estão
prontos, com todos os portões locais verdes. As três Edge Functions novas
(`oauth-start`, `oauth-callback`, `social-publish`) ainda não foram
enviadas ao projeto remoto — ver "Pendente" no fim.

---

## Antes da fase: quatro defeitos que o CI nunca pegou

O job `functions` do CI (`deno fmt`/`lint`/`check`) **nunca executou**: ele
dispara em `pull_request` ou push para `main`, e todo o trabalho das FASES
1–5 aconteceu em branch, sem PR. A consulta à API do GitHub devolveu 404
para o workflow — nenhuma execução, nunca.

Deno foi instalado nesta sessão e os três portões rodaram pela primeira
vez, revelando:

1. **`no-unused-vars`** — `truncate` importado sem uso em
   `knowledge-ingest` (FASE 5) e `match` sem uso em `template.ts`
   (FASE 4). Os dois reprovariam `deno lint`.
2. **`deno fmt --check`** — 21 de 43 arquivos fora do formato. Nenhum
   arquivo de Edge Function jamais passara pelo formatador.
3. **`deno check`** — `import Ajv from "ajv"` não é construtível sob a
   interop npm do Deno. **Correção de um exagero meu:** ao encontrar,
   afirmei que isso quebraria toda chamada de IA em runtime. Testei em
   runtime antes de consertar e não quebrava — as duas formas constroem e
   validam igual; o efeito era de tipo e de CI, nunca um erro em produção.
   O conserto teve uma volta: o export nomeado que o Deno aceita quebra o
   vitest, onde só o default funciona. Resolvido resolvendo o construtor em
   runtime a partir da forma que cada runtime entrega, com erro explícito
   se nenhuma existir.
4. **`deno.lock`** sem `ajv` e `zod`, adicionados ao `deno.json` na FASE 4
   e nunca registrados no lockfile.

**Lição registrada:** "a fase está testada" valeu para o frontend (cujo job
roda no vitest local) e não valeu para as Edge Functions. Um portão que
nunca executa não é um portão.

## Migração `publishing_and_oauth`

`social_accounts`, `social_posts`, `social_post_metrics`, `publishing_jobs`
e os enums `publish_status`/`account_status`, conforme `docs/02 §4.4`.

**Schema `private` para tokens.** `private.oauth_tokens` fora do PostgREST:
não há caminho pelo qual um cliente alcance a tabela, mesmo com JWT válido
e mesmo se uma política for escrita errado (`docs/07 §3`).
`social_accounts` — legível pelo frontend — guarda só `token_ref`.

**`social_posts` sem política de escrita para `authenticated`.** Só
`social-publish` (service_role) grava. Um humano inventando uma linha de
publicação corromperia a cadeia de atribuição que a FASE 8 vai medir.

## Achado real: o schema `private` estava fechado também para quem devia entrar

`docs/07 §3` especifica o schema assim:

```sql
create schema private;
revoke all on schema private from anon, authenticated;
```

...e para por aí, sem dizer quem *pode* alcançar a tabela. Um
`create schema` não concede `USAGE` a mais ninguém além do dono, e
`service_role` não é o dono — então o caminho legítimo descrito no próprio
documento ("acesso apenas por Edge Function com service_role") ficou
fechado junto com o ilegítimo:

```
set local role service_role;
insert into private.oauth_tokens (...);
-- ERROR: 42501: permission denied for schema private
```

`oauth-callback` falharia na primeira gravação de token, em runtime, com um
erro que nenhum teste de schema pegaria. Pego ao verificar a migração
contra o banco remoto antes de qualquer deploy. Corrigido em
`private_schema_service_role_grants.sql`: `USAGE` no schema e privilégio de
tabela **apenas** para `service_role`, mais `alter default privileges` para
que a próxima tabela em `private` não repita o achado. Reverificado:
`anon` e `authenticated` seguem sem `USAGE`; `service_role` grava e lê.

## `claim_publishing_job` — o lock pessimista

Duas diferenças deliberadas em relação ao esboço do documento 02
(`update … where id = … and status = 'pending' returning *`):

1. **Reivindica "o próximo job vencido", não um `id`.** A subtarefa 9
   descreve o WF-002 perguntando "há job vencido e não travado?" a cada 15
   minutos — o worker não conhece um `id` de antemão.
2. **`for update skip locked` no subselect.** A versão só com
   `and status = 'pending'` funciona, mas as duas transações concorrentes
   disputam a mesma linha e uma bloqueia até a outra terminar. Com
   `skip locked`, a segunda pula para o próximo job disponível — mesma
   exclusão, sem serializar a fila.

Reivindica também os `failed` que ainda têm tentativa disponível: é o que
torna a recuperação de falha automática.

Criada em `public`, não em `app` — aplicando direto o achado da FASE 5 (o
PostgREST só expõe `public`, e `app.match_knowledge` tinha nascido
inalcançável por `supabase-js.rpc`). Sem `grant` para `authenticated`:
reivindicar job é trabalho de worker, não de usuário logado.

## As três camadas contra publicação duplicada

Publicar duas vezes na página de uma consultoria é dano de marca, então
nenhuma camada é considerada suficiente sozinha:

| # | Camada | Onde |
|---|---|---|
| 1 | Lock pessimista com `skip locked` | `claim_publishing_job()` |
| 2 | Chave determinística gravada **antes** da chamada externa | `social-publish`, via `deriveIdempotencyKey` |
| 3 | `unique (organization_id, idempotency_key)` | `social_posts` |

A ordem da camada 2 é o ponto: gravar depois não protegeria contra o caso
que mais dói — o processo morrer entre a chamada e o registro, deixando o
post publicado e o banco achando que não.

## Timeout: a distinção que evita o pior erro

`upstream_error` significa "não publicou". `timeout` significa "não sei".
Republicar cegamente no segundo caso é exatamente o que a subtarefa 7
proíbe. O tratamento tem três saídas, todas explícitas:

- **Encontrou o post na plataforma** → registra como sucesso, com
  `last_error` dizendo que houve timeout mas a publicação foi confirmada.
- **Verificou e não encontrou** → volta para `pending`; republicar é seguro.
- **Não conseguiu nem verificar** → `failed` com `attempt` no teto, para o
  cron não pegar de novo sozinho, e mensagem mandando conferir a página
  antes de reenfileirar. Revisão humana em vez de risco de duplicar.

## OAuth: `state` assinado, uso único e uma ressalva honesta sobre PKCE

O callback chega sem sessão — vem do LinkedIn, não do navegador
autenticado. Quem prova legitimidade é o `state` assinado por HMAC: só
`oauth-start` conhece o segredo. Assinatura sozinha não bastaria contra
reapresentação, então o nonce é consumido no banco de forma condicional
(`is null` no filtro faz o próprio Postgres decidir quem chegou primeiro).

**Sobre o PKCE.** A subtarefa 3 pede PKCE, e ele está implementado por
inteiro (`code_challenge` S256 na autorização, `code_verifier` na troca,
guardado em `private.oauth_states` — nunca na URL, o que anularia o
mecanismo). A ressalva, registrada também no código: a documentação do
LinkedIn não declara suporte a PKCE no fluxo de authorization code, e o
parâmetro pode ser ignorado do outro lado. Enviá-lo não custa e passa a
valer sozinho se o provedor suportar — mas a proteção que de fato sustenta
este fluxo hoje é o `state` assinado somado ao `client_secret`. Está escrito
assim para que ninguém leia "PKCE" e conclua uma garantia que o provedor
talvez não esteja dando.

## API do LinkedIn, consultada no momento da implementação

A subtarefa 4 manda consultar a documentação oficial em vez de confiar em
caminho fixado na arquitetura. `learn.microsoft.com` está bloqueado pelo
proxy desta sandbox; a consulta foi feita por busca, confirmando:

- `POST https://api.linkedin.com/rest/posts`
- `LinkedIn-Version: YYYYMM` e `X-Restli-Protocol-Version: 2.0.0`
- Autor de página: `urn:li:organization:{id}`, escopo `w_organization_social`
- Sucesso: `201` **sem corpo**, com o URN no cabeçalho `x-restli-id`

`LINKEDIN_API_VERSION` é variável de ambiente justamente porque o valor
caduca — fixá-lo no código faria a integração quebrar num dia arbitrário.

## WF-002 — a cada 15 minutos, não uma vez por dia

O horário fino de cada publicação vive em `content_calendar`; o workflow só
pergunta se há job vencido. É isso que torna a recuperação automática: um
job que falhou às 09:00 é retentado às 09:15, sem ninguém reenfileirar.

O nó HTTP tem nota explícita de que um timeout do n8n **não** deve virar
retentativa do workflow — a função já trata timeout por dentro, e repetir a
chamada por cima reintroduziria o risco que ela existe para evitar.

## Tela `/social`

Contas conectadas com a saúde do token (`connected`/`expiring`/`expired`),
fila de publicação com tentativa e erro legível, e histórico com o link
direto para o post. O token nunca chega ao navegador; `token_ref` fica
deliberadamente fora do `select`.

O resultado do OAuth chega como query string (`?social=ok|erro`) porque o
callback vem do LinkedIn por redirect, não por XHR — não há como devolver
um toast de lá. A tela traduz e limpa a query para o toast não repetir.

---

## Verificação

| | |
|---|---|
| Migrações | 4 aplicadas ao remoto (`publishing_and_oauth`, `private_schema_service_role_grants`, `oauth_states`, e as da FASE 5), cada uma verificada antes da próxima |
| `get_advisors(security)` | dois lints INFO `rls_enabled_no_policy` em `private.oauth_tokens`/`oauth_states` — **intencionais**, ver nota abaixo |
| `private` × roles | `anon` e `authenticated` sem `USAGE`; `service_role` grava e lê — os três verificados por consulta direta |
| Lock (A vence, B não) | verificado contra o banco real: `a_ganhou=1, b_ganhou=0`, job `locked` por `worker-A`, `attempt=1` |
| Job futuro / esgotado | nenhum dos dois é reivindicado — verificado |
| Idempotência | `23505` na segunda inserção da mesma chave — verificado |
| pgTAP | 9 asserções novas em `publishing_lock.sql`, cada uma verificada manualmente contra o remoto |
| `deno fmt` / `lint` / `check` | os três limpos, pela primeira vez na história do repositório |
| Frontend | typecheck limpo, lint 0 erros, 166 testes (18 novos), build ok |

**Sobre os dois lints INFO.** O advisor sinaliza "RLS habilitada sem
política" nas duas tabelas de `private`. É exatamente o desenho pretendido:
sem política, nada alcança a tabela exceto quem tem `BYPASSRLS`
(`service_role`). "Corrigir" adicionando uma política enfraqueceria a
proteção. Registrado aqui como divergência deliberada do "zero lints" das
fases anteriores, em vez de aceito em silêncio ou consertado errado.

---

## Pendente nesta fase

| Subtarefa | O que falta |
|---|---|
| — | **Deploy das três Edge Functions novas.** Escritas, formatadas, checadas e commitadas, mas ainda não enviadas ao projeto remoto. |
| 4 | Publicação com mídia (imagem/carrossel). Só post de texto está implementado; `content_assets.media` existe e o briefing visual é gerado, mas o upload de imagem ao LinkedIn é um fluxo próprio, de duas etapas, não coberto aqui. |
| 8 | **Renovação** de token. A expiração é detectada e a conta é pausada (`expiring`/`expired`), mas a renovação antecipada via `refresh_token` não está implementada — o `refresh_token` é guardado, e o caminho de renovação fica para quando houver uma conta real para exercitar. |
| 11 | O teste de concorrência prova a transição de estado numa conexão; o paralelismo real de duas conexões simultâneas (que é o que o `skip locked` existe para resolver) não é exercitado pelo pgTAP, que roda numa conexão só. |
| — | Escolha de página quando a conta administra várias: o callback conecta a primeira. Adivinhar qual o usuário queria seria pior que a limitação declarada. |

**Ação humana antes de qualquer publicação real:** além de
`ANTHROPIC_API_KEY` e `OPENAI_API_KEY` (pendentes das fases 4 e 5), a FASE 6
precisa de `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`,
`LINKEDIN_REDIRECT_URI`, `LINKEDIN_API_VERSION`, `OAUTH_STATE_SECRET`,
`APP_URL` e `AUTOMATION_WEBHOOK_SECRET` como Edge Function secrets — e da
aprovação do **Community Management API** do LinkedIn para o app. Sem ela,
nenhuma publicação sai, e o documento 12 prevê explicitamente o modo
assistido como degradação declarada: hoje a tela mostra a fila e o erro
real da plataforma, nunca um sucesso simulado.
