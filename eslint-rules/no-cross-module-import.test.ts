import { RuleTester } from "eslint";
import { describe, it } from "vitest";
// @ts-expect-error — regra em JS puro, sem tipos.
import { noCrossModuleImport } from "./no-cross-module-import.js";

/**
 * A fronteira entre módulos é convenção que só vale se falhar o build. Estes
 * testes existem para que ela continue falhando — uma regra de lint quebrada
 * silenciosamente é pior que nenhuma, porque dá a impressão de proteção.
 */

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const CWD = process.cwd();
const inModule = (name: string, file = "index.ts") =>
  `${CWD}/src/modules/${name}/${file}`;

describe("keystone/no-cross-module-import", () => {
  it("aceita import legítimo e barra travessia de fronteira", () => {
    ruleTester.run("no-cross-module-import", noCrossModuleImport, {
      valid: [
        {
          name: "arquivo do próprio módulo, caminho relativo",
          code: `import { a } from "./local";`,
          filename: inModule("content"),
        },
        {
          name: "subdiretório do próprio módulo, subindo um nível",
          code: `import { a } from "../lib/format";`,
          filename: inModule("content", "pages/Editor.tsx"),
        },
        {
          name: "o próprio módulo pelo alias",
          code: `import { a } from "@/modules/content/lib/format";`,
          filename: inModule("content", "pages/Editor.tsx"),
        },
        {
          name: "código compartilhado",
          code: `import { cn } from "@/lib/utils";`,
          filename: inModule("content"),
        },
        {
          name: "componente de UI",
          code: `import { Button } from "@/components/ui/button";`,
          filename: inModule("content"),
        },
        {
          name: "pacote externo",
          code: `import React from "react";`,
          filename: inModule("content"),
        },
        {
          name: "arquivo fora de modules pode importar qualquer módulo",
          code: `import { Page } from "@/modules/content/pages/Editor";`,
          filename: `${CWD}/src/app/routes.ts`,
        },
      ],

      invalid: [
        {
          name: "alias para outro módulo",
          code: `import { x } from "@/modules/social/lib/publish";`,
          filename: inModule("content"),
          errors: [{ messageId: "crossModule" }],
        },
        {
          name: "caminho relativo para módulo irmão — o caso que motiva a regra",
          code: `import { x } from "../social/lib/publish";`,
          filename: inModule("content"),
          errors: [{ messageId: "crossModule" }],
        },
        {
          name: "caminho relativo subindo dois níveis",
          code: `import { x } from "../../social/lib/publish";`,
          filename: inModule("content", "pages/Editor.tsx"),
          errors: [{ messageId: "crossModule" }],
        },
        {
          name: "re-export de outro módulo",
          code: `export { x } from "@/modules/social/lib/publish";`,
          filename: inModule("content"),
          errors: [{ messageId: "crossModule" }],
        },
        {
          name: "export * de outro módulo",
          code: `export * from "../social/types";`,
          filename: inModule("content"),
          errors: [{ messageId: "crossModule" }],
        },
        {
          name: "import dinâmico de outro módulo",
          code: `const m = await import("@/modules/social/lib/publish");`,
          filename: inModule("content"),
          errors: [{ messageId: "crossModule" }],
        },
      ],
    });
  });
});
