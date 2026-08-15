import { describe, expect, it } from "vitest";
import { estimateCostUsd } from "./pricing.ts";

describe("estimateCostUsd", () => {
  it("calcula custo a partir de tokens de entrada e saída", () => {
    const cost = estimateCostUsd(1_000_000, 1_000_000, {
      input_per_million: 3,
      output_per_million: 15,
    });
    expect(cost).toBe(18);
  });

  it("calcula proporcionalmente para contagens menores", () => {
    const cost = estimateCostUsd(500_000, 0, { input_per_million: 3, output_per_million: 15 });
    expect(cost).toBe(1.5);
  });

  it("devolve null quando o preço não está configurado — nunca 0", () => {
    expect(estimateCostUsd(1000, 1000, undefined)).toBeNull();
    expect(estimateCostUsd(1000, 1000, null)).toBeNull();
  });

  it("zero token com preço configurado é 0 de verdade, não confundido com 'sem preço'", () => {
    expect(estimateCostUsd(0, 0, { input_per_million: 3, output_per_million: 15 })).toBe(0);
  });

  it("arredonda em 6 casas decimais, mesma precisão da coluna numeric(12,6)", () => {
    const cost = estimateCostUsd(1, 1, { input_per_million: 3, output_per_million: 15 });
    // (1/1e6)*3 + (1/1e6)*15 = 0.000018
    expect(cost).toBe(0.000018);
  });
});
