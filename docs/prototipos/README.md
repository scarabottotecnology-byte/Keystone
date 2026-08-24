# Protótipos de interface

Referências visuais aprovadas pelo usuário. **Não são código de produção** e
nada aqui é importado pelo `src/` — são o alvo contra o qual as telas reais
vão ser comparadas.

---

## `2026-08-24-interface-alvo.html`

**O que é:** o protótipo de interface do Keystone Growth OS que o usuário
aprovou em 24/08/2026 e declarou como o que quer ver quando o site estiver
pronto — em especial na parte de **super CRM** (Prospects, Pipeline, Leads,
Campaigns).

**Origem:** artefato publicado em
`https://claude.ai/code/artifact/007fabd3-c1e8-4047-b942-0401b5b9bdfb`
(privado, do usuário). A cópia neste diretório existe porque o ambiente de
execução é descartável: o que não está commitado se perde.

**Cuidado ao ler:** o próprio protótipo se declara na primeira linha —
"todos os números são fictícios, para avaliar o desenho. Nada aqui está
conectado a dado real". R$ 1,84 mi de pipeline, ICP Score 91, 42 empresas
descobertas: **nenhum desses números é dado da Keystone**. Servem para
avaliar densidade de informação e hierarquia visual, não como meta nem como
baseline.

O primeiro bloco `<script>` do arquivo é runtime do hospedeiro de artefatos,
injetado na publicação — não é desenho e não deve ser copiado para o `src/`.

### As sete telas do protótipo

| # | Tela | Fase do roadmap | Situação hoje |
|---|---|---|---|
| 1 | Command Center | 3 | construída |
| 2 | Prospect Center | 12 | não começou |
| 3 | Editor de conteúdo (Content Score, sugestões, fundamentação) | 5 | parcial — biblioteca e aprovação existem, o editor campo a campo não |
| 4 | Pipeline | 17 | não começou |
| 5 | Analytics (leads por pilar, pipeline por canal, atribuição em quatro modelos) | 8 | não começou |
| 6 | Fila de publicação | 6 | construída |
| 7 | Relatório executivo (resultado por centro de custo) | — | não previsto no roadmap atual |

### Duas coisas que o protótipo mostra e o roadmap ainda não tem

Registradas aqui para não sumirem quando o projeto for retomado:

1. **Grupo "Controladoria" na navegação, com "Relatórios"** — a tela 7 traz
   um relatório executivo com resultado por centro de custo. O
   `src/app/navigation.ts` não tem esse grupo, e nenhuma das 24 fases do
   documento 09 o prevê. É escopo novo, não um módulo esquecido.
2. **Atribuição por canal em quatro modelos** (tela 5) — a FASE 8 prevê
   Content ROI e atribuição, mas não os quatro modelos lado a lado.

Quando o projeto voltar, a decisão a tomar é se esses dois entram no
roadmap ou se o protótipo é ajustado.
