import { describe, expect, it } from "vitest";
import { ingestSchema } from "./validate.ts";

describe("ingestSchema", () => {
  it("aceita manual com content", () => {
    const result = ingestSchema.safeParse({ title: "Nota", source_type: "manual", content: "texto" });
    expect(result.success).toBe(true);
  });

  it("aceita url com source_url", () => {
    const result = ingestSchema.safeParse({
      title: "Artigo",
      source_type: "url",
      source_url: "https://exemplo.com/artigo",
    });
    expect(result.success).toBe(true);
  });

  it("recusa manual sem content", () => {
    const result = ingestSchema.safeParse({ title: "Nota", source_type: "manual" });
    expect(result.success).toBe(false);
  });

  it("recusa url sem source_url", () => {
    const result = ingestSchema.safeParse({ title: "Artigo", source_type: "url" });
    expect(result.success).toBe(false);
  });

  it("recusa source_url malformado", () => {
    const result = ingestSchema.safeParse({ title: "Artigo", source_type: "url", source_url: "não é url" });
    expect(result.success).toBe(false);
  });

  it("recusa title vazio", () => {
    const result = ingestSchema.safeParse({ title: "  ", source_type: "manual", content: "texto" });
    expect(result.success).toBe(false);
  });

  it("aceita pdf/pptx/docx no contrato — a recusa é responsabilidade do handler, não do schema", () => {
    const result = ingestSchema.safeParse({ title: "Doc", source_type: "pdf" });
    expect(result.success).toBe(true);
  });
});
