/**
 * Chunking semântico de texto para a base de conhecimento (docs/05 §3):
 * ~800 tokens por chunk, ~120 de sobreposição.
 *
 * Sem tokenizer real neste projeto — aproxima token por caractere (~4
 * caracteres por token, a mesma heurística que `market-intelligence` já usa
 * para truncar fontes). "Semântico" aqui significa cortar em fronteira de
 * frase sempre que possível, não no meio de uma palavra — não é chunking
 * por embedding de sentença, que custaria uma chamada de IA por corte,
 * desproporcional ao que a FASE 5 pede. Revisitar se a qualidade de
 * recuperação mostrar que não basta.
 *
 * Módulo puro: sem Deno, sem rede.
 */

const CHARS_PER_TOKEN = 4;

export interface ChunkOptions {
  targetTokens?: number;
  overlapTokens?: number;
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const targetChars = (options.targetTokens ?? 800) * CHARS_PER_TOKEN;
  const overlapChars = (options.overlapTokens ?? 120) * CHARS_PER_TOKEN;

  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) return [];
  if (normalized.length <= targetChars) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + targetChars, normalized.length);

    if (end < normalized.length) {
      const window = normalized.slice(start, end);
      const lastSentenceBoundary = Math.max(
        window.lastIndexOf(". "),
        window.lastIndexOf("? "),
        window.lastIndexOf("! "),
      );
      if (lastSentenceBoundary > targetChars * 0.5) {
        end = start + lastSentenceBoundary + 2; // inclui a pontuação e o espaço
      } else {
        const lastSpace = window.lastIndexOf(" ");
        if (lastSpace > targetChars * 0.5) end = start + lastSpace + 1;
      }
    }

    const piece = normalized.slice(start, end).trim();
    if (piece.length > 0) chunks.push(piece);

    if (end >= normalized.length) break;
    // `Math.max(..., start + 1)` garante progresso mesmo se a sobreposição
    // configurada for maior que o próprio chunk — nunca trava num laço
    // infinito por configuração ruim.
    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
}
