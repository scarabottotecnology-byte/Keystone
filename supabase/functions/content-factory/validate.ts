/**
 * Contrato do payload de `content-factory` — botão "gerar peça a partir
 * desta ideia" (docs/12-DETALHAMENTO-FASES.md, FASE 5).
 *
 * Módulo puro, testável no mesmo vitest do frontend.
 */
import { z } from "zod";

export const generatePieceSchema = z.object({
  idea_id: z.string().uuid(),
  format_id: z.string().uuid(),
});

export type GeneratePiecePayload = z.infer<typeof generatePieceSchema>;
