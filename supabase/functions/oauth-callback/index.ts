/**
 * `oauth-callback` — recebe o retorno do LinkedIn (FASE 6, subtarefa 3).
 *
 * ## Por que esta função não usa `authenticate()`
 *
 * Ela é chamada pelo navegador vindo do LinkedIn, num GET sem cabeçalho
 * `Authorization` — não há sessão para autenticar. Quem prova a legitimidade
 * é o `state` assinado: só `oauth-start` sabe o segredo do HMAC, e o payload
 * carrega a organização e o usuário que iniciaram o fluxo. Por isso precisa
 * de `verify_jwt: false` no deploy, como `market-intelligence`, e por isso a
 * verificação da assinatura é a primeira coisa que acontece.
 *
 * ## Uso único
 *
 * `state` válido não basta: a linha correspondente em
 * `private.oauth_states` é marcada como consumida na primeira troca. Um
 * `state` reapresentado (botão "voltar", link colado de novo, replay) encontra
 * a linha já consumida e é recusado — assinatura sozinha não protegeria
 * contra reapresentação.
 *
 * ## O token nunca volta para o cliente
 *
 * A resposta é um redirect para o frontend com `?social=ok` ou
 * `?social=erro&motivo=…`. O `access_token` vai direto para
 * `private.oauth_tokens`; `social_accounts` guarda apenas o `token_ref`.
 */
import { createClient } from "@supabase/supabase-js";
import { AppError, toAppError } from "../_shared/errors.ts";
import { correlationIdFrom } from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { verifyState } from "../_shared/oauthState.ts";
import {
  exchangeCodeForToken,
  listAdminOrganizations,
} from "../_shared/linkedin.ts";

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

// Dois construtores em vez de um com parâmetro: `createClient` codifica o
// schema no tipo, então uma função só devolveria a união
// `SupabaseClient<..., "public" | "private">`, que o `deno check` recusa
// atribuir ao `SupabaseClient` padrão. Separados, cada tipo é inferido
// corretamente e o schema fica explícito na chamada.
function publicClient() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function privateClient() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "private" },
    },
  );
}

function redirectTo(appUrl: string, params: Record<string, string>): Response {
  const url = new URL("/social", appUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  });
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "oauth-callback" });
  const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8080";

  try {
    const url = new URL(request.url);
    const error = url.searchParams.get("error");
    if (error) {
      // O usuário recusou o consentimento, ou o LinkedIn recusou o app.
      // Não é falha do sistema — é resposta legítima, e vira mensagem, não
      // exceção.
      log.info("consentimento não concedido", { error });
      return redirectTo(appUrl, {
        social: "erro",
        motivo: url.searchParams.get("error_description") ?? error,
      });
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      throw new AppError("bad_request", "Callback sem `code` ou `state`");
    }

    const payload = await verifyState(state, requiredEnv("OAUTH_STATE_SECRET"));

    // Consome o nonce de forma condicional: `is null` no filtro faz o próprio
    // banco decidir quem chegou primeiro. Um replay não encontra linha.
    const privateDb = privateClient();
    const { data: stateRow, error: stateError } = await privateDb
      .from("oauth_states")
      .update({ consumed_at: new Date().toISOString() })
      .eq("nonce", payload.nonce)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("code_verifier, organization_id, user_id")
      .maybeSingle();
    if (stateError) {
      throw new AppError("internal", "Falha ao consumir o estado do OAuth", {
        cause: stateError,
      });
    }
    if (!stateRow) {
      throw new AppError(
        "conflict",
        "Este link de conexão já foi usado ou expirou — recomece a conexão",
      );
    }

    const token = await exchangeCodeForToken({
      code,
      redirectUri: requiredEnv("LINKEDIN_REDIRECT_URI"),
      clientId: requiredEnv("LINKEDIN_CLIENT_ID"),
      clientSecret: requiredEnv("LINKEDIN_CLIENT_SECRET"),
      codeVerifier: stateRow.code_verifier as string,
    });

    const organizations = await listAdminOrganizations(token.access_token);
    if (organizations.length === 0) {
      throw new AppError(
        "bad_request",
        "Nenhuma página de empresa com permissão de administrador nesta conta do LinkedIn",
      );
    }

    // Primeira página administrada. Escolher entre várias é decisão de
    // produto que a tela ainda não oferece — registrado como pendência em
    // docs/21, em vez de adivinhar aqui qual página o usuário queria.
    const organization = organizations[0];
    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null;
    const scopes = token.scope
      ? token.scope.split(/[\s,]+/).filter(Boolean)
      : [];
    const tokenRef = `linkedin:${payload.organizationId}:${organization.id}`;

    const { error: tokenError } = await privateDb.from("oauth_tokens").upsert({
      ref: tokenRef,
      organization_id: payload.organizationId,
      provider: "linkedin",
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      expires_at: expiresAt,
      scopes,
      rotated_at: new Date().toISOString(),
    }, { onConflict: "ref" });
    if (tokenError) {
      throw new AppError("internal", "Falha ao guardar o token", {
        cause: tokenError,
      });
    }

    const publicDb = publicClient();
    const { error: accountError } = await publicDb.from("social_accounts")
      .upsert({
        organization_id: payload.organizationId,
        provider: "linkedin",
        external_account_id: organization.urn,
        display_name: `LinkedIn · página ${organization.id}`,
        scopes,
        status: "connected",
        token_ref: tokenRef,
        token_expires_at: expiresAt,
        last_error: null,
        last_synced_at: new Date().toISOString(),
        connected_by: payload.userId,
      }, { onConflict: "organization_id,provider,external_account_id" });
    if (accountError) {
      throw new AppError("internal", "Falha ao registrar a conta social", {
        cause: accountError,
      });
    }

    log.info("conta social conectada", {
      organizationId: payload.organizationId,
      provider: "linkedin",
    });
    return redirectTo(appUrl, { social: "ok" });
  } catch (thrown) {
    const appError = toAppError(thrown);
    log.error("falha no callback de OAuth", appError);
    // Redirect com o motivo, não JSON: quem está do outro lado é um
    // navegador que veio do LinkedIn, e uma tela em branco com JSON de erro
    // deixaria o usuário sem saber o que aconteceu.
    return redirectTo(appUrl, { social: "erro", motivo: appError.message });
  }
});
