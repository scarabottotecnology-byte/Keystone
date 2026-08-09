# 00 — Auditoria do repositório de origem (STEP 1: ANALYZE)

> **Este documento audita outro produto.** Ele foi escrito quando o Growth OS
> ainda seria construído dentro do repositório do **Centro de Custos
> Inteligente**, sob o ADR-001. Essa decisão foi revertida: o Growth OS tem
> repositório e banco próprios, e o Centro de Custos permanece separado
> (documento 15).
>
> Fica aqui por duas razões. É o registro de onde vieram as escolhas de stack e
> de design system que foram aproveitadas, e é a **origem do achado C-01** — a
> falha crítica que continua aberta naquele produto e precisa de dono lá.
>
> Nada descrito abaixo é herdado por este repositório.

Levantamento factual do que existia no repositório de origem, antes de qualquer
decisão de arquitetura. Nada aqui é suposição: cada afirmação vem de leitura de
arquivo.

---

## 1. O que o projeto é hoje

O repositório **não é** um sistema de growth. É um **dashboard financeiro de
centro de custos**, gerado via Lovable, com três funções: importar planilha Excel,
listar lançamentos e visualizar gráficos agregados.

- Nome interno na UI: `💰 FinDash` (`src/components/AppSidebar.tsx`)
- Origem: Lovable (`lovable-tagger` em devDependencies, `.lovable/plan.md`)
- Backend: projeto Supabase `hlvkkziiaeyqyenekdck`
- Histórico: 15 commits, majoritariamente correções de import de datas e valores
  zerados no dashboard.

### Limitação de acesso desta sessão

O MCP do Supabase respondeu `You do not have permission to perform this action`
para `list_tables`, `list_edge_functions` e demais chamadas. **O estado do banco
remoto não pôde ser inspecionado diretamente.** A auditoria do schema baseia-se em
duas fontes que concordam entre si:

- `supabase/migrations/20260327113159_fe07fe04-dea3-441c-ba02-4ba99ee372b2.sql`
- `src/integrations/supabase/types.ts` (gerado a partir do banco real)

Como os tipos gerados refletem o banco e batem 1:1 com a migração, a confiança é
alta — mas **a FASE 1 deve começar revalidando o banco remoto com credencial
adequada**, incluindo a verificação de Edge Functions e buckets de Storage, que
não puderam ser listados.

---

## 2. Inventário técnico

### Stack presente

| Camada | Tecnologia | Versão |
|---|---|---|
| Build | Vite | ^5.4.19 |
| UI | React | ^18.3.1 |
| Linguagem | TypeScript | ^5.8.3 |
| Estilo | Tailwind CSS + `tailwindcss-animate` + `@tailwindcss/typography` | ^3.4.17 |
| Componentes | shadcn/ui sobre Radix UI (48 componentes em `src/components/ui/`) | — |
| Dados | `@supabase/supabase-js` + `@tanstack/react-query` | ^2.100.1 / ^5.83.0 |
| Rotas | `react-router-dom` | ^6.30.1 |
| Gráficos | `recharts` | ^2.15.4 |
| Planilhas | `xlsx` (SheetJS) | ^0.18.5 |
| Validação | `zod` + `react-hook-form` + `@hookform/resolvers` | ^3.25.76 |
| Testes | Vitest + Testing Library + jsdom; Playwright configurado | ^3.2.4 / ^1.57.0 |

**Leitura:** a stack presente é exatamente a stack preferencial do Master Prompt
(seção 3). Não há necessidade de troca de tecnologia de base — apenas de expansão.
`zod` já está instalado e não está sendo usado para validação de import, o que é
uma oportunidade imediata.

### Estrutura de código

```
src/
├── App.tsx                      4 rotas, sem guarda de autenticação
├── components/
│   ├── AppLayout.tsx            19 linhas
│   ├── AppSidebar.tsx           63 linhas — 4 itens de menu hard-coded
│   ├── NavLink.tsx              28 linhas
│   └── ui/                      48 componentes shadcn (intocados, reutilizáveis)
├── hooks/
│   ├── useFinancialData.ts      29 linhas — busca a tabela inteira
│   ├── use-toast.ts             186 linhas
│   └── use-mobile.tsx
├── integrations/supabase/
│   ├── client.ts                16 linhas
│   └── types.ts                 238 linhas (gerado)
├── lib/
│   ├── field-mapping.ts         80 linhas — mapeamento Excel → colunas
│   └── utils.ts                 6 linhas
└── pages/
    ├── Index.tsx                206 linhas — dashboard, KPIs, 3 gráficos
    ├── Import.tsx               194 linhas — upload, mapeamento, insert
    ├── Entries.tsx              83 linhas
    ├── CostCenters.tsx          144 linhas
    └── NotFound.tsx             24 linhas
```

Total de código de produto (excluindo `ui/`): ~1.100 linhas.

### Banco de dados

Uma única tabela, `public.financial_entries`, com 22 colunas de negócio, todas
`TEXT`/`NUMERIC`/`DATE` e **todas nullable**, mais `id`, `import_batch_id` e
`created_at`. 8 índices de coluna única.

Não existe: `organizations`, `users`, `memberships`, chave estrangeira, coluna
`updated_at`, coluna `deleted_at`, constraint de unicidade de negócio, enum, ou
qualquer tabela além desta.

### Integrações e automações

Nenhuma. Não há Edge Functions no repositório (`supabase/` contém apenas
`config.toml` e uma migração), nem n8n, nem provedor de IA, nem OAuth, nem
webhook, nem CI/CD (`.github/` não existe).

### Variáveis de ambiente

`.env` versionado localmente com `VITE_SUPABASE_PROJECT_ID`,
`VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_URL`. A publishable key é
pública por design e sua exposição **não é**, por si só, uma vulnerabilidade —
ela só se torna perigosa quando combinada com o achado C-01 abaixo.

---

## 3. Achados

Classificação conforme o comando `AUDITAR SISTEMA` (seção 68 do Master Prompt).

### CRITICAL

**C-01 — O banco de dados é efetivamente público para leitura, escrita e exclusão.**

`supabase/migrations/…sql` cria seis políticas de RLS, três delas para o papel
`anon`:

```sql
CREATE POLICY "Anon can read financial entries"   ON public.financial_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert financial entries" ON public.financial_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can delete financial entries" ON public.financial_entries FOR DELETE TO anon USING (true);
```

RLS está habilitada, o que dá aparência de segurança, mas `USING (true)` para
`anon` anula a proteção. Como a URL do projeto e a publishable key estão no bundle
do frontend (inevitável e correto para um cliente Supabase), **qualquer pessoa que
abra a aplicação consegue extrair as duas e, com um único `curl`, ler todos os
lançamentos financeiros da consultoria ou apagar a tabela inteira.**

Não há política de `UPDATE`, o que significa que os dados hoje só podem ser
inseridos e apagados — mas `DELETE` anônimo irrestrito é destrutivo e sem
recuperação, já que não há soft delete nem backup configurado no repositório.

- **Impacto:** vazamento de dados financeiros de clientes + perda total de dados.
- **Correção:** FASE 2. Remover todas as políticas `anon`, exigir autenticação e
  reescrever as políticas sobre `organization_id`. Detalhado em `07 §2`.
- **Bloqueia:** qualquer uso em produção. Esta é a razão pela qual a FASE 2 é
  pré-requisito rígido de todas as fases posteriores.

**C-02 — Não existe autenticação.**

`src/App.tsx` monta as quatro rotas diretamente, sem `<ProtectedRoute>`, sem
`session`, sem tela de login. O `createClient` em `client.ts` configura
`persistSession` e `autoRefreshToken`, mas nenhum fluxo de auth é iniciado em
lugar nenhum do código — `auth.uid()` é sempre `null`. Consequência direta: não há
como escrever RLS por usuário até que isto exista.

### HIGH

**H-01 — Ausência total de isolamento por tenant.** Nenhuma tabela tem
`organization_id`. Como o Master Prompt exige multi-tenant desde o início (seções
40–41), e como retrofit de tenancy em base com dados é sempre mais caro que
começar certo, esta é a decisão que deve ser tomada na FASE 2 e não depois.
Ver ADR-002.

**H-02 — O dashboard carrega a tabela inteira no navegador.**
`useFinancialData.ts` pagina em blocos de 1.000 registros num laço `while` **sem
limite superior**, concatena tudo em memória e devolve o array completo. Os quatro
KPIs, o gráfico de barras, o de pizza e o de linha são todos calculados no cliente
via `useMemo` sobre esse array (`src/pages/Index.tsx`). Com dezenas de milhares de
lançamentos isso significa payload de vários MB, travamento de aba e custo de
egress. Agregação pertence ao Postgres.

**H-03 — Importação sem idempotência.** `import_batch_id` é gerado, mas não há
verificação de duplicidade: reimportar o mesmo arquivo duplica todos os
lançamentos silenciosamente. Não há `import_batches`, checksum de arquivo, nem
constraint natural. Isto viola diretamente a seção 38 do Master Prompt.

**H-04 — Ausência de validação no import.** `zod` está instalado mas
`src/pages/Import.tsx` insere no banco o resultado direto do parse da planilha. Sem
schema de validação, sem limite de tamanho de arquivo, sem tratamento de tipo além
de `excelSerialToDate`. Combinado com C-01, um terceiro pode injetar qualquer
volume de lixo na base.

**H-05 — Conversão de data frágil.** `excelSerialToDate()` em
`src/lib/field-mapping.ts` aceita qualquer número entre 1 e 200.000 como serial de
Excel. Um campo "Número" ou um código numérico de centro de custo mapeado por
engano vira uma data válida. Quando o valor não é numérico, a função devolve
`String(val)` sem normalizar formato — `31/12/2025` (padrão brasileiro) é enviado
cru para uma coluna `DATE` do Postgres. O histórico de commits confirma o
problema: *"Corrigiu datas no import"*, *"Corrigir import date Excel"*,
*"Corrigiu import date"* — três correções para o mesmo defeito.

### MEDIUM

**M-01 — Fallbacks de KPI mascaram dados ausentes.** Em `Index.tsx`,
`effectivePago = totalPago || totalNegativo` e
`cur.previsto += e.valor_previsto || Math.abs(e.valor_negativo || 0)`. Quando
`valor_pago` soma exatamente zero, o sistema substitui pelo somatório de
`valor_negativo` sem sinalizar. O usuário não distingue "pago = 0" de "campo não
mapeado". Os commits *"Fix null values in dashboard"* e *"Corrigir dashboard dados
zerados"* mostram que isso foi tratado como bug de exibição quando é um problema
de modelagem: as colunas são todas nullable e o significado de cada uma não é
imposto pelo schema.

**M-02 — Modelo de dados sem semântica.** 22 colunas planas, nullable, sem enum,
sem FK, sem tabela de dimensão para centro de custo, filial, BU ou fornecedor.
`cca`, `ccs`, `cf`, `cod_cc` são quatro identificadores de centro de custo
concorrentes cuja relação não está declarada em lugar nenhum — o código
simplesmente tenta `e.cca || e.ccs || e.cod_cc || "Sem CC"`.

**M-03 — Cobertura de testes praticamente nula.** Existe
`src/test/example.test.ts` e `playwright.config.ts` sem nenhum spec. Nenhuma
lógica de negócio (parsing, agregação, mapeamento) está testada, apesar de ser
justamente a parte que já quebrou repetidas vezes.

**M-04 — Sem CI.** Não há `.github/workflows/`. `lint`, `test` e `build` existem
como scripts mas nada os executa automaticamente.

### LOW

**L-01 — README é o placeholder do Lovable** (`TODO: Document your project here`).
**L-02 — Identidade visual genérica.** Paleta azul/verde padrão shadcn e um emoji
de saco de dinheiro como logotipo. Distante do posicionamento premium exigido
(seção 7).
**L-03 — Navegação hard-coded** em `AppSidebar.tsx`, sem controle por permissão —
vira dívida assim que houver papéis.
**L-04 — `bun.lockb`, `bun.lock` e `package-lock.json` coexistem**, com risco de
resolução divergente entre ambientes. Padronizar um gerenciador.
**L-05 — `.env` está versionado no Git e não consta no `.gitignore`** (verificado:
`git ls-files .env` retorna o arquivo). O conteúdo atual são apenas
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e
`VITE_SUPABASE_PROJECT_ID` — todos públicos por design e já presentes no bundle
do frontend, portanto **não há segredo vazado hoje**.

O risco é futuro: o arquivo é o destino natural da primeira chave privada que
alguém precisar em desenvolvimento, e nesse momento ela vai para o histórico do
repositório sem que ninguém perceba. Correção na FASE 1: adicionar `.env` ao
`.gitignore`, versionar um `.env.example` sem valores, e verificar o histórico
antes de remover do índice. Segredo de servidor nunca usa prefixo `VITE_` — o
Vite injeta tudo com esse prefixo no bundle público.

---

## 4. O que foi aproveitado

Sob o ADR-001, esta seção listava o que seria preservado dentro do mesmo
repositório. Com a reversão, o que atravessou foi só o que é **portável e não
carrega o negócio do outro produto**:

| Ativo | Destino |
|---|---|
| 48 componentes `src/components/ui/` | **Copiados.** Base do design system. São shadcn, não código de custos. |
| `AppLayout`, `AppSidebar`, `NavLink` | **Copiados e refatorados.** A sidebar passa a ser orientada a dados. |
| Configuração Vite/Tailwind/TS/Vitest/Playwright | **Copiada e estendida.** |
| `financial_entries`, telas de custo, importador, `field-mapping` | **Não vieram.** Pertencem ao Centro de Custos. |

O que veio é infraestrutura de frontend, que não tem dono de domínio. O que
ficou é o produto de controladoria — inclusive o esquema e os dados.

---

## 5. Conclusão da análise

O repositório oferece uma **fundação de frontend legítima** (stack correta, design
system completo, ferramental de teste instalado) e um **backend que não pode ir
para produção como está** (sem auth, sem tenancy, RLS aberta, uma tabela plana).

Isso define a forma do roadmap: as FASES 1–2 não são "preparação", são
**correção de falha crítica em curso**. Construir Command Center, IA ou
integrações sobre a RLS atual seria empilhar produto sobre um vazamento de dados.

A ordem do Master Prompt (fundação → banco/auth/tenant → produto) já é a ordem
correta, e a auditoria a confirma por evidência, não por convenção.
