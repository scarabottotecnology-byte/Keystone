/**
 * Contrato do payload de `knowledge-ingest`.
 *
 * `source_type` aceita os cinco valores reais da coluna (docs/02 §4.2:
 * "pdf | pptx | docx | url | manual") — o schema não esconde o vocabulário
 * completo da tabela só porque esta implementação cobre dois deles. A
 * Edge Function recusa `pdf`/`pptx`/`docx` explicitamente, depois da
 * validação, não aqui: é uma decisão de escopo do handler, não do contrato
 * do payload.
 *
 * Módulo puro, testável no mesmo vitest do frontend.
 */
import { z } from "zod";

export const SOURCE_TYPES = ["manual", "url", "pdf", "pptx", "docx"] as const;

export const ingestSchema = z
  .object({
    title: z.string().trim().min(1, "title é obrigatório").max(300),
    source_type: z.enum(SOURCE_TYPES),
    content: z.string().trim().min(1).optional(),
    source_url: z.string().url().optional(),
  })
  .refine((v) => v.source_type !== "manual" || !!v.content, {
    message: "source_type 'manual' exige 'content'",
    path: ["content"],
  })
  .refine((v) => v.source_type !== "url" || !!v.source_url, {
    message: "source_type 'url' exige 'source_url'",
    path: ["source_url"],
  });

export type IngestPayload = z.infer<typeof ingestSchema>;
