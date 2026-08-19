/**
 * Contrato do payload de `content-strategist` — botão "gerar ideia a partir
 * deste insight" (docs/12-DETALHAMENTO-FASES.md, FASE 4, subtarefa 10).
 *
 * Módulo puro, testável no mesmo vitest do frontend.
 */
import { z } from "zod";

export const INTENTS = [
  "educacao",
  "dor",
  "case",
  "insight",
  "comercial",
] as const;

export const generateIdeaSchema = z.object({
  insight_id: z.string().uuid(),
  pillar_id: z.string().uuid(),
  intent: z.enum(INTENTS),
});

export type GenerateIdeaPayload = z.infer<typeof generateIdeaSchema>;
