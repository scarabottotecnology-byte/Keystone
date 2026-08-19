/**
 * `state` assinado e PKCE (FASE 6, subtarefa 3).
 *
 * ## Por que o `state` é assinado, e não só aleatório
 *
 * O callback do OAuth chega numa requisição sem sessão: vem do provedor, não
 * do navegador autenticado. Sem assinatura, qualquer um poderia chamar
 * `oauth-callback` com um `state` inventado apontando para outra
 * organização — e a conta conectada iria parar no lugar errado. A assinatura
 * HMAC prova que aquele `state` foi emitido por `oauth-start`.
 *
 * O nonce dentro do payload também é a chave da linha em
 * `private.oauth_states`, onde o `code_verifier` do PKCE espera o callback.
 * Assinatura sozinha não bastaria: um `state` legítimo poderia ser
 * reapresentado. A linha é marcada como consumida no primeiro uso.
 *
 * ## Sobre o PKCE com o LinkedIn
 *
 * A subtarefa 3 pede PKCE, e ele é implementado aqui por inteiro
 * (`code_challenge` S256 na autorização, `code_verifier` na troca). Uma
 * ressalva honesta: a documentação do LinkedIn não declara suporte a PKCE
 * no fluxo de authorization code — o parâmetro pode simplesmente ser
 * ignorado do outro lado. Enviá-lo não custa nem quebra nada, e passa a
 * valer sozinho no dia em que o provedor suportar; mas a proteção que de
 * fato sustenta este fluxo hoje é o `state` assinado somado ao
 * `client_secret` (cliente confidencial — a Edge Function guarda segredo de
 * verdade, diferente de um app de página). Registrado aqui para que ninguém
 * leia "PKCE" no código e conclua uma garantia que o provedor talvez não
 * esteja dando.
 *
 * Módulo puro quanto a banco e rede: só usa `crypto`.
 */
import { AppError } from "./errors.ts";

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(
    /=+$/,
    "",
  );
}

function base64UrlDecodeToString(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  return atob(withPadding);
}

/** Comparação em tempo constante — evita distinguir assinatura por timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

export interface StatePayload {
  nonce: string;
  organizationId: string;
  userId: string;
  provider: string;
  /** Epoch em segundos. O callback recusa `state` vencido. */
  exp: number;
}

export function newNonce(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(24)));
}

export async function signState(
  payload: StatePayload,
  secret: string,
): Promise<string> {
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await hmacSha256(secret, body);
  return `${body}.${signature}`;
}

export async function verifyState(
  state: string,
  secret: string,
): Promise<StatePayload> {
  const [body, signature] = state.split(".");
  if (!body || !signature) {
    throw new AppError("bad_request", "State malformado");
  }

  const expected = await hmacSha256(secret, body);
  if (!timingSafeEqual(signature, expected)) {
    throw new AppError("unauthorized", "Assinatura do state inválida");
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(body)) as StatePayload;
  } catch (thrown) {
    throw new AppError("bad_request", "State não decodifica", {
      cause: thrown,
    });
  }

  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    throw new AppError("bad_request", "State expirado — recomece a conexão");
  }

  return payload;
}

export interface PkcePair {
  verifier: string;
  challenge: string;
}

/** PKCE S256: o desafio é o SHA-256 do verifier, em base64url. */
export async function createPkcePair(): Promise<PkcePair> {
  const verifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(verifier),
  );
  return { verifier, challenge: base64UrlEncode(new Uint8Array(digest)) };
}
