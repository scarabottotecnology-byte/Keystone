# 17 — Execução da FASE 2 (em andamento)

Registro do que já foi construído da FASE 2 — Banco, autenticação e RLS.
Segue os STEPs 11 e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** quase completa. Identidade, RLS, a suíte de regressão, autenticação
de frontend, convite de membro e a regra contra dado mascarado estão
entregues. Só resta a subtarefa 6 (RPCs de agregação), que depende de haver
uma tabela de negócio para agregar — ou seja, depende da FASE 3.

---

## Concluído

### Migração `20260815030751_platform_identity.sql` (subtarefas 1–4)

Aplicada no projeto remoto `rplnjrqpzqznbxfascqs` via `apply_migration`. Cria,
nesta ordem, cada tabela imediatamente seguida da própria RLS — nunca existe
uma janela em que a tabela está de pé sem política, conforme a regra do
documento 07 §2.

| Tabela | Papel |
|---|---|
| `organizations` | a organização — hoje uma linha só, `keystone` |
| `profiles` | espelho de `auth.users`, sem duplicar e-mail ou senha |
| `memberships` | vínculo usuário↔organização, com `role` e `status` |
| `audit_log` | trilha de auditoria, append-only |
| `idempotency_keys` | armazenamento para `_shared/idempotency.ts` (FASE 1) |

Todas as cinco: `enable row level security` **e** `force row level security`.
O `force` é o que faz a política valer até para o dono da tabela — sem ele,
uma função `SECURITY DEFINER` mal escrita ainda furaria o isolamento.

#### As duas funções de RLS (`app.current_org_ids`, `app.is_org_admin`)

Ambas `SECURITY DEFINER` + `STABLE` + `set search_path = public, app`, pelas
três razões de sempre:

- **`SECURITY DEFINER`** porque a política de `memberships` precisa consultar
  `memberships` — sem isso é recursão infinita, o erro clássico de RLS no
  Postgres.
- **`STABLE`** porque o planejador avalia a função uma vez por *statement*, não
  por linha. Numa varredura de 100 mil linhas é a diferença entre uma consulta
  e cem mil.
- **`set search_path`** porque uma função `SECURITY DEFINER` sem isso é
  vulnerável a sequestro de search_path — um objeto malicioso num schema
  anterior seria executado com o privilégio elevado da função.

Vivem em `app`, schema nunca exposto via PostgREST — `revoke all ... from
anon, authenticated` seguido de `grant usage` só para `authenticated`.

#### Políticas: o que falta de propósito, não por omissão

Nenhuma tabela tem as quatro operações liberadas. Cada ausência está
comentada na migração com a razão:

- **`organizations`**: sem `insert`/`delete` via cliente. Não há tela de criar
  ou apagar organização — ADR-014, ferramenta interna, uma organização só. A
  linha nasce só pelo `insert ... on conflict do nothing` desta migração.
- **`profiles`**: sem `insert`/`delete` via cliente. O ciclo de vida segue
  `auth.users` — criação via `app.handle_new_user()`, remoção via
  `on delete cascade`.
- **`audit_log`**: sem `update`/`delete`, de propósito — trilha de auditoria é
  *append-only*. A ausência da política é o que impede a alteração, não uma
  checagem que poderia ter esquecido.
- **`idempotency_keys`**: sem `delete` — liberar uma chave usada é `update`
  (ver `_shared/idempotency.ts`, FASE 1), nunca apagar a linha, que destruiria
  o histórico de que a operação já foi tentada.

#### Bootstrap: primeiro usuário vira `owner`

Sem tela de convite por e-mail nem onboarding (ADR-014), `app.handle_new_user()`
— trigger em `auth.users` — cria o `profiles` de todo cadastro e, só quando é
o *primeiro* vínculo da organização Keystone, insere a `membership` como
`owner`. Do segundo cadastro em diante, o usuário ganha perfil mas nenhum
vínculo — um `owner`/`admin` existente precisa inserir a `membership`, via a
política `admin_insert`.

### Regressão do achado C-01 (subtarefa 12 — `supabase/tests/database/rls_anon.sql`)

O achado original: políticas de RLS concedendo acesso ao papel `anon` com
`using (true)`. RLS habilitada dava aparência de proteção; a condição anulava
tudo. Esta suíte pgTAP prova a ausência da mesma classe de falha nas cinco
tabelas desta fase — 16 asserções, `select plan(16)` a `select * from
finish()`, dentro de uma transação que sempre faz `rollback`.

Por tabela: `anon` não enxerga nenhuma linha por `SELECT` e não consegue
`INSERT` (`throws_ok` com SQLSTATE `42501`). Em `organizations`, adicionalmente,
`UPDATE` e `DELETE` de `anon` **não lançam erro** — FORCE RLS não bloqueia a
tentativa, faz a condição não achar nenhuma linha para alterar — e a suíte
confirma isso lendo a linha de volta como `authenticated`/dono, depois de
`reset role`.

Duas provas finais consultam o catálogo diretamente, em vez de só observar
comportamento: `pg_policies` confirma que nenhuma política, nas cinco tabelas,
lista `anon` entre os `roles`; `pg_class.relforcerowsecurity` confirma que
`FORCE ROW LEVEL SECURITY` está ativo nas cinco. As duas provas se completam —
a primeira mostra que a tentativa falha, a segunda mostra *por que* falha:
porque a política não existe, não porque algo mais está bloqueando de forma
incidental.

**Um defeito apareceu ao escrever a própria suíte, não no banco.** A primeira
versão do bloco de `organizations` checava `display_name = 'Keystone'` logo
depois da tentativa de `UPDATE` de `anon`, ainda sob `role anon` — mas a
política `tenant_select` também bloqueia a leitura desse papel, então a
subconsulta devolvia `NULL`, e a asserção falhava com "have: NULL want:
Keystone". Não era o RLS que estava errado; era o teste que checava sob o
papel errado. Corrigido com `reset role` antes da leitura de confirmação, e
`set local role anon` de novo antes da tentativa de `DELETE` seguinte.
Reverificado linha a linha contra o banco remoto: as 16 asserções retornam
"ok".

### Verificação empírica antes de commitar

Toda asserção da suíte foi checada, uma a uma, contra o projeto remoto — via
`execute_sql` com `set local role anon` dentro de transação, não via PostgREST
(o proxy da sandbox bloqueia HTTPS direto ao domínio do Supabase). Depois:

- `get_advisors(type=security)` retornou **zero lints**.
- `list_migrations` confirma uma migração só, aplicada.
- O banco ficou limpo ao final: nenhum artefato de verificação (schema
  temporário do pgTAP local, papel extra) persiste no projeto remoto — só a
  migração e a linha `keystone` em `organizations`.

### CI: job `database` (subtarefa 11, continuação)

Terceiro job em `.github/workflows/ci.yml`, ao lado de `web` e `functions`:
sobe Postgres local via `supabase db start`, aplica as migrações do zero e
roda `supabase test db` (pgTAP via `pg_prove`).

**Ressalva registrada no próprio workflow:** cada asserção foi verificada à
mão contra o banco remoto antes de ser commitada, mas esta é a primeira vez
que o *job* roda — não havia Docker disponível nas sessões que o escreveram,
então a configuração do job em si (versão do CLI, ordem dos passos) está
verificada por leitura, não por execução. Deve ser observada na primeira
execução real em CI.

### Tipos TypeScript regenerados

`src/integrations/supabase/types.ts` — antes um placeholder de banco vazio,
agora reflete as cinco tabelas e os dois enums (`org_role`,
`membership_status`) desta migração. Gerado via `generate_typescript_types`
contra o projeto remoto, não escrito à mão.

---

## Autenticação de frontend (subtarefa 8)

`src/app/auth/`: `AuthProvider` (sessão via `onAuthStateChange`, que já
dispara uma vez com a sessão em cache ao inscrever — um listener só cobre
carga inicial e toda troca depois), `useMembership` (o vínculo ativo do
usuário logado — filtra por `user_id` explicitamente, porque a política
`tenant_select` de `memberships` mostra a organização inteira, não só a
própria linha), `ProtectedRoute` (fecha três portas: sem sessão redireciona
para `/entrar`; sem vínculo ativo mostra `PendingAccessScreen`; falha na
própria consulta usa o `QueryState` do resto do produto).

Três telas: `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`. Sem link
de "criar conta" — ADR-014, sem cadastro público, a conta nasce por convite.
`ForgotPasswordPage` não revela se o e-mail existe na base ("se houver uma
conta com esse e-mail…") — evita enumeração de usuário. `ResetPasswordPage`
não lê nem troca token: o cliente Supabase já detecta o link e cria a sessão
sozinho (`detectSessionInUrl`, ligado por padrão); a tela só espera isso
terminar e troca a senha na sessão resultante.

Logout entrou no header (`UserMenu`), ao lado do seletor de tema.

## Convite de membro e Equipe (subtarefa 9, escopo reduzido pelo ADR-014)

O subtarefa original do documento 12 pedia "criar organização, convidar
time, configurar marca inicial". ADR-014 já tinha eliminado a criação de
organização e o seletor — sobra só o convite, e nem esse por e-mail
transacional próprio: usa `auth.admin.inviteUserByEmail`, que a Supabase já
manda.

Edge Function `invite-member`, implantada no projeto remoto. `service_role`
entra só na única operação que de fato exige privilégio elevado — criar o
usuário de autenticação. A gravação que importa, a `membership`, usa o
cliente do próprio chamador (`caller.db`): quem decide se o convite pode
acontecer é a política `admin_insert`, não o código da função. Usar
`service_role` para os dois passos teria sido a mesma classe de falha do
achado C-01, só que numa Edge Function em vez de numa migração.

Payload validado por zod (`invite-member/validate.ts`, módulo puro, testado
no vitest — 7 casos, incluindo a rejeição explícita de `role: "owner"`: esse
papel só sai do bootstrap do primeiro usuário, nunca de um convite). Casos
tratados: e-mail já registrado (sem `getUserByEmail` na API admin, cai para
`listUsers` e localiza por e-mail — aceitável na escala de uma organização
só, ADR-014); `membership` duplicada (`23505` vira `409 conflict` legível,
não `500`).

Frontend: `/settings` deixou de ser placeholder. Seção **Equipe**
(`TeamSection`) lista `role`/`status` de cada membro, com botão "Convidar"
visível só para `owner`/`admin`. `memberships` e `profiles` não têm chave
estrangeira entre si — ambas apontam para `auth.users`, mas não uma para a
outra —, então a lista faz duas consultas e o merge no cliente, em vez de um
`select` aninhado que o PostgREST não consegue montar.

**Limite conhecido, registrado em vez de escondido:** a lista não mostra
e-mail — `profiles` não duplica e-mail de propósito (documento 02), e mostrar
e-mail exigiria ou reverter essa decisão ou uma segunda Edge Function com
`service_role` só para leitura. Um convidado sem `full_name` (que só é
preenchido no primeiro login) aparece como "Sem nome — aguardando primeiro
acesso" — estado real, não mascarado, em vez de inventar um rótulo.

As demais seções prometidas em `navigation.ts` (marca, ICP, orçamento de IA)
aparecem na própria tela como pendentes, cada uma com a fase em que chega —
mesmo princípio do `ModulePlaceholder`, em escala de seção.

## Fallback que mascara dado ausente (subtarefa 10)

`eslint-rules/no-masking-fallback.js`, mesmo padrão sem dependência nova de
`no-cross-module-import.js`. Proíbe `a || 0`, `a || ""` e `a || false` —
especificamente esses três literais, não todo uso de `||`: são os valores que
**também são** o "vazio" do próprio tipo, então `saldo || 0` esconde a
diferença entre "o saldo é zero" e "o saldo não veio". `??` resolve porque só
substitui `null`/`undefined`. Regra ampla o bastante para pegar o defeito real
e estreita o bastante para não gerar ruído em lógica booleana comum. Achou uma
ocorrência pré-existente (`progress.tsx`, `value || 0`), corrigida.

---

## Verificação

| | |
|---|---|
| Typecheck | limpo |
| Lint | 0 erros, 9 avisos (mesmos de sempre + `AuthProvider`, todos `react-refresh` em arquivo com hook e componente) |
| Testes | 85 passando |
| Build | ✓ · bundle 760 kB (223 kB gzip) — cresceu porque Dialog, Select, Table e `functions.invoke` passaram a ser exercitados de verdade; revisão de bundle é escopo da FASE 23 |
| `get_advisors(security)` | zero lints, contra o projeto remoto |
| RLS | `ENABLE` + `FORCE` nas cinco tabelas, confirmado por catálogo e por comportamento |
| Política `anon` | zero, nas cinco tabelas, confirmado por catálogo |
| CI `database` | configurado; não executado localmente (sem Docker na sandbox) |
| `invite-member` | implantada (`ACTIVE`) no projeto remoto; lógica pura testada no vitest, mas a chamada HTTP de ponta a ponta não foi exercitada nesta sandbox — o proxy de saída bloqueia HTTPS direto a `*.supabase.co` |
| Navegação no navegador | `/`, `/entrar`, `/esqueci-senha` renderizados via Chromium headless; redirecionamento não-autenticado → `/entrar` confirmado; console sem erro |

---

## Pendente nesta fase

| Subtarefa | O que falta |
|---|---|
| 6 | RPCs de agregação (`SECURITY INVOKER` + `STABLE`) — sem tabela de negócio ainda para agregar, fica para quando o primeiro módulo (FASE 3) nascer |
| 7 | Endurecer entrada com zod nas demais Edge Functions (`render-asset`) — `invite-member` já nasceu validada |

Com `organizations` existindo, a subtarefa 10 da FASE 1 (`ai-gateway` e
tabelas de IA/observabilidade), registrada como bloqueada em
`docs/13-EXECUCAO-FASE-1.md`, está desbloqueada — mas não foi retomada nesta
sessão.

Um ajuste identificado mas não feito: `supabase/functions/_shared/auth.ts`
cria o cliente sem o genérico `Database`, então `caller.db` fica sem
tipagem de coluna em toda Edge Function que o usa — gap que já existia desde
a FASE 1, escrito antes do schema existir. Corrigível agora com um import de
tipo cross-boundary (`src/integrations/supabase/types.ts` a partir de
`supabase/functions/`), mas não verificável nesta sandbox sem `deno check`
local — fica para uma sessão com Docker/Deno disponível, para não commitar
uma mudança de tipagem sem conseguir rodar o checker que ela afeta.
