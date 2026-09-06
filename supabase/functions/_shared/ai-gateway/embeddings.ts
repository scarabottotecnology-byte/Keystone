/**
 * Embeddings — OpenAI, módulo separado de `gateway.ts`.
 *
 * `invoke()` é moldado para chat completions com `output_schema` estruturado
 * por *tool* forçada (docs/05 §1) — não existe endpoint de embeddings na
 * Anthropic Messages API, e a forma da chamada é fundamentalmente diferente
 * (texto → vetor, sem prompt de sistema, sem schema de saída). Por isso um
 * módulo próprio, não mais um `AIProvider` dentro do laço de `invoke()`. A
 * disciplina de custo e registro é a mesma: toda chamada grava em
 * `ai_invocations`, e o custo é `null` — nunca um zero fabricado — quando
 * `ai_providers.config.pricing` não tem o modelo.
 *
 * Usado por `knowledge-ingest` (embedding de cada chunk ao indexar) e por
 * `content-factory` (embedding da consulta antes de `app.match_knowledge`).
 *
 * Não testado no vitest — chama `fetch` e `Deno.env` diretamente, mesma
 * situação de `gateway.ts`/`providers/anthropic.ts`; fica sujeito ao `deno
 * check` do CI.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError, toAppError } from "../errors.ts";
import { createLogger, type Logger } from "../log.ts";
import { findSecret } from "../secrets.ts";
import { estimateCostUsd, type ModelPricing } from "./pricing.ts";

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const DEFAULT_MODEL = "text-embedding-3-small";

export interface EmbedInput {
  organizationId: string;
  text: string;
  /** Operação de negócio, gravada em `ai_invocations.operation`. */
  operation: string;
  correlationId?: string;
  subject?: { type: string; id: string };
}

export interface EmbedSuccess {
  ok: true;
  embedding: number[];
  invocationId: string;
  model: string;
  costUsd: number | null;
}

export interface EmbedFailure {
  ok: false;
  error: { code: string; message: string };
  invocationId: string | null;
}

export type EmbedResult = EmbedSuccess | EmbedFailure;

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new AppError(
      "misconfigured",
      `Variável de ambiente ausente: ${name}`,
    );
  }
  return value;
}

function serviceRoleClient(): SupabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

interface OpenAiProviderRow {
  config: { embedding_model?: string; pricing?: Record<string, ModelPricing> };
}

async function loadOpenAiConfig(
  db: SupabaseClient,
  organizationId: string,
): Promise<OpenAiProviderRow | null> {
  const { data, error } = await db
    .from("ai_providers")
    .select("config")
    .eq("organization_id", organizationId)
    .eq("key", "openai")
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    throw new AppError("internal", "Falha ao carregar provedor de embeddings", {
      cause: error,
    });
  }
  return data as OpenAiProviderRow | null;
}

async function recordInvocation(
  db: SupabaseClient,
  fields: {
    organizationId: string;
    correlationId?: string;
    operation: string;
    model: string;
    inputTokens?: number;
    costUsd: number | null;
    latencyMs: number;
    status: "success" | "error";
    error?: string;
    subject?: { type: string; id: string };
  },
): Promise<string | null> {
  const { data, error } = await db
    .from("ai_invocations")
    .insert({
      organization_id: fields.organizationId,
      correlation_id: fields.correlationId,
      operation: fields.operation,
      provider: "openai",
      model: fields.model,
      input_tokens: fields.inputTokens,
      output_tokens: 0,
      estimated_cost_usd: fields.costUsd,
      latency_ms: fields.latencyMs,
      status: fields.status,
      error: fields.error,
      subject_type: fields.subject?.type,
      subject_id: fields.subject?.id,
    })
    .select("id")
    .single();

  // Mesmo racional de `gateway.ts`: falha ao gravar a invocação não derruba
  // a chamada que já aconteceu e já custou dinheiro.
  if (error) return null;
  return (data as { id: string }).id;
}

export async function embed(
  input: EmbedInput,
  deps: { db?: SupabaseClient; log?: Logger } = {},
): Promise<EmbedResult> {
  const db = deps.db ?? serviceRoleClient();
  const log = deps.log ?? createLogger({
    correlationId: input.correlationId ?? "sem-correlation-id",
    fn: "ai-gateway-embeddings",
    organizationId: input.organizationId,
  });

  // Ambiente primeiro, Vault depois — mesmo caminho de `gateway.ts`. Ler só
  // `Deno.env` ignorava a chave cadastrada no Vault e degradava o RAG para
  // "sem contexto" sem que nada estivesse de fato faltando.
  const apiKey = await findSecret(db, "openai_api_key");
  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: "misconfigured",
        message:
          "Chave da OpenAI não configurada (nem no ambiente, nem no Vault)",
      },
      invocationId: null,
    };
  }

  let providerRow: OpenAiProviderRow | null;
  try {
    providerRow = await loadOpenAiConfig(db, input.organizationId);
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha ao carregar provedor de embeddings", error);
    return {
      ok: false,
      error: { code: "misconfigured", message: error.message },
      invocationId: null,
    };
  }

  const model = providerRow?.config?.embedding_model ?? DEFAULT_MODEL;
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: input.text }),
    });
  } catch (thrown) {
    const error = toAppError(thrown);
    const invocationId = await recordInvocation(db, {
      organizationId: input.organizationId,
      correlationId: input.correlationId,
      operation: input.operation,
      model,
      costUsd: null,
      latencyMs: Date.now() - startedAt,
      status: "error",
      error: error.message,
      subject: input.subject,
    });
    return {
      ok: false,
      error: { code: "upstream_error", message: error.message },
      invocationId,
    };
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const invocationId = await recordInvocation(db, {
      organizationId: input.organizationId,
      correlationId: input.correlationId,
      operation: input.operation,
      model,
      costUsd: null,
      latencyMs: Date.now() - startedAt,
      status: "error",
      error: `HTTP ${response.status}: ${bodyText.slice(0, 500)}`,
      subject: input.subject,
    });
    return {
      ok: false,
      error: {
        code: response.status === 429 ? "rate_limited" : "upstream_error",
        message: `OpenAI embeddings devolveu HTTP ${response.status}`,
      },
      invocationId,
    };
  }

  const json = await response.json() as {
    data?: { embedding?: number[] }[];
    usage?: { total_tokens?: number };
  };
  const embedding = json.data?.[0]?.embedding;
  const totalTokens = json.usage?.total_tokens ?? 0;

  if (!Array.isArray(embedding)) {
    const invocationId = await recordInvocation(db, {
      organizationId: input.organizationId,
      correlationId: input.correlationId,
      operation: input.operation,
      model,
      costUsd: null,
      latencyMs: Date.now() - startedAt,
      status: "error",
      error: "Resposta da OpenAI sem embedding",
      subject: input.subject,
    });
    return {
      ok: false,
      error: {
        code: "upstream_error",
        message: "OpenAI não devolveu embedding",
      },
      invocationId,
    };
  }

  const costUsd = estimateCostUsd(
    totalTokens,
    0,
    providerRow?.config?.pricing?.[model],
  );
  const invocationId = await recordInvocation(db, {
    organizationId: input.organizationId,
    correlationId: input.correlationId,
    operation: input.operation,
    model,
    inputTokens: totalTokens,
    costUsd,
    latencyMs: Date.now() - startedAt,
    status: "success",
    subject: input.subject,
  });

  return {
    ok: true,
    embedding,
    invocationId: invocationId ?? "",
    model,
    costUsd,
  };
}
