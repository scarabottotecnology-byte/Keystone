/**
 * Redação de segredo antes de virar log.
 *
 * ## Por que isto é código e não disciplina
 *
 * O critério de aceite da FASE 21 é "nenhum log com credencial, **verificado por
 * teste**". Não é "a equipe toma cuidado" — porque a equipe toma cuidado até a
 * madrugada em que alguém adiciona `console.log(payload)` para depurar uma falha
 * de publicação, e o `payload` traz o token do LinkedIn.
 *
 * Logs são copiados para lugares que ninguém rastreia: painel do provedor,
 * exportação para análise, print colado numa conversa. Um token que passou por
 * log é um token vazado, e a rotação depende de alguém perceber.
 *
 * Por isso a redação acontece **na saída**, sem depender de quem chama lembrar.
 *
 * Módulo puro: sem Deno, sem rede.
 */

/** Chaves cujo valor nunca aparece, qualquer que seja o conteúdo. */
const SECRET_KEYS = [
  "authorization",
  "apikey",
  "api_key",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "client_secret",
  "secret",
  "password",
  "senha",
  "service_role",
  "service_role_key",
  "cookie",
  "set-cookie",
  "session",
  "private_key",
  "signature",
  "webhook_secret",
];

/**
 * Padrões que denunciam segredo **dentro** de texto livre.
 *
 * A checagem por chave não alcança o caso comum: a credencial embutida numa
 * mensagem de erro, que é justamente onde ela costuma aparecer.
 */
const SECRET_PATTERNS: Array<[RegExp, string]> = [
  // JWT — três blocos base64url separados por ponto. Cobre a chave anon legada
  // do Supabase e o token de sessão.
  [/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, "[JWT]"],
  // Chaves do Supabase no formato novo.
  [/\bsb_(publishable|secret)_[A-Za-z0-9_-]{10,}\b/g, "[SUPABASE_KEY]"],
  // Chaves de provedor de IA e afins.
  [/\bsk-[A-Za-z0-9_-]{16,}\b/g, "[API_KEY]"],
  [/\b(ghp|gho|ghs|ghu)_[A-Za-z0-9]{20,}\b/g, "[GITHUB_TOKEN]"],
  // Cabeçalho Bearer escrito à mão dentro de mensagem.
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/gi, "Bearer [REDACTED]"],
];

export const REDACTED = "[REDACTED]";

/** Profundidade máxima. Além dela, o valor vira marcador em vez de ser expandido. */
const MAX_DEPTH = 6;

function isSecretKey(key: string): boolean {
  const k = key.toLowerCase();
  return SECRET_KEYS.some((s) =>
    k === s || k.endsWith(`_${s}`) || k.includes(s)
  );
}

/** Aplica os padrões de segredo em texto livre. */
export function redactText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Redige recursivamente qualquer valor.
 *
 * Trata ciclo — um objeto de erro com `cause` apontando de volta para si mesmo
 * derrubaria o logger, e derrubar o logger no meio de um erro é a pior hora.
 */
export function redact(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") return redactText(value);

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (typeof value === "bigint") return value.toString();

  if (typeof value === "function") return "[Function]";

  if (value instanceof Date) return value.toISOString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message),
      ...(value.cause !== undefined && depth < MAX_DEPTH
        ? { cause: redact(value.cause, depth + 1, seen) }
        : {}),
    };
  }

  if (typeof value !== "object") return String(value);

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (depth >= MAX_DEPTH) return "[MaxDepth]";

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSecretKey(key) ? REDACTED : redact(item, depth + 1, seen);
  }
  return out;
}
