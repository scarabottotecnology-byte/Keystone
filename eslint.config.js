import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import keystone from "./eslint-rules/no-cross-module-import.js";
import keystoneData from "./eslint-rules/no-masking-fallback.js";

export default tseslint.config(
  // As Edge Functions rodam em Deno: globais diferentes, importação por
  // especificador `npm:` e resolução por mapa próprio. Passá-las por este
  // ESLint, configurado para o navegador, só produziria ruído. Elas têm o
  // `deno lint` do `supabase/functions/deno.json`.
  { ignores: ["dist", "supabase/functions/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // ── Fronteira entre módulos ───────────────────────────────────────────────
  //
  // Regra própria; o porquê está no cabeçalho de
  // `eslint-rules/no-cross-module-import.js`.
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    plugins: { keystone },
    rules: {
      "keystone/no-cross-module-import": "error",
    },
  },

  // ── Fallback que mascara dado ausente ─────────────────────────────────────
  //
  // O porquê está no cabeçalho de `eslint-rules/no-masking-fallback.js`.
  // Vale para todo o frontend, não só `modules/` — a tela de configurações e a
  // shell de navegação exibem dado real tanto quanto qualquer módulo.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "keystone-data": keystoneData },
    rules: {
      "keystone-data/no-masking-fallback": "error",
    },
  },
);
