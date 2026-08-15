# 17 — Execução da FASE 2 (em andamento)

Registro do que já foi construído da FASE 2 — Banco, autenticação e RLS.
Segue os STEPs 11 e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** parcial. Identidade, RLS e a suíte de regressão estão entregues.
Autenticação de frontend e as RPCs de agregação ainda não.

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

## Verificação

| | |
|---|---|
| Typecheck | limpo |
| Lint | 0 erros, 8 avisos (mesmos pré-existentes da FASE 1, componentes shadcn) |
| Testes | 77 passando (nenhum teste novo de frontend nesta fase — a suíte nova é pgTAP, fora do vitest) |
| Build | ✓ · bundle 399 kB (126 kB gzip) |
| `get_advisors(security)` | zero lints, contra o projeto remoto |
| RLS | `ENABLE` + `FORCE` nas cinco tabelas, confirmado por catálogo e por comportamento |
| Política `anon` | zero, nas cinco tabelas, confirmado por catálogo |
| CI `database` | configurado; não executado localmente (sem Docker na sandbox) |

---

## Pendente nesta fase

| Subtarefa | O que falta |
|---|---|
| 6 | RPCs de agregação (`SECURITY INVOKER` + `STABLE`) |
| 7 | Endurecer entrada com zod nas Edge Functions que já existem |
| 8 (frontend) | Login, logout, recuperação de senha, `<ProtectedRoute>` |
| 9 | Onboarding — escopo reduzido por ADR-014: como não há criação de
    organização nem convite por e-mail, provavelmente só uma tela de "aceitar
    vínculo" para quando `admin_insert` cria a `membership` de um novo membro |
| 10 | Lint/regra proibindo fallback `a || b` que mascara dado ausente |

Com `organizations` existindo, a subtarefa 10 da FASE 1 (`ai-gateway` e
tabelas de IA/observabilidade), registrada como bloqueada em
`docs/13-EXECUCAO-FASE-1.md`, está desbloqueada — mas não foi retomada nesta
sessão.
