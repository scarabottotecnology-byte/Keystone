import { describe, expect, it } from "vitest";
import { validateOutput } from "./validate.ts";

const INSIGHT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    relevance: { type: "integer", minimum: 0, maximum: 100 },
  },
  required: ["title", "relevance"],
  additionalProperties: false,
};

describe("validateOutput", () => {
  it("aceita dado que casa com o schema", () => {
    const result = validateOutput(INSIGHT_SCHEMA, { title: "x", relevance: 80 });
    expect(result.valid).toBe(true);
  });

  it("rejeita campo obrigatório ausente", () => {
    const result = validateOutput(INSIGHT_SCHEMA, { title: "x" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/relevance/);
  });

  it("rejeita tipo errado", () => {
    const result = validateOutput(INSIGHT_SCHEMA, { title: "x", relevance: "alta" });
    expect(result.valid).toBe(false);
  });

  it("rejeita valor fora do intervalo declarado", () => {
    const result = validateOutput(INSIGHT_SCHEMA, { title: "x", relevance: 150 });
    expect(result.valid).toBe(false);
  });

  it("rejeita propriedade extra quando additionalProperties é false", () => {
    const result = validateOutput(INSIGHT_SCHEMA, { title: "x", relevance: 10, extra: 1 });
    expect(result.valid).toBe(false);
  });

  it("junta múltiplos erros numa mensagem só", () => {
    const result = validateOutput(INSIGHT_SCHEMA, {});
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toMatch(/title/);
      expect(result.message).toMatch(/relevance/);
    }
  });
});
