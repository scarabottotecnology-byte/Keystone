import { describe, expect, it } from "vitest";
import {
  collectGroundedOn,
  formatRagContext,
  formatStructureForCopy,
} from "./ragContext.ts";
import type { MatchedChunk, StructureSection } from "./ragContext.ts";

const CHUNKS: MatchedChunk[] = [
  {
    chunk_id: "c1",
    document_id: "d1",
    document_title: "Case ORBITA",
    content: "Trecho sobre ORBITA.",
  },
  {
    chunk_id: "c2",
    document_id: "d1",
    document_title: "Case ORBITA",
    content: "Outro trecho.",
  },
];

describe("formatRagContext", () => {
  it("devolve mensagem explícita quando não há chunk nenhum", () => {
    expect(formatRagContext([])).toBe(
      "(sem contexto de conhecimento disponível)",
    );
  });

  it("formata cada chunk com id e título do documento", () => {
    const result = formatRagContext(CHUNKS);
    expect(result).toContain("[c1] (Case ORBITA): Trecho sobre ORBITA.");
    expect(result).toContain("[c2] (Case ORBITA): Outro trecho.");
  });
});

describe("collectGroundedOn", () => {
  it("devolve lista vazia quando nenhuma seção cita contexto", () => {
    const sections: StructureSection[] = [
      { title: "A", purpose: "p", key_point: "k", grounded_on: [] },
    ];
    expect(collectGroundedOn(sections, CHUNKS)).toEqual([]);
  });

  it("resolve chunk_id citado para document_id/document_title reais", () => {
    const sections: StructureSection[] = [
      { title: "A", purpose: "p", key_point: "k", grounded_on: ["c1"] },
    ];
    expect(collectGroundedOn(sections, CHUNKS)).toEqual([
      { chunk_id: "c1", document_id: "d1", document_title: "Case ORBITA" },
    ]);
  });

  it("não duplica um chunk_id citado por mais de uma seção", () => {
    const sections: StructureSection[] = [
      { title: "A", purpose: "p", key_point: "k", grounded_on: ["c1"] },
      { title: "B", purpose: "p", key_point: "k", grounded_on: ["c1", "c2"] },
    ];
    const result = collectGroundedOn(sections, CHUNKS);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.chunk_id).sort()).toEqual(["c1", "c2"]);
  });

  it("preserva um chunk_id citado que não bate com nenhum chunk recuperado, com campos nulos", () => {
    const sections: StructureSection[] = [
      { title: "A", purpose: "p", key_point: "k", grounded_on: ["inventado"] },
    ];
    expect(collectGroundedOn(sections, CHUNKS)).toEqual([
      { chunk_id: "inventado", document_id: null, document_title: null },
    ]);
  });
});

describe("formatStructureForCopy", () => {
  it("serializa cada seção em uma linha legível", () => {
    const sections: StructureSection[] = [
      {
        title: "Abertura",
        purpose: "prender atenção",
        key_point: "dor real",
        grounded_on: [],
      },
      {
        title: "Fecho",
        purpose: "converter",
        key_point: "CTA claro",
        grounded_on: [],
      },
    ];
    expect(formatStructureForCopy(sections)).toBe(
      "Abertura: prender atenção — dor real\nFecho: converter — CTA claro",
    );
  });
});
