import { beforeAll, describe, expect, it, vi } from "vitest";
import { invoke } from "./gateway.ts";
import { AppError } from "../errors.ts";
import type { AIProvider, ProviderCallResult } from "./types.ts";

/**
 * Critério de aceite da FASE 1: "`ai-gateway` invoca ao menos 2 provedores,
 * com fallback comprovado por teste" (docs/09, docs/05 §1 "Fallback").
 *
 * O que estes testes provam é a *cadeia*, não o provedor: que o gateway
 * percorre `ai_providers` em ordem de prioridade, que um erro de rede no
 * primeiro elo passa a chamada para o segundo em vez de derrubá-la, e que
 * `ai_invocations` registra os dois lados disso — a linha `error` do que
 * falhou e a linha `fallback` com `fallback_from` do que atendeu. Sem esse
 * registro a taxa de fallback não seria medível, que é o motivo pelo qual a
 * coluna existe.
 *
 * A regressão concreta que isto trava: `ai_providers` semeava `openai` como
 * ativo desde a FASE 5, mas `PROVIDER_FACTORIES` não tinha a fábrica. A
 * linha era resolvida para `null` e descartada em silêncio — havia um
 * provedor só, e o laço de fallback nunca tinha um segundo elo para tentar.
 */

/** `gateway.ts` lê `Deno.env` (teto de orçamento); o vitest roda em Node. */
beforeAll(() => {
  if (typeof (globalThis as { Deno?: unknown }).Deno === "undefined") {
    vi.stubGlobal("Deno", {
      env: { get: (name: string) => process.env[name] },
    });
  }
});

const PROMPT_ROW = {
  id: "prompt-1",
  system_prompt: "sistema",
  user_template: "olá {{nome}}",
  output_schema: null,
  model_hint: null,
  temperature: null,
  version: 3,
};

type Insert = Record<string, unknown>;

/**
 * Cliente Supabase falso. O gateway usa três tabelas por caminhos distintos:
 * `ai_prompts` e `ai_providers` por cadeia de filtros que se resolve como
 * promise no fim, e `ai_invocations` por `insert().select().single()`. O
 * builder abaixo é encadeável e "thenable" — devolve o resultado fixado por
 * tabela quando alguém dá `await` na cadeia, seja qual for o caminho.
 */
function fakeDb(inserts: Insert[]) {
  const results: Record<string, unknown[]> = {
    ai_prompts: [PROMPT_ROW],
    // Prioridade 1 primeiro: é a ordem que `loadProviders` pede ao banco.
    ai_providers: [
      { key: "anthropic", config: {} },
      { key: "openai", config: { pricing: { "gpt-4o": {} } } },
    ],
    ai_invocations: [],
  };

  return {
    from(table: string) {
      const rows = results[table] ?? [];
      const builder: Record<string, unknown> = {
        insert(payload: Insert) {
          inserts.push(payload);
          return {
            select: () => ({
              single: async () => ({
                data: { id: `inv-${inserts.length}` },
                error: null,
              }),
            }),
          };
        },
        then(
          resolve: (value: { data: unknown[]; error: null }) => unknown,
        ) {
          return Promise.resolve({ data: rows, error: null }).then(resolve);
        },
      };
      for (const method of ["select", "eq", "is", "order", "limit", "gte"]) {
        builder[method] = () => builder;
      }
      return builder;
    },
  };
}

function provider(
  key: string,
  behaviour: () => Promise<ProviderCallResult>,
): AIProvider {
  return { key, call: behaviour };
}

const OK: ProviderCallResult = {
  raw: "resposta do segundo provedor",
  model: "gpt-4o",
  inputTokens: 120,
  outputTokens: 40,
};

const INPUT = {
  promptKey: "market_intelligence.analyze",
  variables: { nome: "Keystone" },
  organizationId: "org-1",
  operation: "teste",
};

describe("invoke — cadeia de fallback entre provedores", () => {
  it("cai para o segundo provedor quando o primeiro falha por erro de rede", async () => {
    const inserts: Insert[] = [];
    const anthropicCall = vi.fn(async () => {
      throw new AppError("upstream_error", "Anthropic respondeu 503");
    });
    const openaiCall = vi.fn(async () => OK);

    const result = await invoke(INPUT, {
      db: fakeDb(inserts) as never,
      providerFactories: {
        anthropic: () => provider("anthropic", anthropicCall),
        openai: () => provider("openai", openaiCall),
      },
    });

    expect(anthropicCall).toHaveBeenCalledOnce();
    expect(openaiCall).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      ok: true,
      provider: "openai",
      model: "gpt-4o",
      data: "resposta do segundo provedor",
    });
  });

  it("registra a falha e o fallback em ai_invocations, com fallback_from", async () => {
    const inserts: Insert[] = [];

    await invoke(INPUT, {
      db: fakeDb(inserts) as never,
      providerFactories: {
        anthropic: () =>
          provider("anthropic", async () => {
            throw new AppError("upstream_error", "Anthropic respondeu 503");
          }),
        openai: () => provider("openai", async () => OK),
      },
    });

    expect(inserts).toHaveLength(2);

    // O elo que falhou: sem custo inventado, com o motivo preservado.
    expect(inserts[0]).toMatchObject({
      provider: "anthropic",
      status: "error",
      estimated_cost_usd: null,
      error: "Anthropic respondeu 503",
    });
    expect(inserts[0].fallback_from).toBeUndefined();

    // O elo que atendeu: marcado como fallback e apontando para a origem —
    // é isto que torna a taxa de fallback medível.
    expect(inserts[1]).toMatchObject({
      provider: "openai",
      status: "fallback",
      fallback_from: "anthropic",
      input_tokens: 120,
      output_tokens: 40,
    });
  });

  it("não marca fallback quando o primeiro provedor atende", async () => {
    const inserts: Insert[] = [];
    const openaiCall = vi.fn(async () => OK);

    const result = await invoke(INPUT, {
      db: fakeDb(inserts) as never,
      providerFactories: {
        anthropic: () =>
          provider("anthropic", async () => ({
            ...OK,
            raw: "resposta do primeiro",
            model: "claude-sonnet-5",
          })),
        openai: () => provider("openai", openaiCall),
      },
    });

    expect(result).toMatchObject({ ok: true, provider: "anthropic" });
    expect(openaiCall).not.toHaveBeenCalled();
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({ status: "success" });
    expect(inserts[0].fallback_from).toBeUndefined();
  });

  it("esgotada a cadeia, devolve all_providers_failed com o último motivo", async () => {
    const inserts: Insert[] = [];

    const result = await invoke(INPUT, {
      db: fakeDb(inserts) as never,
      providerFactories: {
        anthropic: () =>
          provider("anthropic", async () => {
            throw new AppError("upstream_error", "Anthropic respondeu 503");
          }),
        openai: () =>
          provider("openai", async () => {
            throw new AppError("upstream_error", "OpenAI respondeu 429");
          }),
      },
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "all_providers_failed", message: "OpenAI respondeu 429" },
    });
    expect(inserts).toHaveLength(2);
    expect(inserts.every((row) => row.status === "error")).toBe(true);
  });

  it("provedor sem segredo configurado sai da cadeia sem derrubar o resto", async () => {
    // É o caso que escondia o defeito: a fábrica devolve `null` e a linha do
    // banco é descartada. Legítimo para um provedor sem chave — o que não é
    // legítimo é não haver fábrica nenhuma, como acontecia com `openai`.
    const inserts: Insert[] = [];

    const result = await invoke(INPUT, {
      db: fakeDb(inserts) as never,
      providerFactories: {
        anthropic: () => null,
        openai: () => provider("openai", async () => OK),
      },
    });

    expect(result).toMatchObject({ ok: true, provider: "openai" });
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({ status: "success" });
  });

  it("nenhuma fábrica registrada para a linha do banco = misconfigured, não sucesso silencioso", async () => {
    const inserts: Insert[] = [];

    const result = await invoke(INPUT, {
      db: fakeDb(inserts) as never,
      providerFactories: {},
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "misconfigured" },
    });
  });
});

describe("PROVIDER_FACTORIES — cobertura das linhas semeadas", () => {
  it("tem fábrica para todo provedor que as migrações semeiam", async () => {
    // `20260815194515_content_strategy_seed.sql` semeia `anthropic`;
    // `20260819101000_content_factory_seed.sql` semeia `openai`. Um provedor
    // semeado sem fábrica é descartado em silêncio pelo gateway — o defeito
    // que este arquivo de teste nasceu para travar.
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-teste");
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-teste");

    // As fábricas reais fazem `fetch` de verdade. Um teste que sai para a
    // rede é lento, falha sem internet e gasta cota de API — o que se quer
    // provar aqui é só que as duas fábricas *resolvem*, não o que a API
    // responde. O `fetch` recusado dá exatamente isso.
    const fetchStub = vi.fn(async () => {
      throw new Error("rede indisponível no teste");
    });
    vi.stubGlobal("fetch", fetchStub);

    const inserts: Insert[] = [];
    const result = await invoke(INPUT, { db: fakeDb(inserts) as never });

    // Ambas as fábricas resolveram para um provedor de verdade: a chamada
    // chegou à rede (e falhou lá, sem chave real) em vez de parar antes, em
    // `misconfigured`, que é o que aconteceria com a cadeia vazia.
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("all_providers_failed");
    }
    expect(inserts.map((row) => row.provider)).toEqual(["anthropic", "openai"]);
    expect(fetchStub).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
