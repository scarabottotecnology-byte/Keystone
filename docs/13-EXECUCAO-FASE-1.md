# 13 — Execução da FASE 1 (em andamento)

Registro do que já foi construído da FASE 1 — Fundação técnica. Segue os STEPs
11 e 12 do método (DOCUMENT e REPORT) do documento 09.

**Status:** parcial. A fatia de frontend está entregue; a de backend e CI não.

---

## Concluído

### Estrutura de módulos (subtarefa 2)

`src/` reorganizado. O código de custos saiu de `src/pages/` e virou o módulo
`cost-intelligence`, com histórico preservado (movido por `git mv`).

```
src/
├── app/                        composição: navegação, rotas, 404
│   ├── navigation.ts           registro único dos 15 destinos
│   └── NotFound.tsx
├── components/
│   ├── ui/                     48 componentes shadcn — preservados
│   └── shared/                 transversais do produto
│       ├── PageHeader.tsx
│       ├── QueryState.tsx
│       └── ModulePlaceholder.tsx
└── modules/
    └── cost-intelligence/
        ├── pages/  CostDashboard · CostImport · CostEntries · CostCenters
        ├── hooks/  useFinancialData
        ├── lib/    field-mapping
        └── types.ts
```

Rotas antigas (`/import`, `/entries`, `/cost-centers`) redirecionam para as
novas, para não quebrar link salvo.

### Design system premium (subtarefa 6)

`src/index.css` reescrito. O tema padrão do Lovable saiu.

- **Dark-first**, com tema claro completo. `class="dark"` no `<html>`.
- **Um acento apenas** — teal `hsl(176 42% 46%)`. Marca ação primária e destaque
  de dado; não decora.
- **Semântica em três estados**: `positive`, `warning`, `negative`, separados do
  acento. Cor que significa "está ruim" não pode ser a mesma que significa
  "clique aqui".
- **Escala de gráfico** `--chart-1` a `--chart-6`, pensada para leitura de série.
  As cores literais em `hsl(220, 70%, 50%)` que estavam espalhadas pelos
  gráficos foram substituídas por tokens — antes elas ignoravam o tema.
- **Raio 0.375rem**, contra os 0.75rem anteriores. Canto muito arredondado lê
  como ferramenta de consumo.
- Utilitários `.numeric` e `.label-caps`; foco sempre visível;
  `prefers-reduced-motion` respeitado.
- O emoji `💰` saiu da navegação.

### Shell de navegação (subtarefas 6 e 7)

`src/app/navigation.ts` é o registro único dos 15 destinos, agrupados em Visão
geral, Crescimento, Receita, Inteligência, Controladoria e Sistema. A sidebar, o
roteador e as telas de módulo não construído leem daqui — não há lista de
destinos duplicada. Está preparado para filtrar item por papel quando o RBAC
entrar na FASE 2.

Cada destino declara a fase em que é entregue, exibida como etiqueta `F3`, `F12`
na sidebar.

### Telas de módulo não construído

`ModulePlaceholder` renderiza, para cada um dos 13 módulos ainda não
implementados, o que o módulo responde e o que existirá nele — **sem dado de
exemplo, sem gráfico falso**. É degradação explícita, conforme a seção 64 do
master prompt.

### Estados de carregamento, erro e vazio

Corrigido um defeito real encontrado ao rodar a aplicação: o dashboard de custos
exibia **"Carregando..." indefinidamente** quando o Supabase não respondia. O
usuário não distinguia consulta lenta de falha de conexão e não tinha caminho de
recuperação.

`QueryState` passa a garantir os três estados nas quatro telas do módulo. O
extrator de mensagem trata o formato de erro do Supabase, que é objeto simples e
não instância de `Error` — tratar só `instanceof Error` fazia toda falha de banco
virar "erro desconhecido".

### Limpeza de lint (pré-requisito da subtarefa 11)

Lint saiu de **7 erros para 0**. Todos preexistentes:

| Erro | Correção |
|---|---|
| `require()` em `tailwind.config.ts` | import ES |
| Interface vazia em `command.tsx` e `textarea.tsx` | alias de tipo |
| `any` em `useFinancialData` | tipo gerado do banco |
| `any` em `CostCenters` | união `CostCenterField` |
| `any` ×2 em `CostImport` | `FinancialEntryInsert` e narrowing no catch |

Sem isso, o gate de CI da subtarefa 11 nasceria vermelho e teria de ser
desligado — o que anularia o próprio critério de aceite.

### Testes

`src/test/example.test.ts` (que só afirmava `true === true`) foi removido e
substituído por 14 testes reais sobre a lógica introduzida: integridade do
registro de navegação e extração de mensagem de erro.

### Descoberta: lockfile fora de sincronia

`npm install` revelou que `package-lock.json` **não continha**
`@supabase/supabase-js` nem `xlsx`, apesar de ambos estarem no `package.json`.
O lockfile estava sendo mantido pelo bun e o do npm ficou para trás. Isso é
evidência concreta do achado **L-04**: instalar com npm e com bun produzia
árvores diferentes. O lockfile foi regenerado; a padronização de um gerenciador
único (subtarefa 4) segue pendente.

---

## Verificação

| | |
|---|---|
| Typecheck | limpo |
| Lint | 0 erros, 8 avisos (todos `react-refresh` em componentes shadcn) |
| Testes | 14 passando |
| Build | ✓ em 6,5 s |
| Navegação | 15 rotas conferidas no navegador, tema claro e escuro |
| Console | sem erro de código |

O único erro de console é `ERR_TUNNEL_CONNECTION_FAILED` no módulo de custos:
o container de desenvolvimento não alcança o Supabase pelo proxy. Não é defeito
da aplicação — e é justamente o cenário que agora exibe o estado de erro correto.

---

## Pendente nesta fase

| # | Subtarefa | Observação |
|---|---|---|
| 1 | Revalidar o banco remoto | Bloqueado: MCP do Supabase sem permissão nesta sessão |
| 3 | Lint proibindo import entre módulos | A convenção existe, falta a regra que a impõe |
| 4 | Padronizar gerenciador de pacotes | Decisão pendente: npm ou bun |
| 5 | Proteger o `.env` | `.gitignore` e `.env.example` |
| 8 | `_shared/` das Edge Functions | Não iniciado |
| 9 | `ai-gateway` | Não iniciado |
| 10 | Migração das tabelas de IA e observabilidade | Não iniciado |
| 11 | CI no GitHub Actions | Não iniciado — lint já está verde para o gate |
| 12–14 | Pedidos LinkedIn, Meta e WhatsApp | Ação humana |

---

## Nota sobre a ordem de execução

O frontend foi feito antes do backend a pedido do cliente, contrariando a ordem
sugerida no documento 09. A escolha é defensável e não gerou dívida: o que foi
construído — tokens, estrutura de módulos, shell — é infraestrutura de interface
que não depende de banco, e nenhuma tela exibe dado simulado.

O limite dessa inversão é claro e permanece respeitado: **nenhuma tela de
produto será construída antes da FASE 2**. O achado C-01 continua aberto e é a
prioridade real do projeto.
