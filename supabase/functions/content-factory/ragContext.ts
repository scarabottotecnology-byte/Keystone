/**
 * Formatação pura do contexto de RAG usado pelo pipeline de A3.
 *
 * Separado do `index.ts` (que fala com Deno/rede/banco) para ser testável
 * no vitest — a lógica de "como formatar o contexto" e "como consolidar
 * `grounded_on`" é exatamente o tipo de regra que vale testar isolada, sem
 * precisar simular `fetch` ou um cliente Supabase.
 *
 * Módulo puro: sem Deno, sem rede.
 */

export interface MatchedChunk {
  chunk_id: string;
  document_id: string;
  document_title: string;
  content: string;
}

export interface StructureSection {
  title: string;
  purpose: string;
  key_point: string;
  grounded_on: string[];
}

const EMPTY_CONTEXT_MESSAGE = "(sem contexto de conhecimento disponível)";

/**
 * Texto que vai para `{{rag_context}}` no prompt de `content_factory.
 * structure`. Contexto vazio é um estado válido e esperado (docs/05 §3:
 * "recuperação vazia... nunca uma resposta plausível inventada") — a
 * mensagem explícita, não uma string vazia, é o que deixa o modelo tratar a
 * ausência como ausência, e não como "esqueceram de preencher".
 */
export function formatRagContext(chunks: MatchedChunk[]): string {
  if (chunks.length === 0) return EMPTY_CONTEXT_MESSAGE;
  return chunks.map((c) => `[${c.chunk_id}] (${c.document_title}): ${c.content}`).join("\n\n");
}

export interface GroundedReference {
  chunk_id: string;
  document_id: string | null;
  document_title: string | null;
}

/**
 * Consolida `grounded_on` de todas as seções da estrutura em uma lista
 * única, sem repetição, para gravar em `content_assets.grounded_on`.
 *
 * Um `chunk_id` citado pelo modelo que não bate com nenhum chunk
 * efetivamente recuperado (alucinação de ID, ou o modelo inventando uma
 * citação) vira uma referência com `document_id`/`document_title` nulos —
 * nunca descartada em silêncio, porque isso esconderia exatamente o tipo de
 * inconsistência que este campo existe para expor.
 */
export function collectGroundedOn(
  sections: StructureSection[],
  chunks: MatchedChunk[],
): GroundedReference[] {
  const lookup = new Map(chunks.map((c) => [c.chunk_id, c]));
  const seen = new Set<string>();
  const result: GroundedReference[] = [];

  for (const section of sections) {
    for (const chunkId of section.grounded_on ?? []) {
      if (seen.has(chunkId)) continue;
      seen.add(chunkId);
      const match = lookup.get(chunkId);
      result.push({
        chunk_id: chunkId,
        document_id: match?.document_id ?? null,
        document_title: match?.document_title ?? null,
      });
    }
  }

  return result;
}

/** Serializa a estrutura em texto legível para a etapa `copy`. */
export function formatStructureForCopy(sections: StructureSection[]): string {
  return sections.map((s) => `${s.title}: ${s.purpose} — ${s.key_point}`).join("\n");
}
