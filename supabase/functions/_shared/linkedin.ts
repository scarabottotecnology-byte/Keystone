/**
 * Cliente da API do LinkedIn.
 *
 * A API é versionada por data e muda com frequência — o documento 01 não
 * fixou nenhum caminho de propósito, e a subtarefa 4 da FASE 6 manda
 * consultar a documentação oficial no momento da implementação. Consultado
 * em agosto de 2026:
 *
 *   - Publicação: `POST https://api.linkedin.com/rest/posts`
 *   - Cabeçalhos obrigatórios: `LinkedIn-Version: YYYYMM` e
 *     `X-Restli-Protocol-Version: 2.0.0`
 *   - Autor de página: `urn:li:organization:{id}`, escopo
 *     `w_organization_social`
 *   - Sucesso: `201`, **sem corpo JSON** — o URN do post vem no cabeçalho de
 *     resposta `x-restli-id`
 *
 * `LINKEDIN_API_VERSION` é variável de ambiente justamente porque o valor
 * caduca: fixá-lo no código faria a integração quebrar num dia arbitrário
 * sem ninguém entender por quê.
 */
import { AppError } from "./errors.ts";

const LINKEDIN_API_BASE = "https://api.linkedin.com";
export const LINKEDIN_AUTHORIZE_URL =
  "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL =
  "https://www.linkedin.com/oauth/v2/accessToken";

/** Fallback só para não quebrar a carga; o valor real vem do ambiente. */
const DEFAULT_API_VERSION = "202607";

export function linkedInApiVersion(): string {
  return Deno.env.get("LINKEDIN_API_VERSION") ?? DEFAULT_API_VERSION;
}

function baseHeaders(accessToken: string): Record<string, string> {
  return {
    "Authorization": `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": linkedInApiVersion(),
    "Content-Type": "application/json",
  };
}

export interface TokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

/** Troca o `code` do callback pelo token. Cliente confidencial: usa o secret. */
export async function exchangeCodeForToken(input: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
  codeVerifier?: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: input.clientId,
    client_secret: input.clientSecret,
  });
  if (input.codeVerifier) body.set("code_verifier", input.codeVerifier);

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError(
      response.status >= 500 ? "upstream_error" : "bad_request",
      `LinkedIn recusou a troca do código (HTTP ${response.status})`,
      { detail: { status: response.status, body: text.slice(0, 500) } },
    );
  }

  return await response.json() as TokenResponse;
}

export interface AdminOrganization {
  urn: string;
  id: string;
}

/**
 * Páginas em que o usuário autenticado é administrador.
 *
 * Sem isto, a organização a publicar teria que ser digitada à mão — e um URN
 * digitado errado só apareceria como erro na primeira publicação.
 */
export async function listAdminOrganizations(
  accessToken: string,
): Promise<AdminOrganization[]> {
  const url = new URL("/rest/organizationAcls", LINKEDIN_API_BASE);
  url.searchParams.set("q", "roleAssignee");
  url.searchParams.set("role", "ADMINISTRATOR");
  url.searchParams.set("state", "APPROVED");

  const response = await fetch(url, { headers: baseHeaders(accessToken) });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError(
      response.status >= 500 ? "upstream_error" : "bad_request",
      `LinkedIn recusou a listagem de páginas (HTTP ${response.status})`,
      { detail: { status: response.status, body: text.slice(0, 500) } },
    );
  }

  const json = await response.json() as {
    elements?: { organization?: string }[];
  };
  return (json.elements ?? [])
    .map((el) => el.organization)
    .filter((urn): urn is string => typeof urn === "string")
    .map((urn) => ({ urn, id: urn.split(":").pop() ?? urn }));
}

export interface PublishResult {
  externalPostId: string;
  permalink: string;
}

/** Monta o permalink a partir do URN — o LinkedIn não devolve URL pronta. */
export function permalinkFor(urn: string): string {
  return `https://www.linkedin.com/feed/update/${urn}/`;
}

/**
 * Publica um post de texto na página.
 *
 * `timeoutMs` existe porque o tratamento de timeout (subtarefa 7) depende de
 * distinguir "não respondeu a tempo" de "respondeu erro": só o primeiro caso
 * exige verificar na plataforma antes de qualquer retentativa.
 */
export async function publishTextPost(input: {
  accessToken: string;
  authorUrn: string;
  commentary: string;
  timeoutMs?: number;
}): Promise<PublishResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? 20_000,
  );

  try {
    const response = await fetch(`${LINKEDIN_API_BASE}/rest/posts`, {
      method: "POST",
      headers: baseHeaders(input.accessToken),
      signal: controller.signal,
      body: JSON.stringify({
        author: input.authorUrn,
        commentary: input.commentary,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AppError(
        response.status === 429
          ? "rate_limited"
          : response.status >= 500
          ? "upstream_error"
          : "bad_request",
        `LinkedIn recusou a publicação (HTTP ${response.status})`,
        { detail: { status: response.status, body: text.slice(0, 500) } },
      );
    }

    // Sucesso é 201 sem corpo: o URN vem no cabeçalho. Sem ele não há como
    // provar o que foi publicado — melhor falhar explicitamente do que
    // gravar uma publicação sem identificador externo.
    const urn = response.headers.get("x-restli-id");
    if (!urn) {
      throw new AppError(
        "upstream_error",
        "LinkedIn aceitou a publicação mas não devolveu o cabeçalho x-restli-id",
      );
    }

    return { externalPostId: urn, permalink: permalinkFor(urn) };
  } catch (thrown) {
    if (thrown instanceof AppError) throw thrown;
    if (thrown instanceof DOMException && thrown.name === "AbortError") {
      // Deliberadamente `timeout`, não `upstream_error`: quem trata precisa
      // saber que a publicação PODE ter acontecido. Ver a nota sobre I-4 em
      // `_shared/errors.ts` e a subtarefa 7.
      throw new AppError(
        "timeout",
        "LinkedIn não respondeu a tempo — a publicação pode ter acontecido",
      );
    }
    throw new AppError("upstream_error", "Falha de rede ao publicar", {
      cause: thrown,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Procura um post já publicado pelo autor, para o caso de timeout.
 *
 * A subtarefa 7 é explícita: "não republicar cegamente. O retry consulta a
 * plataforma para verificar se o post já existe". Devolve `null` quando não
 * encontra e lança quando não consegue nem verificar — são situações
 * diferentes e o chamador precisa distinguir: a primeira libera a
 * retentativa, a segunda manda o job para revisão humana.
 */
export async function findRecentPostByCommentary(input: {
  accessToken: string;
  authorUrn: string;
  commentary: string;
}): Promise<PublishResult | null> {
  const url = new URL("/rest/posts", LINKEDIN_API_BASE);
  url.searchParams.set("q", "author");
  url.searchParams.set("author", input.authorUrn);
  url.searchParams.set("count", "20");
  url.searchParams.set("sortBy", "LAST_MODIFIED");

  const response = await fetch(url, {
    headers: baseHeaders(input.accessToken),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError(
      "upstream_error",
      `Não foi possível verificar publicações recentes (HTTP ${response.status})`,
      { detail: { status: response.status, body: text.slice(0, 500) } },
    );
  }

  const json = await response.json() as {
    elements?: { id?: string; commentary?: string }[];
  };
  const needle = input.commentary.trim();
  const match = (json.elements ?? []).find(
    (el) =>
      typeof el.commentary === "string" && el.commentary.trim() === needle,
  );
  if (!match?.id) return null;
  return { externalPostId: match.id, permalink: permalinkFor(match.id) };
}
