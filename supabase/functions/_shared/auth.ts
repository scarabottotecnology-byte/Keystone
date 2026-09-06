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
 * A chave pública do projeto, sob qualquer um dos dois nomes.
 *
 * O Supabase renomeou `anon key` para `publishable key`, mas só
 * `SUPABASE_ANON_KEY` é injetada automaticamente no runtime das Edge
 * Functions — `SUPABASE_PUBLISHABLE_KEY` teria que ser cadastrada à mão no
 * painel. Exigir só o nome novo derrubava **toda** função interativa com
 * `misconfigured`: era a causa do "Failed to send a request to the Edge
 * Function" que aparecia ao gerar peça na tela. O 500 acontece antes de os
 * cabeçalhos de CORS entrarem na resposta, então o navegador reporta como
 * falha de rede em vez de mostrar o erro real do servidor — por isso o
 * sintoma não parecia com o que era.
 *
 * Isto não é o `no-masking-fallback` que o projeto proíbe: os dois nomes
 * apontam para a mesma credencial, e a ausência dos dois continua sendo erro
 * explícito. Mesma classe de interop entre runtimes já registrada em
 * `ai-gateway/validate.ts` para o `ajv`.
 */
function publishableKeyFromEnv(): string {
  const value = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY");
  if (!value) {
    throw new AppError(
      "misconfigured",
      "Variável de ambiente ausente: SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_ANON_KEY)",
    );
  }
  return value;
}

export async function authenticate(request: Request): Promise<Caller> {
  const token = bearerFrom(request);
  const url = requiredEnv("SUPABASE_URL");
  const publishableKey = publishableKeyFromEnv();

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
