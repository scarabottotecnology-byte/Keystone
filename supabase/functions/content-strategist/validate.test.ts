import { describe, expect, it } from "vitest";
import { generateIdeaSchema } from "./validate.ts";

const VALID = {
  insight_id: "11111111-1111-1111-1111-111111111111",
  pillar_id: "22222222-2222-2222-2222-222222222222",
  intent: "educacao",
};

describe("generateIdeaSchema", () => {
  it("aceita payload válido", () => {
    expect(generateIdeaSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejeita insight_id que não é uuid", () => {
    expect(generateIdeaSchema.safeParse({ ...VALID, insight_id: "não-é-uuid" }).success).toBe(false);
  });

  it("rejeita pillar_id ausente", () => {
    const { pillar_id: _pillar_id, ...rest } = VALID;
    expect(generateIdeaSchema.safeParse(rest).success).toBe(false);
  });

  it("rejeita intent fora do enum", () => {
    expect(generateIdeaSchema.safeParse({ ...VALID, intent: "venda-agressiva" }).success).toBe(false);
  });

  it("aceita todas as cinco intenções", () => {
    for (const intent of ["educacao", "dor", "case", "insight", "comercial"]) {
      expect(generateIdeaSchema.safeParse({ ...VALID, intent }).success).toBe(true);
    }
  });
});
