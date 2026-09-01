import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  findSecret,
  isAutomationSecretValid,
  requireSecret,
} from "./secrets.ts";

/**
 * `secrets.ts` lê `Deno.env` — legítimo em produção, onde o Deno runtime
 * fornece o global. O vitest roda em Node, que não o tem. Um stub mínimo,
 * suficiente para `vi.stubEnv` funcionar através dele, é mais honesto que
 * excluir o módulo da cobertura só porque ele toca `Deno.env`.
 */
beforeAll(() => {
  if (typeof (globalThis as { Deno?: unknown }).Deno === "undefined") {
    vi.stubGlobal("Deno", {
      env: { get: (name: string) => process.env[name] },
    });
  }
});

/** Um cliente Supabase falso — só o `rpc` que estes módulos usam. */
function fakeDb(
  handler: (
    fn: string,
    args: Record<string, unknown>,
  ) => { data: unknown; error: unknown },
) {
  return {
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) =>
      handler(fn, args)
    ),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("findSecret / requireSecret", () => {
  it("prioriza o ambiente sobre o Vault", async () => {
    vi.stubEnv("BUFFER_ACCESS_TOKEN", "do-ambiente");
    const db = fakeDb(() => {
      throw new Error(
        "não deveria consultar o Vault quando o ambiente tem o valor",
      );
    });

    const value = await findSecret(db, "buffer_access_token");
    expect(value).toBe("do-ambiente");
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("cai para o Vault quando o ambiente não tem o valor", async () => {
    const db = fakeDb((fn, args) => {
      expect(fn).toBe("integration_secret");
      expect(args).toEqual({ p_name: "buffer_access_token" });
      return { data: "do-vault", error: null };
    });

    const value = await findSecret(db, "buffer_access_token");
    expect(value).toBe("do-vault");
  });

  it("devolve null quando não existe em lugar nenhum — não lança", async () => {
    // `findSecret` não decide se a ausência é grave; quem chama decide.
    const db = fakeDb(() => ({ data: null, error: null }));
    const value = await findSecret(db, "buffer_organization_id");
    expect(value).toBeNull();
  });

  it("trata string vazia do Vault como ausência", async () => {
    const db = fakeDb(() => ({ data: "   ", error: null }));
    const value = await findSecret(db, "openai_api_key");
    expect(value).toBeNull();
  });

  it("propaga erro do Vault como AppError", async () => {
    const db = fakeDb(() => ({ data: null, error: { message: "boom" } }));
    await expect(findSecret(db, "openai_api_key")).rejects.toMatchObject({
      code: "internal",
    });
  });

  it("requireSecret lança misconfigured com onde conseguir a chave", async () => {
    const db = fakeDb(() => ({ data: null, error: null }));
    await expect(requireSecret(db, "anthropic_api_key")).rejects.toMatchObject({
      code: "misconfigured",
      message: expect.stringContaining("console.anthropic.com"),
    });
  });

  it("requireSecret devolve o valor quando existe", async () => {
    const db = fakeDb(() => ({ data: "sk-ant-xxx", error: null }));
    await expect(requireSecret(db, "anthropic_api_key")).resolves.toBe(
      "sk-ant-xxx",
    );
  });
});

describe("isAutomationSecretValid", () => {
  it("sem valor fornecido é sempre inválido, sem consultar nada", async () => {
    const db = fakeDb(() => {
      throw new Error("não deveria consultar quando provided é null");
    });
    expect(await isAutomationSecretValid(db, null)).toBe(false);
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("compara contra o ambiente quando configurado", async () => {
    vi.stubEnv("AUTOMATION_WEBHOOK_SECRET", "segredo-certo");
    const db = fakeDb(() => {
      throw new Error("não deveria consultar o Vault");
    });

    expect(await isAutomationSecretValid(db, "segredo-certo")).toBe(true);
    expect(await isAutomationSecretValid(db, "segredo-errado")).toBe(false);
  });

  it("compara dentro do banco quando não há ambiente — o valor esperado nunca sai do Vault", async () => {
    const db = fakeDb((fn, args) => {
      expect(fn).toBe("verify_automation_secret");
      expect(args).toEqual({ p_secret: "o-que-chegou" });
      return { data: true, error: null };
    });

    expect(await isAutomationSecretValid(db, "o-que-chegou")).toBe(true);
  });

  it("erro na verificação vira AppError, nunca 'inválido' silencioso", async () => {
    const db = fakeDb(() => ({ data: null, error: { message: "falhou" } }));
    await expect(
      isAutomationSecretValid(db, "qualquer"),
    ).rejects.toMatchObject({ code: "internal" });
  });
});
