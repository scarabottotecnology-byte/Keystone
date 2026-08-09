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
| Testes | 14 passando |
| Build | ✓ em 4,3 s · bundle 399 kB (125 kB gzip) |
| Navegação | rotas conferidas no navegador, tema claro e escuro |
| Console | sem erro |

---

## Pendente nesta fase

| # | Subtarefa | Observação |
|---|---|---|
| 3 | Lint proibindo import entre módulos | A convenção existe, falta a regra que a impõe |
| 8 | `_shared/` das Edge Functions | Não iniciado |
| 9 | `ai-gateway` | Não iniciado |
| 10 | Migração das tabelas de IA e observabilidade | Não iniciado |
| 11 | CI no GitHub Actions | Não iniciado — lint já está verde para o gate |
| 12–14 | Pedidos LinkedIn, Meta e WhatsApp | Ação humana, com semanas de lead time |

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
