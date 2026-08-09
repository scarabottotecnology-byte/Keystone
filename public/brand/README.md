# Marca Keystone — arquivos e uso

Arquivos oficiais da identidade visual. Use estes — não recorte de tela nem
reconstrua.

## O símbolo

A **pedra de fecho**: a cunha no topo do arco que trava todas as outras pedras.
Sem ela, o arco não fica de pé — nem com todas as demais no lugar. É o que
controladoria é dentro de uma empresa.

O **topo em arco** não é decoração: é ele que distingue a forma de um trapézio
qualquer. Sem a curvatura, o símbolo lê como recipiente. Não achate o topo.

## Arquivos

| Arquivo | Quando usar |
|---|---|
| `assinatura-completa.svg` / `.png` | Capa de proposta, contrato, apresentação. Traz símbolo, logotipo e a frase. |
| `assinatura-vertical.svg` / `.png` | Espaço estreito e alto — lateral de documento, banner. |
| `assinatura-horizontal.svg` / `.png` | Cabeçalho e rodapé de documento, assinatura de e-mail. |
| `assinatura-horizontal-escuro.svg` / `.png` | A mesma, sobre fundo escuro. |
| `simbolo.svg` / `.png` | Símbolo isolado, fundo claro. |
| `simbolo-escuro.svg` / `.png` | Símbolo isolado, fundo escuro. |
| `simbolo-mono.svg` | Uma cor só. Herda `currentColor` — para gravação, carimbo, fax, marca d'água. |
| `favicon.svg` | Aba do navegador. |
| `avatar-512.png` | LinkedIn, Instagram, WhatsApp Business, qualquer avatar quadrado. |

**SVG para tela e impressão** — é vetor, escala sem perder qualidade.
**PNG para Word, PowerPoint e PDF** — muitos editores lidam mal com SVG. Os PNG
têm fundo transparente e resolução alta (símbolo a 1024px, assinaturas acima de
1300px de largura).

> Nota: os SVG de assinatura usam texto real, com as fontes Newsreader e Inter.
> Se abrir num computador sem essas fontes, o logotipo cai para uma serifada
> genérica. **Para enviar a terceiros, prefira sempre o PNG** — nele o texto já
> está rasterizado e não depende de fonte instalada.

## Cores

| Papel | Claro | Escuro |
|---|---|---|
| Corpo da pedra | `#12403E` | `#E3EAEA` |
| Faixa de carga | `#1F6F6B` | `#5CB3AD` |
| Texto da frase | `#37464A` | `#BAC6C7` |

**Não use dourado no digital.** Em B2B financeiro, ouro comunica patrimônio
pessoal e investimento — controladoria vende rigor e método. Em material
impresso com tinta especial, dourado pode funcionar como cor de apoio; na tela,
não.

## Tipografia

| Papel | Fonte |
|---|---|
| Logotipo e títulos | **Newsreader** — serifada de contraste alto |
| Interface, tabela e número | **Inter** — figuras tabulares reais |
| Código, CNPJ, identificador | Mono do sistema |

Três regras que não mudam:

1. **Peso cai quando o tamanho sobe.** Título grande usa 600, nunca 700 ou mais.
2. **Tracking negativo acima de 24px.** De −1% a −2,5%, proporcional ao tamanho.
3. **Todo número é tabular.** Sem exceção.

Peso alto em tamanho grande é o erro que faz tipografia parecer amadora. A
presença vem do tamanho, não da gordura da letra.

## Área de proteção e tamanho mínimo

- **Respiro:** deixe ao redor da assinatura, livre de qualquer elemento, uma
  margem igual à altura do símbolo.
- **Mínimo do símbolo:** 16px na tela, 6mm impresso.
- **Mínimo da assinatura horizontal:** 120px na tela, 35mm impresso. Abaixo
  disso, use só o símbolo.

## O que não fazer

- Achatar o topo em arco
- Aplicar gradiente, relevo, sombra ou contorno
- Distorcer a proporção
- Recolorir fora da tabela acima
- Usar a assinatura sobre imagem de baixo contraste
- Reescrever a frase — *"Clareza financeira para decisões que importam."* é fixa

## No produto

O símbolo é um componente React em `src/components/shared/Logo.tsx`, com o SVG
inline — as cores acompanham os tokens do tema e não há requisição de rede.
Os arquivos deste diretório servem para uso **fora** do produto.
