import { describe, expect, it, vi } from "vitest";
import {
  type ClaimOutcome,
  deriveIdempotencyKey,
  type IdempotencyStore,
  runOnce,
} from "./idempotency";
import { AppError } from "./errors";

describe("deriveIdempotencyKey", () => {
  it("é determinística — a mesma operação produz a mesma chave", () => {
    // É o que faz a segunda tentativa reconhecer a primeira.
    return Promise.all([
      deriveIdempotencyKey(["asset-1", "conta-2", "2026-08-20T08:00:00Z"]),
      deriveIdempotencyKey(["asset-1", "conta-2", "2026-08-20T08:00:00Z"]),
    ]).then(([a, b]) => expect(a).toBe(b));
  });

  it("muda quando qualquer parte muda", async () => {
    const base = await deriveIdempotencyKey(["asset-1", "conta-2", "08:00"]);
    expect(await deriveIdempotencyKey(["asset-1", "conta-2", "09:00"]))
      .not.toBe(base);
    expect(await deriveIdempotencyKey(["asset-9", "conta-2", "08:00"]))
      .not.toBe(base);
  });

  it("não confunde agrupamentos diferentes das mesmas letras", async () => {
    // Com `:` como separador, ["a:b","c"] e ["a","b:c"] colidiriam — e uma
    // colisão aqui é uma publicação silenciosamente engolida.
    const a = await deriveIdempotencyKey(["a:b", "c"]);
    const b = await deriveIdempotencyKey(["a", "b:c"]);
    expect(a).not.toBe(b);
  });

  it("aceita partes com espaço, dois-pontos e barra", async () => {
    // O separador é NUL justamente para que isto seja possível: identificador,
    // data e URL contêm esses caracteres o tempo todo.
    await expect(
      deriveIdempotencyKey(["urn:li:share:1", "2026-08-20 08:00", "a/b"]),
    ).resolves.toMatch(/^[0-9a-f]{64}$/);
  });

  it("recusa parte contendo o separador reservado", async () => {
    await expect(deriveIdempotencyKey(["tem\u0000nul", "x"])).rejects.toThrow(
      AppError,
    );
  });

  it("recusa lista vazia", async () => {
    await expect(deriveIdempotencyKey([])).rejects.toThrow(AppError);
  });

  it("produz hexadecimal de 64 caracteres", async () => {
    expect(await deriveIdempotencyKey(["x"])).toMatch(/^[0-9a-f]{64}$/);
  });
});

/** Store em memória, com o comportamento atômico que a implementação real terá. */
function memoryStore() {
  const state = new Map<string, { done: boolean; result?: unknown }>();
  const store: IdempotencyStore = {
    claim(key): Promise<ClaimOutcome> {
      const entry = state.get(key);
      if (!entry) {
        state.set(key, { done: false });
        return Promise.resolve({ status: "claimed" });
      }
      return Promise.resolve(
        entry.done
          ? { status: "done", result: entry.result }
          : { status: "in_flight" },
      );
    },
    complete(key, result) {
      state.set(key, { done: true, result });
      return Promise.resolve();
    },
    release(key) {
      state.delete(key);
      return Promise.resolve();
    },
  };
  return { store, state };
}

describe("runOnce", () => {
  const parts = ["asset-1", "conta-2", "2026-08-20T08:00:00Z"];

  it("executa a operação na primeira chamada", async () => {
    const { store } = memoryStore();
    const operation = vi.fn().mockResolvedValue({ postId: "urn:li:share:1" });

    const result = await runOnce({ store, parts, operation });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ postId: "urn:li:share:1" });
  });

  it("não executa de novo e devolve o resultado anterior", async () => {
    // O caso central: reexecutar o workflow não publica duas vezes.
    const { store } = memoryStore();
    const operation = vi.fn().mockResolvedValue({ postId: "urn:li:share:1" });

    await runOnce({ store, parts, operation });
    const second = await runOnce({ store, parts, operation });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ postId: "urn:li:share:1" });
  });

  it("operação com partes diferentes executa normalmente", async () => {
    const { store } = memoryStore();
    const operation = vi.fn().mockResolvedValue("ok");

    await runOnce({ store, parts, operation });
    await runOnce({ store, parts: [...parts.slice(0, 2), "09:00"], operation });

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("lança em vez de executar quando outro worker está com a chave", async () => {
    const { store } = memoryStore();
    await store.claim(await deriveIdempotencyKey(parts));
    const operation = vi.fn();

    await expect(runOnce({ store, parts, operation })).rejects.toMatchObject({
      code: "conflict",
    });
    expect(operation).not.toHaveBeenCalled();
  });

  it("usa onInFlight quando fornecido, sem executar a operação", async () => {
    const { store } = memoryStore();
    await store.claim(await deriveIdempotencyKey(parts));
    const operation = vi.fn();

    const result = await runOnce({
      store,
      parts,
      operation,
      onInFlight: () => "adiado",
    });

    expect(result).toBe("adiado");
    expect(operation).not.toHaveBeenCalled();
  });

  it("libera a chave em falha retentável, permitindo nova tentativa", async () => {
    const { store } = memoryStore();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new AppError("upstream_error", "LinkedIn fora"))
      .mockResolvedValueOnce({ postId: "urn:li:share:2" });

    await expect(runOnce({ store, parts, operation })).rejects.toThrow();
    const result = await runOnce({ store, parts, operation });

    expect(operation).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ postId: "urn:li:share:2" });
  });

  it("não libera a chave em falha definitiva", async () => {
    // Repetir só reproduziria o mesmo erro, gastando cota da plataforma.
    const { store } = memoryStore();
    const operation = vi
      .fn()
      .mockRejectedValue(new AppError("bad_request", "zona estourou"));

    await expect(runOnce({ store, parts, operation })).rejects.toThrow();
    const second = await runOnce({ store, parts, operation });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ failed: true, code: "bad_request" });
  });
});
