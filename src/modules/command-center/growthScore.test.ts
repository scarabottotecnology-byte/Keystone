import { describe, expect, it } from "vitest";
import { computeGrowthScore, type GrowthScoreComponentInput } from "./growthScore";

const FULL_WEIGHTS = {
  content: 15,
  leads: 15,
  prospecting: 15,
  pipeline: 20,
  conversion: 15,
  revenue: 20,
} as const;

function component(
  key: keyof typeof FULL_WEIGHTS,
  raw: number | null,
  baseline: number | null,
): GrowthScoreComponentInput {
  return { key, weight: FULL_WEIGHTS[key], raw, baseline };
}

describe("computeGrowthScore", () => {
  it("normaliza a 100 quando o bruto alcança exatamente a meta", () => {
    const result = computeGrowthScore([component("leads", 50, 50)]);
    expect(result.components[0].normalized).toBe(100);
    expect(result.components[0].available).toBe(true);
  });

  it("normaliza proporcionalmente abaixo da meta", () => {
    const result = computeGrowthScore([component("leads", 25, 50)]);
    expect(result.components[0].normalized).toBe(50);
  });

  it("satura em 100 quando o bruto ultrapassa a meta — não em 150", () => {
    const result = computeGrowthScore([component("revenue", 300, 200)]);
    expect(result.components[0].normalized).toBe(100);
  });

  it("componente sem dado bruto fica indisponível, não vira zero", () => {
    const result = computeGrowthScore([component("content", null, 100)]);
    expect(result.components[0]).toEqual({
      key: "content",
      weight: 15,
      normalized: null,
      available: false,
    });
  });

  it("componente sem meta configurada fica indisponível, não vira zero", () => {
    const result = computeGrowthScore([component("content", 80, null)]);
    expect(result.components[0].available).toBe(false);
    expect(result.components[0].normalized).toBeNull();
  });

  it("meta zero ou negativa é tratada como indisponível, não como divisão por zero", () => {
    expect(computeGrowthScore([component("pipeline", 10, 0)]).components[0].available).toBe(false);
    expect(computeGrowthScore([component("pipeline", 10, -5)]).components[0].available).toBe(false);
  });

  it("total é null quando um único componente, entre seis, está indisponível", () => {
    const result = computeGrowthScore([
      component("content", 100, 100),
      component("leads", 100, 100),
      component("prospecting", 100, 100),
      component("pipeline", 100, 100),
      component("conversion", 100, 100),
      component("revenue", null, 100), // FASE 17 ainda não chegou
    ]);
    expect(result.totalScore).toBeNull();
    // Mas os cinco componentes com dado continuam mostrando o próprio valor —
    // a ausência de um não apaga os outros.
    expect(result.components[0].normalized).toBe(100);
  });

  it("total pondera pelo peso quando todos os seis componentes têm dado", () => {
    const result = computeGrowthScore([
      component("content", 100, 100), // normalizado 100, peso 15
      component("leads", 50, 100), // normalizado 50, peso 15
      component("prospecting", 100, 100), // 100, peso 15
      component("pipeline", 0, 100), // 0, peso 20
      component("conversion", 100, 100), // 100, peso 15
      component("revenue", 50, 100), // 50, peso 20
    ]);
    // (100*15 + 50*15 + 100*15 + 0*20 + 100*15 + 50*20) / 100 = 62.5
    expect(result.totalScore).toBe(62.5);
  });

  it("lista vazia não quebra e não produz score fabricado", () => {
    const result = computeGrowthScore([]);
    expect(result.components).toEqual([]);
    expect(result.totalScore).toBeNull();
  });

  it("soma de pesos diferente de 100 ainda pondera corretamente", () => {
    const result = computeGrowthScore([
      { key: "a", weight: 30, raw: 100, baseline: 100 },
      { key: "b", weight: 10, raw: 0, baseline: 100 },
    ]);
    // (100*30 + 0*10) / 40 = 75
    expect(result.totalScore).toBe(75);
  });
});
