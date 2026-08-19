import { describe, expect, it } from "vitest";
import { renderTemplate } from "./template.ts";

describe("renderTemplate", () => {
  it("substitui uma variável simples", () => {
    expect(renderTemplate("Olá, {{nome}}!", { nome: "Keystone" })).toBe(
      "Olá, Keystone!",
    );
  });

  it("substitui a mesma variável repetida", () => {
    expect(renderTemplate("{{x}} e {{x}}", { x: "a" })).toBe("a e a");
  });

  it("serializa valor não-string como JSON", () => {
    expect(renderTemplate("dados: {{lista}}", { lista: [1, 2, 3] })).toBe(
      "dados: [1,2,3]",
    );
  });

  it("lança erro para variável ausente, em vez de deixar o literal passar", () => {
    expect(() => renderTemplate("{{ausente}}", {})).toThrow(/ausente/);
  });

  it("template sem placeholder não muda", () => {
    expect(renderTemplate("texto fixo", { qualquer: 1 })).toBe("texto fixo");
  });

  it("aceita string vazia como valor válido", () => {
    expect(renderTemplate("[{{vazio}}]", { vazio: "" })).toBe("[]");
  });
});
