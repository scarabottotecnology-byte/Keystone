/**
 * Autenticação e resolução de organização.
 *
 * ## O que a RLS não faz sozinha
 *
 * A RLS decide o que cada linha deixa ver, mas a Edge Function precisa saber
 * **antes** por quem ela está agindo: para escolher os templates certos, gravar
 * no bucket certo e escrever o `organization_id` correto ao inserir.
 *
 * ## A regra que este módulo existe para impedir
 *
 * A `service_role` ignora RLS. Uma Edge Function que a usa para "simplificar"
 * vira uma porta que atende qualquer requisição com acesso total ao banco — a
 * mesma classe de falha do achado C-01, com outro nome.
 *
 * Por isso o cliente aqui é criado **com o JWT de quem chamou**. A RLS continua
 * valendo dentro da função, e o pior caso de um bug é o usuário ver o que ele
 * já poderia ver.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./errors.ts";

export interface Caller {
  userId: string;
  email?: string;
  /** Organizações ativas do usuário. Hoje sempre uma; a lista evita caso especial. */
  organizationIds: string[];
  /** A organização em que a requisição opera. */
  organizationId: string;
  /** Cliente com o JWT do chamador — sujeito à RLS. */
  db: SupabaseClient;
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new AppError(
      "misconfigured",
      `Variável de ambiente ausente: ${name}`,
    );
  }
  return value;
}

function bearerFrom(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AppError(
      "unauthorized",
      "Cabeçalho Authorization ausente ou malformado",
    );
  }
  return token;
}

/**
 * Identifica quem está chamando e em nome de qual organização.
 *
 * Lança `unauthorized` se o token não for válido, e `forbidden` se o usuário
 * for válido mas não tiver vínculo ativo com organização nenhuma — são
 * situações diferentes e merecem respostas diferentes.
 *
 * ⚠️ Depende da tabela `memberships`, que nasce na FASE 2. Até lá este módulo
 * não tem como ser exercido de ponta a ponta.
 */
export async function authenticate(request: Request): Promise<Caller> {
  const token = bearerFrom(request);
  const url = requiredEnv("SUPABASE_URL");
  const publishableKey = requiredEnv("SUPABASE_PUBLISHABLE_KEY");

  const db = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) {
    throw new AppError("unauthorized", "Token inválido ou expirado", {
      cause: error,
    });
  }

  // A consulta passa pela RLS de `memberships`: o usuário só enxerga os
  // próprios vínculos. Não há filtro por `user_id` aqui de propósito — filtrar
  // no cliente daria a impressão de que é o filtro que protege.
  const { data: memberships, error: membershipError } = await db
    .from("memberships")
    .select("organization_id")
    .eq("status", "active");

  if (membershipError) {
    throw new AppError("internal", "Falha ao resolver organização", {
      cause: membershipError,
    });
  }

  const organizationIds = (memberships ?? []).map((m) => m.organization_id);
  if (organizationIds.length === 0) {
    throw new AppError(
      "forbidden",
      "Usuário sem vínculo ativo com nenhuma organização",
    );
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    organizationIds,
    organizationId: organizationIds[0],
    db,
  };
}
