/**
 * Log estruturado, com redação obrigatória.
 *
 * ## Uma linha por evento, em JSON
 *
 * Log de Edge Function é lido por consulta, não por leitura sequencial. Texto
 * livre obriga a inventar uma expressão regular por pergunta; JSON permite
 * filtrar por `correlation_id` e reconstruir a execução inteira em ordem.
 *
 * ## A redação não é opcional
 *
 * Todo valor passa por `redact` antes de virar linha. Não existe caminho neste
 * módulo que escreva um objeto cru — é o que faz o critério "nenhum log com
 * credencial" ser uma propriedade do código, e não uma promessa.
 */
import { AppError, toAppError } from "./errors.ts";
import { redact } from "./redact.ts";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId: string;
  /** Nome da função. Aparece em toda linha, para filtrar por origem. */
  fn: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface LogLine {
  ts: string;
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

/** Destino das linhas. Injetável para que o teste não escreva no console. */
export type Sink = (line: LogLine) => void;

const consoleSink: Sink = (line) => {
  const text = JSON.stringify(line);
  if (line.level === "error") console.error(text);
  else if (line.level === "warn") console.warn(text);
  else console.log(text);
};

export class Logger {
  constructor(
    private readonly context: LogContext,
    private readonly sink: Sink = consoleSink,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Deriva um logger com contexto adicional, preservando o correlation ID. */
  child(extra: Record<string, unknown>): Logger {
    return new Logger(
      { ...this.context, ...extra },
      this.sink,
      this.now,
    );
  }

  debug(msg: string, data?: Record<string, unknown>) {
    this.write("debug", msg, data);
  }

  info(msg: string, data?: Record<string, unknown>) {
    this.write("info", msg, data);
  }

  warn(msg: string, data?: Record<string, unknown>) {
    this.write("warn", msg, data);
  }

  /**
   * Registra um erro com código e classificação de retentativa.
   *
   * `retryable` entra na linha porque é a informação que se procura ao
   * investigar uma fila travada: distinguir o que vai voltar sozinho do que
   * precisa de alguém.
   */
  error(msg: string, thrown?: unknown, data?: Record<string, unknown>) {
    const error: AppError | undefined = thrown === undefined
      ? undefined
      : toAppError(thrown);

    this.write("error", msg, {
      ...data,
      ...(error
        ? {
          error_code: error.code,
          error_message: error.message,
          retryable: error.retryable,
          ...(error.detail ? { error_detail: error.detail } : {}),
        }
        : {}),
    });
  }

  private write(level: LogLevel, msg: string, data?: Record<string, unknown>) {
    // O objeto inteiro passa pela redação — contexto, dados e mensagem.
    const payload = redact({
      ...this.context,
      ...(data ?? {}),
      msg,
    }) as Record<string, unknown>;

    this.sink({
      ts: this.now().toISOString(),
      level,
      ...payload,
      msg: String(payload.msg),
    });
  }
}

export function createLogger(context: LogContext, sink?: Sink): Logger {
  return new Logger(context, sink);
}
