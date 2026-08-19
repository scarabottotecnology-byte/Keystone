/**
 * Limpeza de conteúdo bruto de fonte (HTML/RSS) para texto plano.
 *
 * Não é um parser de RSS/HTML de verdade — não há biblioteca de XML/DOM
 * neste projeto ainda, e trazer uma só para isto seria desproporcional ao
 * que a FASE 4 pede. É uma limpeza pragmática: remove tag, decodifica
 * entidade comum, normaliza espaço. Produz texto bom o bastante para o
 * agente A1 ler e para a ingestão de conhecimento indexar — não um
 * documento estruturado. Revisitar se a qualidade mostrar que não basta (o
 * mesmo raciocínio de "prompt versionado, avaliável e substituível" vale
 * para este pré-processamento).
 *
 * Movido de `market-intelligence/sourceContent.ts` para `_shared` na FASE 5,
 * subtarefa 3: `knowledge-ingest` (ingestão de URL) precisa exatamente da
 * mesma limpeza que A1 já usava — duplicar o módulo seria manter duas cópias
 * do mesmo comportamento.
 *
 * Módulo puro: sem Deno, sem rede.
 */

export function extractPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Corta em `maxChars`, sem partir no meio de forma a esconder que cortou. */
export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}
