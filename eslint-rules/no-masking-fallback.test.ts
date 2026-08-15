import { RuleTester } from "eslint";
import { describe, it } from "vitest";
// @ts-expect-error — regra em JS puro, sem tipos.
import { noMaskingFallback } from "./no-masking-fallback.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

describe("keystone-data/no-masking-fallback", () => {
  it("barra fallback que mascara dado ausente e aceita o resto", () => {
    ruleTester.run("no-masking-fallback", noMaskingFallback, {
      valid: [
        { name: "??  em vez de ||", code: `const x = saldo ?? 0;` },
        { name: "|| com fallback não-literal", code: `const x = a || b;` },
        { name: "|| com literal não-mascarante", code: `const x = pageSize || 20;` },
        { name: "|| encadeando condição booleana", code: `if (a || b) {}` },
        { name: "|| com string não-vazia", code: `const x = nome || "Sem nome";` },
        { name: "&& não é afetado", code: `const x = a && 0;` },
      ],

      invalid: [
        {
          name: "número — o caso que motiva a regra",
          code: `const total = pedido.valor || 0;`,
          errors: [{ messageId: "maskingFallback" }],
        },
        {
          name: "string vazia",
          code: `const nome = perfil.nome || "";`,
          errors: [{ messageId: "maskingFallback" }],
        },
        {
          name: "booleano",
          code: `const ativo = registro.ativo || false;`,
          errors: [{ messageId: "maskingFallback" }],
        },
        {
          name: "dentro de JSX",
          code: `const el = <span>{item.count || 0}</span>;`,
          languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
          errors: [{ messageId: "maskingFallback" }],
        },
      ],
    });
  });
});
