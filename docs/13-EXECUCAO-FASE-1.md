# 13 — Execução da FASE 1 (em andamento)

Registro do que já foi construído da FASE 1 — Fundação técnica. Segue os STEPs
11 e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** parcial. A fatia de frontend está entregue; a de backend e CI não.

> **Nota de escopo.** Parte deste trabalho foi feita no repositório de origem,
> quando o Growth OS ainda seria construído dentro do Centro de Custos. Com a
> reversão do ADR-001 (documento 15), o que atravessou para cá foi só o que é
> infraestrutura de interface. As telas de custo, o importador e o esquema
> financeiro **não vieram** — pertencem ao outro produto.

---

## Concluído

### Estrutura de módulos (subtarefa 2)

`src/` organizado por módulo de negócio, com a convenção de que **um módulo não
importa de outro**.

```
src/
├── app/                        composição: navegação, tema, rotas, 404
│   ├── navigation.ts           registro único dos 14 destinos
│   ├── ThemeProvider.tsx
│   └── NotFound.tsx
├── components/
│   ├── ui/                     48 componentes shadcn
│   └── shared/                 transversais do produto
│       ├── Logo.tsx
│       ├── PageHeader.tsx
│       ├── QueryState.tsx
│       └── ModulePlaceholder.tsx
├── integrations/supabase/      cliente e tipos gerados
└── modules/                    vazio — o primeiro módulo nasce na FASE 3
```

`modules/` estar vazio é o estado correto da FASE 1: a fundação existe, o
negócio ainda não.

### Design system (subtarefa 6)

`src/index.css` reescrito. O tema padrão do Lovable saiu.

- **Dark-first**, com tema claro completo, e seletor claro/escuro/sistema.
- **Um acento apenas** — teal `hsl(176 42% 46%)`. Marca ação primária e destaque
  de dado; não decora.
- **Semântica em três estados**: `positive`, `warning`, `negative`, separados do
  acento. Cor que significa "está ruim" não pode ser a mesma que significa
  "clique aqui".
- **Escala de gráfico** `--chart-1` a `--chart-6`, pensada para leitura de série,
  em vez de cores literais que ignoram o tema.
- **Raio 0.375rem**, contra os 0.75rem do template. Canto muito arredondado lê
  como ferramenta de consumo.
- Utilitários `.numeric` e `.label-caps`; foco sempre visível;
  `prefers-reduced-motion` respeitado.

### Tipografia e identidade

Newsreader (display) e Inter (interface), auto-hospedadas via
`@fontsource-variable`. Três regras aplicadas: o peso **cai** conforme o corpo
sobe (600, não 700+), *tracking* negativo acima de 24px, e todo número em
figuras tabulares.

A marca foi redesenhada — a pedra de fecho, com topo em arco — e os arquivos
para uso fora do produto estão em `public/brand/`: proposta comercial, contrato
e documento de onboarding.

### Shell de navegação (subtarefas 6 e 7)

`src/app/navigation.ts` é o registro único dos destinos, agrupados em Visão
geral, Crescimento, Receita, Inteligência e Sistema. A sidebar, o roteador e as
telas de módulo não construído leem daqui — não há lista duplicada. Está
preparado para filtrar item por papel quando o RBAC entrar na FASE 2.

Cada destino declara a fase em que é entregue, exibida como etiqueta `F3`, `F12`
na sidebar.

### Telas de módulo não construído

`ModulePlaceholder` renderiza, para **todos** os módulos, o que aquele módulo
responde e o que existirá nele — sem dado de exemplo, sem gráfico falso. É
degradação explícita, conforme a seção 64 do master prompt.

Hoje nenhum módulo está `active`, e um teste garante isso: marcar um como pronto
sem registrar a rota no `App` quebra a suíte, em vez de produzir uma entrada de
menu que abre um 404.

### Estados de carregamento, erro e vazio

`QueryState` garante os três estados obrigatórios em qualquer tela que dependa
de consulta. Nasceu de um defeito real observado na aplicação de origem: a tela
exibia **"Carregando..." indefinidamente** quando o Supabase não respondia, e o
usuário não distinguia consulta lenta de falha de conexão.

O extrator de mensagem trata o formato de erro do Supabase, que é objeto simples
e não instância de `Error` — tratar só `instanceof Error` fazia toda falha de
banco virar "erro desconhecido".

### Cliente Supabase que falha cedo

O cliente valida `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` na carga
e lança com mensagem acionável. Sem isso, ambiente mal configurado só aparecia
mais tarde, como um `Failed to fetch` sem causa aparente.

### Proteção do ambiente (subtarefa 5)

`.env` fora do versionamento — no repositório de origem ele estava **rastreado**.
Fica só o `.env.example`, com aviso explícito de que `service_role` nunca entra
num arquivo lido pelo Vite: tudo com prefixo `VITE_` vai para dentro do bundle.

### Limpeza de lint (pré-requisito da subtarefa 11)

Lint saiu de **7 erros para 0**, todos preexistentes: `require()` em
`tailwind.config.ts`, interfaces vazias em componentes shadcn, e quatro `any`.

Sem isso, o gate de CI da subtarefa 11 nasceria vermelho e teria de ser
desligado — o que anularia o próprio critério de aceite.

### Testes

14 testes sobre a lógica introduzida: integridade do registro de navegação e
extração de mensagem de erro. O `example.test.ts` que só afirmava `true === true`
foi removido.

### Fronteira entre módulos, imposta por lint (subtarefa 3)

A convenção existia; agora ela quebra o build.

Regra própria em `eslint-rules/no-cross-module-import.js`, sem dependência nova.
Duas alternativas foram tentadas antes e descartadas:

- **`no-restricted-imports`** casa contra o *texto* do import e não sabe onde o
  arquivo está. Não separa `../lib/x`, que fica dentro do próprio módulo, de
  `../outro/x`, que atravessa a fronteira — as duas strings começam igual. Pega
  o alias e deixa passar o caminho relativo, que é justamente o caso mais fácil
  de escrever sem perceber.
- **`eslint-plugin-boundaries`** resolve isso lendo o disco, mas para lidar com
  `.ts` e com o alias `@/` puxa uma cadeia de resolvedores que não instalou
  limpo. Sem resolvedor, a regra não enxerga import nenhum e passa em silêncio —
  pior que não ter regra, porque dá impressão de proteção.

A regra própria compara **prefixo de diretório**, que é o que a decisão de fato
depende. Não precisa que o arquivo exista, não tem resolvedor para quebrar.

Cobre alias, caminho relativo em qualquer profundidade, `export … from`,
`export *` e `import()` dinâmico. 13 casos em `RuleTester`.

### CI no GitHub Actions (subtarefa 11)

`.github/workflows/ci.yml`, dois jobs, bloqueando merge:

| Job | O que roda |
|---|---|
| **web** | `npm ci`, lint, typecheck, testes, build |
| **functions** | `deno fmt --check`, `deno lint`, `deno check` |

O segundo job existe porque as Edge Functions ficam fora do ESLint do frontend —
runtime diferente. Sem portão próprio, seriam a única parte do sistema sem
verificação nenhuma.

`npm ci` e não `npm install`: falha se o lockfile estiver fora de sincronia, em
vez de corrigi-lo em silêncio. Foi essa divergência que produziu o achado L-04.

**Um erro real apareceu ao montar o portão.** O `deno check` acusou que o satori
tipa `FontOptions.data` como `ArrayBuffer`, e eu estava passando `Uint8Array`.
Funcionava em runtime — é o tipo de divergência que fica invisível até quebrar
numa atualização de biblioteca. Corrigido com slice pelo offset, porque
`Deno.readFile` pode devolver uma view sobre um buffer maior e entregar
`.buffer` cru passaria bytes vizinhos junto.

### Padronização do gerenciador (subtarefa 4)

**npm.** Os lockfiles do bun ficaram no repositório de origem. A convivência dos
dois já tinha produzido evidência concreta do achado **L-04**: o
`package-lock.json` não continha `@supabase/supabase-js` nem `xlsx`, apesar de
ambos estarem no `package.json`, porque o lockfile mantido era o do bun.

---

## Verificação

| | |
|---|---|
| Typecheck | limpo |
| Lint | 0 erros, 8 avisos (todos `react-refresh` em componentes shadcn) |
| Testes | 33 passando |
| Build | ✓ em 5,1 s · bundle 399 kB (125 kB gzip) |
| Edge Functions | `deno fmt --check`, `deno lint` e `deno check` limpos |
| Navegação | rotas conferidas no navegador, tema claro e escuro |
| Console | sem erro |

Os cinco comandos do CI foram rodados localmente antes de subir o workflow — um
portão que nasce vermelho é um portão que alguém desliga.

---

## Pendente nesta fase

| # | Subtarefa | Observação |
|---|---|---|
| 8 | `_shared/` das Edge Functions | Próximo |
| 9 | `ai-gateway` | Depende da 8 e da 10 |
| 10 | Migração das tabelas de IA e observabilidade | **Bloqueada pela FASE 2** — ver abaixo |
| 12–14 | Pedidos LinkedIn, Meta e WhatsApp | Ação humana, com semanas de lead time |

### A subtarefa 10 depende da FASE 2

As tabelas de IA e observabilidade — `ai_invocations`, `automation_runs`,
`error_logs` — carregam `organization_id NOT NULL`, como toda tabela de negócio
(ADR-002). Só que `organizations` nasce na FASE 2.

Não há como criar essas tabelas na FASE 1 sem uma das duas saídas ruins: abrir
exceção ao P1 logo na primeira migração, ou criar `organizations` fora da fase
dela. A ordem correta é a que o documento 16 já descreve — identidade primeiro.

Registrado aqui porque é descoberta de execução, não erro de planejamento: o
roadmap listava a subtarefa 10 na FASE 1 antes de o P1 estar escrito.

---

## Nota sobre a ordem de execução

O frontend foi feito antes do backend a pedido do cliente, contrariando a ordem
sugerida no documento 09. A escolha é defensável e não gerou dívida: o que foi
construído — tokens, estrutura de módulos, shell, tema, identidade — é
infraestrutura de interface que não depende de banco, e nenhuma tela exibe dado
simulado.

O limite dessa inversão permanece: **nenhuma tela de produto antes da FASE 2.**
Enquanto não houver tenancy e RLS forçada, não há onde uma tela real buscar
dado sem abrir o mesmo tipo de buraco que a auditoria encontrou no produto de
origem.
