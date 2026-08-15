/**
 * Correlation ID em formato ULID.
 *
 * ## Por que ULID e não UUID
 *
 * O correlation ID acompanha uma execução inteira: o cron do n8n dispara, a
 * Edge Function decide, o provedor externo responde, o resultado volta. Quando
 * algo falha, a pergunta é "o que aconteceu nessa execução, em ordem" — e a
 * resposta sai de ordenar os registros.
 *
 * ULID é ordenável por tempo lexicograficamente: ordenar as strings ordena os
 * eventos. UUIDv4 é aleatório, e reconstruir a sequência exigiria confiar no
 * `created_at` de sistemas com relógios diferentes.
 *
 * ## Monotonicidade
 *
 * Dois IDs gerados no mesmo milissegundo precisam manter ordem entre si, senão
 * a garantia acima vale só na escala de milissegundo — e uma Edge Function
 * emite vários eventos dentro do mesmo. Dentro do mesmo milissegundo, a parte
 * aleatória é incrementada em vez de sorteada de novo, conforme a especificação
 * do formato.
 *
 * Módulo puro: usa apenas `Date.now` e `crypto.getRandomValues`, ambos
 * disponíveis em Deno, navegador e Node.
 */

/** Crockford base32: sem I, L, O e U, para não confundir na leitura humana. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TIME_LEN = 10;
const RANDOM_LEN = 16;

let lastTime = -1;
let lastRandom: number[] = [];

function encodeTime(now: number): string {
  let out = "";
  let t = now;
  for (let i = 0; i < TIME_LEN; i++) {
    out = ALPHABET[t % 32] + out;
    t = Math.floor(t / 32);
  }
  return out;
}

function randomDigits(): number[] {
  const bytes = new Uint8Array(RANDOM_LEN);
  crypto.getRandomValues(bytes);
  // Cada dígito usa 5 bits; o módulo sobre 32 é suficiente porque a entropia
  // total (80 bits) domina o pequeno viés de um byte.
  return Array.from(bytes, (b) => b % 32);
}

/**
 * Incrementa a parte aleatória em 1, com carry.
 *
 * Se estourar — 2^80 chamadas no mesmo milissegundo, o que não acontece —,
 * sorteia de novo em vez de dar a volta e quebrar a ordem.
 */
function incrementDigits(digits: number[]): number[] {
  const out = [...digits];
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] < 31) {
      out[i]++;
      return out;
    }
    out[i] = 0;
  }
  return randomDigits();
}

/** Gera um ULID de 26 caracteres. */
export function newCorrelationId(now: number = Date.now()): string {
  if (now === lastTime) {
    lastRandom = incrementDigits(lastRandom);
  } else {
    lastTime = now;
    lastRandom = randomDigits();
  }
  return encodeTime(now) + lastRandom.map((d) => ALPHABET[d]).join("");
}

const ULID_RE = new RegExp(`^[${ALPHABET}]{${TIME_LEN + RANDOM_LEN}}$`);

export function isCorrelationId(value: unknown): value is string {
  return typeof value === "string" && ULID_RE.test(value);
}

/** Cabeçalho pelo qual o ID atravessa as fronteiras do sistema. */
export const CORRELATION_HEADER = "x-correlation-id";

/**
 * Lê o correlation ID da requisição, ou cria um.
 *
 * Um ID que chega de fora só é aceito se for ULID válido. Sem essa checagem, o
 * cabeçalho vira campo de texto livre controlado por quem chama — e um valor
 * arbitrário entra em toda linha de log e de auditoria da execução.
 */
export function correlationIdFrom(request: Request): string {
  const incoming = request.headers.get(CORRELATION_HEADER);
  return isCorrelationId(incoming) ? incoming : newCorrelationId();
}
