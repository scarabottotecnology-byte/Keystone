# `render-asset` — motor de arte

Compõe a peça de conteúdo a partir de um template e do texto da peça, e devolve
um PNG. É o que torna a automação total possível: sem ele, a fila de publicação
é uma lista de rascunhos esperando um designer.

```
deno run -A --config supabase/functions/deno.json \
  supabase/functions/render-asset/preview.ts
```

Gera um PNG por template em `.preview/` (ignorado pelo git). Template é trabalho
de design e se avalia olhando, não lendo o spec.

## Estado

**Módulo, ainda não Edge Function.** Falta o `index.ts` — de propósito.

Um endpoint de renderização precisa saber de quem é a organização, para escolher
os templates certos e gravar no Storage certo. Isso depende de
`app.current_org_ids()`, que nasce na FASE 2. Publicar hoje um handler sem essa
verificação seria um endpoint que qualquer um invoca para gastar CPU e escrever
arquivo — exatamente o tipo de superfície aberta que a auditoria encontrou no
produto anterior.

O que existe já é o miolo, e é testável: composição, validação de zonas e o
guardrail numérico.

| Arquivo | O que é | Runtime |
|---|---|---|
| `templates.ts` | spec das zonas, limites, validação | puro |
| `guardrails.ts` | verificação de número contra a copy | puro |
| `guardrails.test.ts` | 18 testes, rodam no vitest do projeto | puro |
| `compose.ts` | satori + resvg, layout dos templates | Deno |
| `preview.ts` | CLI de pré-visualização local | Deno |

## Como a arte é produzida

**Composição por template, não modelo generativo** — a decisão está no
[documento 14](../../../docs/14-GERACAO-DE-ARTE-E-AUTOMACAO.md). Resumo: modelo
generativo erra texto e número de forma sistemática, e uma peça que estampa um
percentual errado ao lado do logo é dano de credibilidade direto para quem vende
rigor numérico.

### O mecanismo, corrigido

O documento 14 dizia "convertido em PNG por navegador headless". **Estava errado
para o destino.** Edge Function do Supabase roda em Deno Deploy, que não permite
subir um Chrome. A técnica usada para gerar os arquivos de `public/brand/` era
Playwright rodando localmente — não transporta.

O que funciona, verificado:

| | |
|---|---|
| **satori** | layout (subset de flexbox, tipografia real) → SVG |
| **resvg-wasm** | SVG → PNG, em WebAssembly |

Nenhum abre processo. Medido: **1080×1080 em ~270 ms** — cerca de 120 ms de
layout e 150 ms de rasterização.

### As duas restrições que isso impõe

**1. Fonte precisa ser estática.** O parser do satori quebra na tabela `fvar` de
fonte variável. Ver [`fonts/README.md`](./fonts/README.md).

**2. Layout é subset de flexbox.** Sem grid, sem posicionamento absoluto
arbitrário, sem float. Suficiente para peça editorial, e é o preço de não ter
navegador.

## As duas garantias

### Zona que estoura é rejeitada, nunca cortada

Reticências numa peça de consultoria leem como descuido. `validatePayload`
devolve **todas** as violações de uma vez, com quantos caracteres sobram, para
que o agente A10 reescreva numa passada só em vez de descobrir uma por
tentativa.

### Número na arte precisa existir na copy

`verifyNumbersGrounded` barra a renderização quando a arte exibe um valor que
não consta no texto publicado. É a regra de não fabricar dado, aplicada à
imagem.

A comparação é normalizada para notação brasileira — `R$ 1.250,00` e `1250` são
o mesmo número. Sem isso o guardrail viraria fonte de falso positivo, e alguém
o desligaria na primeira semana.

Zonas de rodapé e fonte ficam de fora da verificação (`grounded: false`): ano e
tamanho de amostra não são afirmação do post.

## Pendente

| | Fase |
|---|---|
| `index.ts` com verificação de organização | 2 |
| Persistir em `render_jobs` e no Storage | 5 |
| Templates como dado, não código — hoje adicionar um exige deploy | 5 |
| Os outros 5 templates: `grafico`, `carrossel_capa`, `carrossel_slide`, `case`, `comercial` | 5 |
| Alt text obrigatório gerado junto com a arte | 5 |
| Agente A10 escolhendo template e distribuindo o texto | 5 |
