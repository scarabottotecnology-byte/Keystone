import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente Supabase do navegador.
 *
 * Só a chave *publishable* entra aqui. A `service_role` nunca — ela vive no
 * cofre de segredos das Edge Functions, jamais em variável `VITE_`, porque
 * tudo que o Vite prefixa com `VITE_` vai para dentro do bundle e é público.
 * (Invariante I-1 do documento 01.)
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Falhar aqui, na carga, e não numa requisição qualquer lá na frente. Sem esta
// checagem o `createClient` aceita `undefined` e o erro só aparece depois, como
// um "Failed to fetch" sem causa aparente.
if (!url || !publishableKey) {
  throw new Error(
    "Supabase não configurado: defina VITE_SUPABASE_URL e " +
      "VITE_SUPABASE_PUBLISHABLE_KEY. Copie .env.example para .env.",
  );
}

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
