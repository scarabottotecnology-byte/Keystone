# Fontes do motor de arte

Instâncias **estáticas** de Inter e Newsreader, as mesmas famílias do produto.

## Por que não são as variáveis

O `@fontsource-variable` que o frontend usa entrega `.woff2` variável. Nenhum
dos dois formatos serve aqui:

- **Variável** — o parser de fonte do satori (um fork do `opentype.js`) quebra
  ao ler a tabela `fvar`:
  `TypeError: Cannot read properties of undefined (reading '256')`.
- **woff2** — o satori não descomprime woff2. Só TTF, OTF e WOFF.

Daí instâncias estáticas em TTF.

## Como foram geradas

A partir das variáveis do Google Fonts, com `fontTools`:

```python
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.ttLib import TTFont

for dst, axes in [
    ("Inter-Regular.ttf",       {"wght": 400, "opsz": 18}),
    ("Inter-Medium.ttf",        {"wght": 500, "opsz": 18}),
]:
    f = TTFont("Inter[opsz,wght].ttf")
    instantiateVariableFont(f, axes, inplace=True, updateFontNames=True)
    f.save(dst)

for dst, axes in [
    ("Newsreader-Regular.ttf",  {"wght": 400, "opsz": 36}),
    ("Newsreader-SemiBold.ttf", {"wght": 600, "opsz": 36}),
]:
    f = TTFont("Newsreader[opsz,wght].ttf")
    # Newsreader não declara Axis Value para opsz=36 na tabela STAT, e o
    # renomeador falha. O nome não importa aqui — o satori identifica a fonte
    # pelo `name` que passamos em `compose.ts`, não pelo nome interno.
    instantiateVariableFont(f, axes, inplace=True, updateFontNames=False)
    f.save(dst)
```

Origem: `https://raw.githubusercontent.com/google/fonts/main/ofl/{familia}/`

`opsz` (optical size) fica travado no tamanho para o qual cada família é usada
na peça: 18 para a Inter, que só aparece em corpo pequeno e rodapé, e 36 para a
Newsreader, que carrega os corpos grandes.

## Peso

~900 kB somados, dentro do limite de bundle da Edge Function. As quatro são
carregadas uma vez por instância e memoizadas — ver `loadFonts()` em
`compose.ts`.

## Licença

Ambas sob **SIL Open Font License 1.1**, que permite redistribuição, inclusive
modificada — instanciar um peso fixo é modificação prevista. A OFL exige que a
licença acompanhe os arquivos.

- Inter — Rasmus Andersson
- Newsreader — Production Type

## Quando mexer aqui

Ao adicionar um peso ao design system, gere a instância correspondente. Peso
pedido em `compose.ts` que não existe aqui faz o satori cair na aproximação mais
próxima **em silêncio** — a peça sai com a tipografia errada sem erro nenhum.
