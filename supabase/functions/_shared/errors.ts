/**
 * Erros com código e classificação de retentativa.
 *
 * ## Por que `retryable` é campo, não julgamento de quem chama
 *
 * Quem captura o erro raramente sabe se vale tentar de novo. Um `500` do
 * LinkedIn vale; um `422` por texto acima do limite não vale, e repetir só
 * queima cota e atrasa a fila. Deixar essa decisão para o `catch` significa que
 * ela será tomada de forma diferente em cada lugar, e a errada custa publicação
 * duplicada ou peça que nunca sai.
 *
 * Aqui a classificação nasce junto com o erro, onde a informação existe.
 *
 * Módulo puro: sem Deno, sem rede. Roda igual na Edge Function e no vitest.
 */

export type ErrorCode =
  /** Requisição malformada ou fora de contrato. Repetir não muda nada. */
  | "bad_request"
  /** Sem credencial válida. */
  | "unauthorized"
  /** Credencial válida, sem permissão para esta ação. */
  | "forbidden"
  /** Recurso inexistente. */
  | "not_found"
  /** Estado atual do recurso impede a operação. */
  | "conflict"
  /** Limite da plataforma atingido. Vale esperar. */
  | "rate_limited"
  /** Falha do provedor externo. Costuma valer esperar. */
  | "upstream_error"
  /** Sem resposta a tempo. Vale esperar — com a ressalva abaixo. */
  | "timeout"
  /** Configuração ausente ou inválida. Repetir não muda nada. */
  | "misconfigured"
  /** Qualquer outra coisa. */
  | "internal";

/**
 * Códigos que valem retentativa.
 *
 * ⚠️ `timeout` é retentável **mas nunca cegamente** quando houve efeito externo.
 * Publicar de novo depois de um timeout pode duplicar o post: o retry precisa
 * primeiro perguntar à plataforma se a publicação existe. Ver a invariante I-4 e
 * a FASE 6.
 */
const RETRYABLE: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  "rate_limited",
  "upstream_error",
  "timeout",
]);

const HTTP_STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  upstream_error: 502,
  timeout: 504,
  misconfigured: 500,
  internal: 500,
};

export interface AppErrorOptions {
  /** Contexto estruturado. Passa pela redação antes de virar log. */
  detail?: Record<string, unknown>;
  /** Erro original, preservado para o log. */
  cause?: unknown;
  /**
   * Segundos a esperar antes de tentar de novo, quando o provedor informa.
   * Respeitar o valor da plataforma é melhor que adivinhar um backoff.
   */
  retryAfterSeconds?: number;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly detail?: Record<string, unknown>;
  readonly retryAfterSeconds?: number;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.detail = options.detail;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  get retryable(): boolean {
    return RETRYABLE.has(this.code);
  }

  get httpStatus(): number {
    return HTTP_STATUS[this.code];
  }

  /** Forma segura para resposta HTTP: sem `cause`, sem stack. */
  toResponseBody(): { error: { code: ErrorCode; message: string } } {
    return { error: { code: this.code, message: this.message } };
  }
}

/**
 * Converte qualquer coisa capturada num `AppError`.
 *
 * Existe porque `catch` recebe `unknown`, e o `throw` pode ter vindo de uma
 * biblioteca que lança string, objeto simples ou nada. Sem esta normalização,
 * cada handler inventa a própria forma de lidar com isso — e o formato de erro
 * do Supabase, que é objeto simples e não instância de `Error`, é exatamente o
 * caso que já mordeu no frontend.
 */
export function toAppError(thrown: unknown): AppError {
  if (thrown instanceof AppError) return thrown;

  if (thrown instanceof Error) {
    return new AppError("internal", thrown.message, { cause: thrown });
  }

  if (thrown && typeof thrown === "object") {
    const record = thrown as Record<string, unknown>;
    const message = typeof record.message === "string"
      ? record.message
      : JSON.stringify(thrown);
    return new AppError("internal", message, { cause: thrown });
  }

  if (typeof thrown === "string" && thrown.length > 0) {
    return new AppError("internal", thrown, { cause: thrown });
  }

  return new AppError("internal", "Erro sem mensagem", { cause: thrown });
}

export function isRetryable(thrown: unknown): boolean {
  return toAppError(thrown).retryable;
}
