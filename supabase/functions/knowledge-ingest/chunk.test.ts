import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk.ts";

describe("chunkText", () => {
  it("devolve lista vazia para texto vazio ou só espaço", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("devolve um único chunk quando o texto cabe no alvo", () => {
    const result = chunkText("Texto curto que cabe inteiro.", {
      targetTokens: 100,
      overlapTokens: 10,
    });
    expect(result).toEqual(["Texto curto que cabe inteiro."]);
  });

  it("normaliza espaço em branco repetido mesmo no caso de chunk único", () => {
    const result = chunkText("linha 1\n\n\n  linha   2", {
      targetTokens: 100,
      overlapTokens: 10,
    });
    expect(result).toEqual(["linha 1 linha 2"]);
  });

  it("divide texto longo sem pontuação em múltiplos chunks, cortando em espaço", () => {
    const words = Array.from({ length: 30 }, (_, i) => `palavra${i}`);
    const text = words.join(" ");
    const result = chunkText(text, { targetTokens: 5, overlapTokens: 1 }); // 20 chars alvo, 4 de sobreposição

    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      // nenhum chunk deveria estourar muito o alvo — a busca de fronteira
      // pode devolver algo perto do limite, nunca o dobro dele
      expect(chunk.length).toBeLessThanOrEqual(30);
      // nunca corta uma palavra ao meio: cada chunk é composto de tokens
      // completos separados por espaço simples
      expect(chunk).not.toMatch(/palavra\d+palavra\d+/);
    }
  });

  it("prioriza fronteira de frase quando ela cai depois da metade da janela", () => {
    // Alvo de 40 caracteres (targetTokens 10). A primeira frase termina no
    // caractere 24 (".", depois de 22 letras) — depois da metade da janela,
    // então a fronteira de frase deve vencer a de espaço.
    const firstSentence = `${"x".repeat(22)}. `;
    const text = firstSentence + "y".repeat(60);
    const result = chunkText(text, { targetTokens: 10, overlapTokens: 2 });

    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toBe(`${"x".repeat(22)}.`);
  });

  it("produz sobreposição real entre chunks consecutivos", () => {
    const words = Array.from({ length: 40 }, (_, i) => `w${i}`);
    const text = words.join(" ");
    const result = chunkText(text, { targetTokens: 5, overlapTokens: 2 });

    expect(result.length).toBeGreaterThan(1);
    const firstTailWord = result[0].split(" ").at(-1);
    expect(firstTailWord).toBeDefined();
    expect(
      result[1].startsWith(firstTailWord!) ||
        result[1].includes(firstTailWord!),
    ).toBe(true);
  });

  it("nunca entra em laço infinito quando a sobreposição configurada é maior que o próprio chunk", () => {
    const text = "a ".repeat(200).trim();
    const result = chunkText(text, { targetTokens: 2, overlapTokens: 50 });

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(1000); // termina, não trava
  });

  it("cobre o texto inteiro — nenhuma palavra é perdida entre chunks", () => {
    const words = Array.from({ length: 25 }, (_, i) => `token${i}`);
    const text = words.join(" ");
    const result = chunkText(text, { targetTokens: 4, overlapTokens: 1 });

    const covered = new Set(result.join(" ").split(" "));
    for (const word of words) {
      expect(covered.has(word)).toBe(true);
    }
  });
});
