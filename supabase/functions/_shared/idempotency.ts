/**
 * Idempotência de efeito externo.
 *
 * ## A invariante I-4
 *
 * Nenhum efeito externo sem chave de idempotência **gravada antes da chamada**.
 * A ordem importa: gravar depois não protege contra o caso que mais dói — o
 * processo morrer entre a chamada e o registro, deixando o post publicado e o
 * banco achando que não.
 *
 * ## As três camadas
 *
 * Esta é a segunda. Sozinha nenhuma basta:
 *
 * 1. **Lock pessimista** ao reivindicar o job, para dois workers não pegarem o
 *    mesmo item.
 * 2. **Chave determinística**, gravada antes da chamada — este módulo.
 * 3. **Restrição de unicidade natural** no banco, como rede final.
 *
 * ## O que este módulo não decide
 *
 * O armazenamento é injetado. A tabela `idempotency_keys` nasce na FASE 2, e a
 * separação existe para que a **derivação da chave** — a parte com regra e com
 * risco de erro sutil — seja testável agora, sem banco.
 */
import { AppError } from "./errors.ts";

/**
 * Separador entre as partes da chave.
 *
 * Precisa ser um caractere que não possa aparecer dentro de nenhuma parte, e
 * NUL é o único com essa garantia: identificador, data e URL podem conter `:`,
 * `|` ou espaço.
 *
 * Isso importa mais do que parece. Com `:` como separador, `["a:b", "c"]` e
 * `["a", "b:c"]` produziriam a mesma chave — e colisão aqui significa uma
 * publicação silenciosamente engolida, como se já tivesse acontecido.
 */
const SEPARATOR = "\u0000";

/**
 * Deriva a chave de idempotência a partir das partes que definem a operação.
 *
 * Determinística por construção: as mesmas partes produzem sempre a mesma
 * chave, e é isso que faz a segunda tentativa reconhecer a primeira.
 *
 * As partes são unidas por `SEPARATOR` — ver a nota acima sobre por que ele é
 * NUL e não um caractere legível.
 */
export async function deriveIdempotencyKey(
  parts: readonly (string | number)[],
): Promise<string> {
  if (parts.length === 0) {
    throw new AppError(
      "bad_request",
      "Chave de idempotência precisa de ao menos uma parte",
    );
  }

  const normalized = parts.map((p) => {
    const s = String(p);
    if (s.includes(SEPARATOR)) {
      throw new AppError(
        "bad_request",
        "Parte da chave de idempotência contém o separador reservado (NUL)",
      );
    }
    return s;
  });

  const bytes = new TextEncoder().encode(normalized.join(SEPARATOR));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type ClaimOutcome =
  /** A chave é nova: siga com a chamada externa. */
  | { status: "claimed" }
  /** Já existe e concluiu. Não repita — devolva o resultado anterior. */
  | { status: "done"; result: unknown }
  /**
   * Já existe e está em andamento em outro worker.
   *
   * Não é sucesso nem erro: é "alguém está cuidando". Repetir agora é o caminho
   * para a publicação duplicada.
   */
  | { status: "in_flight" };

/**
 * Armazenamento das chaves. Implementado sobre `idempotency_keys` na FASE 2.
 */
export interface IdempotencyStore {
  /**
   * Registra a chave se ela não existir, de forma atômica.
   *
   * A atomicidade tem que estar aqui — um `select` seguido de `insert` deixa a
   * janela entre os dois aberta, que é exatamente onde dois workers passam.
   */
  claim(key: string): Promise<ClaimOutcome>;
  /** Marca a operação como concluída, guardando o resultado. */
  complete(key: string, result: unknown): Promise<void>;
  /** Libera a chave após falha, para que a retentativa possa reivindicá-la. */
  release(key: string, error: string): Promise<void>;
}

export interface RunOnceOptions<T> {
  store: IdempotencyStore;
  parts: readonly (string | number)[];
  /** A operação com efeito externo. */
  operation: () => Promise<T>;
  /**
   * O que fazer quando outro worker está com a chave.
   * Sem isto, o padrão é lançar — nunca executar de novo.
   */
  onInFlight?: () => T | Promise<T>;
}

/**
 * Executa a operação no máximo uma vez por chave.
 *
 * Em caso de falha, a chave é liberada para que a retentativa possa assumir —
 * **exceto** quando o erro não é retentável, porque aí repetir só reproduz a
 * mesma falha e a chave liberada convida a isso.
 */
export async function runOnce<T>({
  store,
  parts,
  operation,
  onInFlight,
}: RunOnceOptions<T>): Promise<T> {
  const key = await deriveIdempotencyKey(parts);
  const outcome = await store.claim(key);

  if (outcome.status === "done") {
    return outcome.result as T;
  }

  if (outcome.status === "in_flight") {
    if (onInFlight) return await onInFlight();
    throw new AppError(
      "conflict",
      "Operação já está em andamento com a mesma chave de idempotência",
      { detail: { key } },
    );
  }

  try {
    const result = await operation();
    await store.complete(key, result);
    return result;
  } catch (thrown) {
    const error = thrown instanceof AppError
      ? thrown
      : new AppError("internal", String(thrown), { cause: thrown });

    if (error.retryable) {
      await store.release(key, error.message);
    } else {
      // Falha definitiva fica registrada: liberar a chave faria a retentativa
      // reproduzir o mesmo erro, gastando cota da plataforma à toa.
      await store.complete(key, { failed: true, code: error.code });
    }
    throw error;
  }
}
