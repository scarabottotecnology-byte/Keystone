/**
 * `oauth-start` — inicia a conexão de uma conta social (FASE 6, subtarefa 3).
 *
 * Interativa e restrita a admin: conectar uma conta é administração de
 * organização, a mesma regra que `social_accounts.admin_insert` impõe no
 * banco. A checagem explícita aqui evita levar o usuário até o LinkedIn para
 * só então descobrir, no callback, que ele não podia.
 *
 * Devolve a URL de autorização em JSON em vez de responder 302. O frontend
 * chama esta função com `supabase.functions.invoke`, que segue redirect
 * sozinho via `fetch` — um 302 aqui levaria o navegador a buscar a página do
 * LinkedIn por XHR, não a navegar até ela. Quem navega é o frontend, com a
 * URL que esta função devolve.
 */
import { createClient } from "@supabase/supabase-js";
import { authenticate } from "../_shared/auth.ts";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { createPkcePair, newNonce, signState } from "../_shared/oauthState.ts";
import { LINKEDIN_AUTHORIZE_URL } from "../_shared/linkedin.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-correlation-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Curto de propósito: é o tempo de atravessar uma tela de consentimento. */
const STATE_TTL_SECONDS = 600;

const LINKEDIN_SCOPES = [
  "r_organization_social",
  "w_organization_social",
  "rw_organization_admin",
];

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

// Sem anotação de retorno: `createClient` codifica o schema no tipo, e
// declarar `SupabaseClient` (que assume `public`) faria o `deno check`
// recusar a variante `private`.
function serviceRoleClient() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "private" },
    },
  );
}

function jsonResponse(
  body: unknown,
  status: number,
  correlationId: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      [CORRELATION_HEADER]: correlationId,
    },
  });
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "oauth-start" });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (request.method !== "POST") {
      throw new AppError("bad_request", "Método não suportado — use POST");
    }

    const caller = await authenticate(request);

    const { data: membership, error: membershipError } = await caller.db
      .from("memberships")
      .select("role")
      .eq("organization_id", caller.organizationId)
      .eq("user_id", caller.userId)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) {
      throw new AppError(
        "internal",
        "Falha ao verificar papel do requisitante",
        { cause: membershipError },
      );
    }
    const role = membership?.role;
    if (!role || !["owner", "admin"].includes(role)) {
      throw new AppError(
        "forbidden",
        "Só owner ou admin pode conectar uma conta social",
      );
    }

    const clientId = requiredEnv("LINKEDIN_CLIENT_ID");
    const redirectUri = requiredEnv("LINKEDIN_REDIRECT_URI");
    const stateSecret = requiredEnv("OAUTH_STATE_SECRET");

    const nonce = newNonce();
    const { verifier, challenge } = await createPkcePair();

    const state = await signState({
      nonce,
      organizationId: caller.organizationId,
      userId: caller.userId,
      provider: "linkedin",
      exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
    }, stateSecret);

    // O verifier fica no schema `private`, nunca na URL — ver a nota em
    // `_shared/oauthState.ts` sobre por que embutir no state anularia o PKCE.
    const privateDb = serviceRoleClient();
    const { error: stateError } = await privateDb.from("oauth_states").insert({
      nonce,
      organization_id: caller.organizationId,
      user_id: caller.userId,
      provider: "linkedin",
      code_verifier: verifier,
      expires_at: new Date(Date.now() + STATE_TTL_SECONDS * 1000)
        .toISOString(),
    });
    if (stateError) {
      throw new AppError("internal", "Falha ao registrar o estado do OAuth", {
        cause: stateError,
      });
    }

    const authorizeUrl = new URL(LINKEDIN_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("scope", LINKEDIN_SCOPES.join(" "));
    authorizeUrl.searchParams.set("code_challenge", challenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");

    log.info("fluxo OAuth iniciado", {
      organizationId: caller.organizationId,
      provider: "linkedin",
    });

    return jsonResponse(
      { authorize_url: authorizeUrl.toString() },
      200,
      correlationId,
    );
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha ao iniciar OAuth", error);
    return jsonResponse(
      error.toResponseBody(),
      error.httpStatus,
      correlationId,
    );
  }
});
