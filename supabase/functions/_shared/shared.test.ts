import { describe, expect, it } from "vitest";
import { AppError, isRetryable, toAppError } from "./errors";
import { redact, REDACTED, redactText } from "./redact";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
  isCorrelationId,
  newCorrelationId,
} from "./correlation";
import { createLogger, type LogLine } from "./log";

describe("AppError", () => {
  it("classifica retentativa pelo código, não por quem captura", () => {
    expect(new AppError("rate_limited", "x").retryable).toBe(true);
    expect(new AppError("upstream_error", "x").retryable).toBe(true);
    expect(new AppError("timeout", "x").retryable).toBe(true);

    expect(new AppError("bad_request", "x").retryable).toBe(false);
    expect(new AppError("forbidden", "x").retryable).toBe(false);
    expect(new AppError("misconfigured", "x").retryable).toBe(false);
  });

  it("mapeia código para status HTTP", () => {
    expect(new AppError("not_found", "x").httpStatus).toBe(404);
    expect(new AppError("rate_limited", "x").httpStatus).toBe(429);
    expect(new AppError("timeout", "x").httpStatus).toBe(504);
  });

  it("não vaza cause nem stack no corpo da resposta", () => {
    const err = new AppError("upstream_error", "LinkedIn fora do ar", {
      cause: new Error("token=abc123"),
      detail: { accountId: "42" },
    });
    expect(err.toResponseBody()).toEqual({
      error: { code: "upstream_error", message: "LinkedIn fora do ar" },
    });
  });
});

describe("toAppError", () => {
  it("preserva um AppError", () => {
    const original = new AppError("conflict", "já existe");
    expect(toAppError(original)).toBe(original);
  });

  it("converte Error comum", () => {
    const e = toAppError(new Error("quebrou"));
    expect(e.code).toBe("internal");
    expect(e.message).toBe("quebrou");
  });

  it("converte o objeto simples que o Supabase lança", () => {
    // O formato de erro do Supabase não é instância de Error. Tratar só
    // `instanceof Error` fazia toda falha de banco virar "erro desconhecido".
    const e = toAppError({ message: "permission denied", code: "42501" });
    expect(e.message).toBe("permission denied");
  });

  it("converte string e valores vazios sem quebrar", () => {
    expect(toAppError("falhou").message).toBe("falhou");
    expect(toAppError(undefined).message).toBe("Erro sem mensagem");
    expect(toAppError(null).message).toBe("Erro sem mensagem");
  });

  it("isRetryable funciona sobre qualquer coisa capturada", () => {
    expect(isRetryable(new AppError("rate_limited", "x"))).toBe(true);
    expect(isRetryable("erro solto")).toBe(false);
  });
});

describe("redact", () => {
  it("apaga o valor de chave sensível", () => {
    const out = redact({
      authorization: "Bearer abc",
      access_token: "xyz",
      client_secret: "s3cr3t",
      nome: "Keystone",
    }) as Record<string, unknown>;

    expect(out.authorization).toBe(REDACTED);
    expect(out.access_token).toBe(REDACTED);
    expect(out.client_secret).toBe(REDACTED);
    expect(out.nome).toBe("Keystone");
  });

  it("reconhece chave sensível independente de caixa e prefixo", () => {
    const out = redact({
      Authorization: "x",
      LINKEDIN_ACCESS_TOKEN: "x",
      userPassword: "x",
    }) as Record<string, unknown>;
    expect(Object.values(out)).toEqual([REDACTED, REDACTED, REDACTED]);
  });

  it("apaga JWT embutido em texto livre", () => {
    // O caso que mais acontece: a credencial dentro da mensagem de erro.
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(redactText(`falhou com ${jwt} no header`)).toBe(
      "falhou com [JWT] no header",
    );
  });

  it("apaga chave publishable e secret do Supabase", () => {
    expect(redactText("key=sb_publishable_O7iwgN0Qg5p08MWTBtzChQ_fYSXHLiv"))
      .toBe("key=[SUPABASE_KEY]");
    expect(redactText("sb_secret_AAAAAAAAAAAAAAAAAAAA")).toBe("[SUPABASE_KEY]");
  });

  it("apaga chave de provedor de IA e token do GitHub", () => {
    expect(redactText("sk-abcdefghijklmnopqrstuvwxyz")).toBe("[API_KEY]");
    expect(redactText("ghp_abcdefghijklmnopqrstuvwxyz123456")).toBe(
      "[GITHUB_TOKEN]",
    );
  });

  it("apaga Bearer escrito à mão", () => {
    expect(redactText("Authorization: Bearer abcdef0123456789")).toBe(
      "Authorization: Bearer [REDACTED]",
    );
  });

  it("desce em objeto aninhado e em array", () => {
    const out = redact({
      contas: [{ id: 1, token: "abc" }, { id: 2, token: "def" }],
    }) as { contas: Array<Record<string, unknown>> };
    expect(out.contas[0].token).toBe(REDACTED);
    expect(out.contas[1].token).toBe(REDACTED);
    expect(out.contas[0].id).toBe(1);
  });

  it("redige mensagem de Error e sua cause", () => {
    const inner = new Error("token sk-abcdefghijklmnopqrstuvwxyz recusado");
    const outer = new Error("falha ao publicar", { cause: inner });
    const out = redact(outer) as {
      message: string;
      cause: { message: string };
    };
    expect(out.message).toBe("falha ao publicar");
    expect(out.cause.message).toBe("token [API_KEY] recusado");
  });

  it("sobrevive a referência circular", () => {
    // Um objeto de erro apontando de volta para si mesmo derrubaria o logger,
    // e derrubar o logger no meio de um erro é a pior hora possível.
    const a: Record<string, unknown> = { nome: "a" };
    a.self = a;
    expect(() => redact(a)).not.toThrow();
    expect((redact(a) as Record<string, unknown>).self).toBe("[Circular]");
  });

  it("corta profundidade excessiva em vez de recursar sem fim", () => {
    let deep: Record<string, unknown> = { fim: true };
    for (let i = 0; i < 20; i++) deep = { nivel: deep };
    expect(() => redact(deep)).not.toThrow();
    expect(JSON.stringify(redact(deep))).toContain("[MaxDepth]");
  });
});

describe("correlation id", () => {
  it("gera ULID de 26 caracteres válido", () => {
    const id = newCorrelationId();
    expect(id).toHaveLength(26);
    expect(isCorrelationId(id)).toBe(true);
  });

  it("ordena lexicograficamente por tempo", () => {
    const antes = newCorrelationId(1_700_000_000_000);
    const depois = newCorrelationId(1_700_000_001_000);
    expect(antes < depois).toBe(true);
  });

  it("mantém ordem dentro do mesmo milissegundo", () => {
    // Sem isto, a ordenação valeria só na escala de milissegundo — e uma Edge
    // Function emite vários eventos dentro do mesmo.
    const t = 1_700_000_000_000;
    const ids = Array.from({ length: 50 }, () => newCorrelationId(t));
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(ids).size).toBe(50);
  });

  it("rejeita valor que não é ULID", () => {
    expect(isCorrelationId("não-é-ulid")).toBe(false);
    expect(isCorrelationId("0123456789ABCDEFGHIJKLMNOP")).toBe(false); // tem I
    expect(isCorrelationId(42)).toBe(false);
  });

  it("aceita ID que chega no cabeçalho, se for válido", () => {
    const id = newCorrelationId();
    const req = new Request("https://x.dev", {
      headers: { [CORRELATION_HEADER]: id },
    });
    expect(correlationIdFrom(req)).toBe(id);
  });

  it("descarta cabeçalho inválido e gera um novo", () => {
    // Sem a validação, o cabeçalho vira campo de texto livre controlado por
    // quem chama, e o valor entra em toda linha de log da execução.
    const req = new Request("https://x.dev", {
      headers: { [CORRELATION_HEADER]: "'; drop table --" },
    });
    expect(isCorrelationId(correlationIdFrom(req))).toBe(true);
  });
});

describe("Logger", () => {
  function capture() {
    const lines: LogLine[] = [];
    const log = createLogger(
      { correlationId: "01ARZ3NDEKTSV4RRFFQ69G5FAV", fn: "teste" },
      (line) => lines.push(line),
    );
    return { lines, log };
  }

  it("emite linha estruturada com contexto", () => {
    const { lines, log } = capture();
    log.info("publicou", { assetId: "42" });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: "info",
      msg: "publicou",
      fn: "teste",
      correlationId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      assetId: "42",
    });
    expect(typeof lines[0].ts).toBe("string");
  });

  it("redige segredo passado nos dados — não há caminho que escreva cru", () => {
    const { lines, log } = capture();
    log.info("chamou o LinkedIn", {
      headers: { authorization: "Bearer abc123def456" },
    });

    expect(JSON.stringify(lines[0])).not.toContain("abc123def456");
    expect(JSON.stringify(lines[0])).toContain(REDACTED);
  });

  it("redige segredo embutido na própria mensagem", () => {
    const { lines, log } = capture();
    log.warn("token sk-abcdefghijklmnopqrstuvwxyz expirou");
    expect(lines[0].msg).toBe("token [API_KEY] expirou");
  });

  it("registra código e retentabilidade do erro", () => {
    const { lines, log } = capture();
    log.error("falha ao publicar", new AppError("rate_limited", "limite"), {
      accountId: "7",
    });

    expect(lines[0]).toMatchObject({
      level: "error",
      error_code: "rate_limited",
      retryable: true,
      accountId: "7",
    });
  });

  it("marca como não retentável o erro que não adianta repetir", () => {
    const { lines, log } = capture();
    log.error("payload inválido", new AppError("bad_request", "zona estourou"));
    expect(lines[0].retryable).toBe(false);
  });

  it("child preserva o correlation ID", () => {
    const { lines, log } = capture();
    log.child({ organizationId: "org-1" }).info("dentro do escopo");
    expect(lines[0]).toMatchObject({
      correlationId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      organizationId: "org-1",
    });
  });
});
