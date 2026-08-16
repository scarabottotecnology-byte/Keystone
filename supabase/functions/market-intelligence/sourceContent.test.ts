import { describe, expect, it } from "vitest";
import { extractPlainText, truncate } from "./sourceContent.ts";

describe("extractPlainText", () => {
  it("remove tags HTML", () => {
    expect(extractPlainText("<p>Olá <b>mundo</b></p>")).toBe("Olá mundo");
  });

  it("remove script e style inteiros, não só as tags", () => {
    const html = "<style>.x{color:red}</style><script>alert(1)</script><p>texto</p>";
    expect(extractPlainText(html)).toBe("texto");
  });

  it("decodifica entidades comuns", () => {
    expect(extractPlainText("A &amp; B &lt;tag&gt; &quot;citado&quot;")).toBe('A & B <tag> "citado"');
  });

  it("normaliza espaço em branco repetido", () => {
    expect(extractPlainText("linha 1\n\n\n  linha   2")).toBe("linha 1 linha 2");
  });
});

describe("truncate", () => {
  it("não altera texto dentro do limite", () => {
    expect(truncate("curto", 100)).toBe("curto");
  });

  it("corta e sinaliza corte com reticências", () => {
    const result = truncate("0123456789", 5);
    expect(result).toBe("01234…");
  });
});
