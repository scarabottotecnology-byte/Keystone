import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * `VITE_BASE_PATH` existe por causa do GitHub Pages.
 *
 * Servido em `usuario.github.io/keystone/`, o app precisa saber que vive
 * abaixo de um prefixo — sem isso todo asset é buscado na raiz do domínio e
 * a página abre em branco. Em domínio próprio, ou em `npm run dev`, o valor
 * é `/` e nada muda.
 *
 * O mesmo valor alimenta o `basename` do roteador em `App.tsx`: os dois
 * precisam concordar, senão os assets carregam e as rotas não.
 */
const basePath = process.env.VITE_BASE_PATH ?? "/";

// https://vitejs.dev/config/
export default defineConfig({
  base: basePath,
  server: {
    // IPv4 explícito: o contêiner de desenvolvimento não suporta bind em `::`.
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
