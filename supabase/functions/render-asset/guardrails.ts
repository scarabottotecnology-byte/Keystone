/**
 * Guardrail numérico da arte.
 *
 * A regra, do documento 14: **todo número que aparece na peça precisa existir
 * na copy.** É a regra de "não fabricar dado" aplicada à imagem.
 *
 * Ela não é decorativa. Uma consultoria de controladoria vende rigor numérico;
 * uma arte que estampa "43%" ao lado do logo, com a copy dizendo 34%, é dano de
 * credibilidade direto — e é exatamente o tipo de erro que passa despercebido
 * numa revisão rápida, porque as duas coisas são plausíveis isoladamente.
 *
 * Por isso a verificação é determinística e barra a renderização, em vez de ser
 * instrução no prompt. Prompt é pedido; isto é garantia.
 *
 * Módulo puro — sem Deno, sem rede. Roda igual na Edge Function e no vitest.
 */

/**
 * Extrai números de um texto, normalizados para comparação.
 *
 * Trata a notação brasileira: ponto é separador de milhar, vírgula é decimal.
 * `1.250,50` vira `1250.5`; `1.250` vira `1250`; `43%` vira `43`.
 *
 * A normalização é o ponto do exercício — comparar as strings cruas faria
 * "R$ 1.250,00" e "1250" parecerem números diferentes, e o guardrail viraria
 * uma fonte de falso positivo que alguém desligaria na primeira semana.
 */
export function extractNumbers(text: string): number[] {
  const found: number[] = [];

  // Sequências de dígitos com separadores opcionais de milhar e decimal.
  const pattern = /\d[\d.,]*/g;

  for (const [raw] of text.matchAll(pattern)) {
    const n = normalize(raw);
    if (n !== null) found.push(n);
  }

  return found;
}

function normalize(raw: string): number | null {
  // Tira pontuação que só encosta no número (fim de frase, por exemplo).
  const trimmed = raw.replace(/[.,]+$/, "");
  if (!trimmed) return null;

  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");

  let cleaned: string;

  if (lastComma > lastDot) {
    // Vírgula é o decimal: 1.250,50
    cleaned = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma && looksDecimal(trimmed, lastDot)) {
    // Ponto decimal em notação estrangeira: 1250.50
    cleaned = trimmed.replace(/,/g, "");
  } else {
    // Só separador de milhar, ou nenhum: 1.250 · 1,250 · 43
    cleaned = trimmed.replace(/[.,]/g, "");
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * Um ponto seguido de exatamente três dígitos é separador de milhar em pt-BR
 * (`1.250`). Qualquer outra contagem indica decimal (`1.5`, `12.75`).
 */
function looksDecimal(text: string, dotIndex: number): boolean {
  return text.length - dotIndex - 1 !== 3;
}

export interface GroundingResult {
  ok: boolean;
  /** Números presentes na arte que não constam na copy. */
  ungrounded: number[];
}

/**
 * Verifica se todo número da arte tem lastro na copy.
 *
 * @param artText   texto das zonas marcadas como `grounded` no spec
 * @param copyText  a copy publicada junto com a peça
 */
export function verifyNumbersGrounded(
  artText: string,
  copyText: string,
): GroundingResult {
  const inCopy = new Set(extractNumbers(copyText));
  const ungrounded = extractNumbers(artText).filter((n) => !inCopy.has(n));

  // Deduplica preservando a ordem: o mesmo número errado repetido na arte é
  // um problema só, e repetir na mensagem de erro atrapalha a leitura.
  return {
    ok: ungrounded.length === 0,
    ungrounded: [...new Set(ungrounded)],
  };
}
