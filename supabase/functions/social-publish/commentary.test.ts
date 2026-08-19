import { describe, expect, it } from "vitest";
import { composeCommentary } from "./commentary.ts";

describe("composeCommentary", () => {
  it("junta hook, corpo, CTA e hashtags em blocos separados", () => {
    const text = composeCommentary({
      hook: "Seu orçamento morre em março.",
      body: "Todo ano a mesma coisa.",
      cta: "Comente se já viveu isso.",
      hashtags: ["controladoria", "fpa"],
    });
    expect(text).toBe(
      "Seu orçamento morre em março.\n\nTodo ano a mesma coisa.\n\nComente se já viveu isso.\n\n#controladoria #fpa",
    );
  });

  it("ignora campos vazios sem deixar linha em branco sobrando", () => {
    expect(composeCommentary({ hook: "Só o hook." })).toBe("Só o hook.");
    expect(composeCommentary({ body: "Só o corpo.", cta: "  " })).toBe(
      "Só o corpo.",
    );
  });

  it("não duplica o hook quando o corpo já começa com ele", () => {
    const text = composeCommentary({
      hook: "Seu orçamento morre em março.",
      body: "Seu orçamento morre em março. E ninguém percebe.",
    });
    expect(text).toBe("Seu orçamento morre em março.\n\nE ninguém percebe.");
  });

  it("não duplica quando corpo e hook são idênticos", () => {
    const text = composeCommentary({ hook: "Igual.", body: "Igual." });
    expect(text).toBe("Igual.");
  });

  it("normaliza hashtags: remove # extra e descarta vazias", () => {
    const text = composeCommentary({
      body: "corpo",
      hashtags: ["##custos", "  ", "pricing"],
    });
    expect(text).toBe("corpo\n\n#custos #pricing");
  });

  it("é determinística — duas chamadas com a mesma peça dão a mesma string", () => {
    // O tratamento de timeout procura o post pelo texto publicado; se esta
    // função não fosse determinística, a verificação não acharia o próprio
    // post e o job iria para revisão humana sem motivo.
    const asset = {
      hook: "h",
      body: "b",
      cta: "c",
      hashtags: ["x", "y"],
    };
    expect(composeCommentary(asset)).toBe(composeCommentary(asset));
  });

  it("corta em 3000 caracteres sinalizando o corte, sem estourar o limite", () => {
    const text = composeCommentary({ body: "a".repeat(5000) });
    expect(text.length).toBe(3000);
    expect(text.endsWith("…")).toBe(true);
  });

  it("não corta texto que cabe exatamente no limite", () => {
    const text = composeCommentary({ body: "a".repeat(3000) });
    expect(text.length).toBe(3000);
    expect(text.endsWith("…")).toBe(false);
  });

  it("devolve string vazia para peça sem nenhum campo publicável", () => {
    expect(composeCommentary({})).toBe("");
  });
});
