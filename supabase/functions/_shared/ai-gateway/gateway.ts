/**
 * `ai-gateway` — ponto único de invocação de LLM (docs/05-AGENTES-DE-IA.md §1).
 *
 * "Nenhum código de produto chama provedor diretamente" (docs/03 §3.7). Todo
 * agente (A1, A2, e os que vierem depois) passa por `invoke()`.
 *
 * ## Por que módulo compartilhado, e não uma Edge Function HTTP separada
 *
 * O diagrama do documento 05 mostra "Edge Functions dos módulos" chamando o
 * gateway — não fica implícito que seja um segundo salto HTTP. Um import
 * direto entre Edge Functions do mesmo projeto é mais simples, mais rápido e
 * não precisa reautenticar uma segunda vez: exatamente o padrão que
 * `_shared/auth.ts`, `_shared/log.ts` etc. já estabeleceram na FASE 1.
 *
 * ## Por que `service_role` aqui não é o atalho do achado C-01
 *
 * Os agentes que chamam este módulo (A1, A2) são disparados por cron via n8n
 * — não existe usuário logado para autenticar. `service_role` é o caso
 * legítimo de "não há sessão para agir em nome de", igual ao raciocínio já
 * registrado na migração `ai_core_and_observability` para `automation_runs`.
 * A diferença do C-01 é que lá a RLS *pretendia* proteger e falhava por
 * política solta; aqui não há RLS para furar porque não há usuário — o
 * escopo por organização é aplicado explicitamente em cada consulta deste
 * módulo, nunca implicitamente.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError, toAppError } from "../errors.ts";
import { createLogger, type Logger } from "../log.ts";
import { createAnthropicProvider } from "./providers/anthropic.ts";
import { estimateCostUsd, type ModelPricing } from "./pricing.ts";
import { renderTemplate } from "./template.ts";
import { validateOutput } from "./validate.ts";
import type {
  AIInvokeInput,
  AIInvokeResult,
  AIProvider,
  ProviderCallResult,
} from "./types.ts";

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new AppError("misconfigured", `Variável de ambiente ausente: ${name}`);
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

/**
 * Fábrica por `key` de `ai_providers`. Devolve `null` quando o segredo do
 * provedor não está configurado — permite que `ai_providers` liste um
 * provedor sem derrubar o gateway inteiro antes de alguém rodar
 * `supabase secrets set`.
 */
const PROVIDER_FACTORIES: Record<string, () => AIProvider | null> = {
  anthropic: () => {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    return key ? createAnthropicProvider(key) : null;
  },
};

interface PromptRow {
  id: string;
  system_prompt: string;
  user_template: string;
  output_schema: Record<string, unknown> | null;
  model_hint: string | null;
  temperature: number | null;
  version: number;
}

async function loadPrompt(
  db: SupabaseClient,
  key: string,
  organizationId: string,
  version?: number,
): Promise<PromptRow | null> {
  const base = db.from("ai_prompts").select("*").eq("key", key).eq("is_active", true);

  if (version !== undefined) {
    const { data, error } = await base
      .eq("version", version)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order("organization_id", { ascending: false, nullsFirst: false })
      .limit(1);
    if (error) throw new AppError("internal", "Falha ao carregar prompt", { cause: error });
    return (data?.[0] as PromptRow) ?? null;
  }

  // Prefere a versão da própria organização sobre a global — duas consultas
  // simples em vez de um OR com ORDER BY frágil sobre coluna nula.
  const { data: orgSpecific, error: orgError } = await base
    .eq("organization_id", organizationId)
    .order("version", { ascending: false })
    .limit(1);
  if (orgError) {
    throw new AppError("internal", "Falha ao carregar prompt da organização", { cause: orgError });
  }
  if (orgSpecific && orgSpecific.length > 0) return orgSpecific[0] as PromptRow;

  const { data: global, error: globalError } = await base
    .is("organization_id", null)
    .order("version", { ascending: false })
    .limit(1);
  if (globalError) {
    throw new AppError("internal", "Falha ao carregar prompt global", { cause: globalError });
  }
  return (global?.[0] as PromptRow) ?? null;
}

interface ProviderRow {
  key: string;
  config: { pricing?: Record<string, ModelPricing> };
}

async function loadProviders(db: SupabaseClient, organizationId: string): Promise<ProviderRow[]> {
  const { data, error } = await db
    .from("ai_providers")
    .select("key, config")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("priority", { ascending: true });
  if (error) throw new AppError("internal", "Falha ao carregar provedores", { cause: error });
  return (data as ProviderRow[]) ?? [];
}

/**
 * Teto diário opcional, por `AI_DAILY_BUDGET_USD` (Edge Function secret). Sem
 * ele configurado, nenhum teto é aplicado — comportamento explícito, não
 * "esquecido por padrão".
 */
async function checkBudget(
  db: SupabaseClient,
  organizationId: string,
  priority: "critical" | "normal",
  log: Logger,
): Promise<void> {
  const capRaw = Deno.env.get("AI_DAILY_BUDGET_USD");
  if (!capRaw) return;
  const cap = Number(capRaw);
  if (!Number.isFinite(cap)) return;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await db
    .from("ai_invocations")
    .select("estimated_cost_usd")
    .eq("organization_id", organizationId)
    .gte("created_at", startOfDay.toISOString());
  if (error) throw new AppError("internal", "Falha ao verificar orçamento diário", { cause: error });

  const spent = (data ?? []).reduce(
    (sum: number, row: { estimated_cost_usd: number | null }) => sum + (row.estimated_cost_usd ?? 0),
    0,
  );

  if (spent >= cap) {
    log.warn("orçamento diário de IA no limite", { spent, cap, priority });
    if (priority !== "critical") {
      throw new AppError("rate_limited", `Orçamento diário de IA (US$ ${cap}) atingido`);
    }
  }
}

async function recordInvocation(
  db: SupabaseClient,
  fields: {
    organizationId: string;
    correlationId?: string;
    promptKey: string;
    promptVersion?: number;
    operation: string;
    provider: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    costUsd: number | null;
    latencyMs: number;
    status: "success" | "error" | "fallback";
    error?: string;
    fallbackFrom?: string;
    subject?: { type: string; id: string };
  },
): Promise<string | null> {
  const { data, error } = await db
    .from("ai_invocations")
    .insert({
      organization_id: fields.organizationId,
      correlation_id: fields.correlationId,
      prompt_key: fields.promptKey,
      prompt_version: fields.promptVersion,
      operation: fields.operation,
      provider: fields.provider,
      model: fields.model,
      input_tokens: fields.inputTokens,
      output_tokens: fields.outputTokens,
      estimated_cost_usd: fields.costUsd,
      latency_ms: fields.latencyMs,
      status: fields.status,
      error: fields.error,
      fallback_from: fields.fallbackFrom,
      subject_type: fields.subject?.type,
      subject_id: fields.subject?.id,
    })
    .select("id")
    .single();

  // Falha ao gravar a invocação não deve derrubar a chamada que já aconteceu
  // e já custou dinheiro — registrada aqui, não propagada.
  if (error) return null;
  return (data as { id: string }).id;
}

export async function invoke<T = unknown>(
  input: AIInvokeInput,
  deps: { db?: SupabaseClient; log?: Logger } = {},
): Promise<AIInvokeResult<T>> {
  const db = deps.db ?? serviceRoleClient();
  const log = deps.log ?? createLogger({
    correlationId: input.correlationId ?? "sem-correlation-id",
    fn: "ai-gateway",
    organizationId: input.organizationId,
  });
  const priority = input.priority ?? "normal";

  let prompt: PromptRow | null;
  try {
    prompt = await loadPrompt(db, input.promptKey, input.organizationId, input.promptVersion);
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha ao carregar prompt", error);
    return { ok: false, error: { code: "misconfigured", message: error.message }, invocationId: null };
  }

  if (!prompt) {
    return {
      ok: false,
      error: { code: "prompt_not_found", message: `Prompt não encontrado: ${input.promptKey}` },
      invocationId: null,
    };
  }

  try {
    await checkBudget(db, input.organizationId, priority, log);
  } catch (thrown) {
    const error = toAppError(thrown);
    return { ok: false, error: { code: "budget_exceeded", message: error.message }, invocationId: null };
  }

  let providers: ProviderRow[];
  try {
    providers = await loadProviders(db, input.organizationId);
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha ao carregar provedores", error);
    return { ok: false, error: { code: "misconfigured", message: error.message }, invocationId: null };
  }

  const active = providers
    .map((row) => ({ row, provider: PROVIDER_FACTORIES[row.key]?.() ?? null }))
    .filter((entry): entry is { row: ProviderRow; provider: AIProvider } => entry.provider !== null);

  if (active.length === 0) {
    return {
      ok: false,
      error: {
        code: "misconfigured",
        message: "Nenhum provedor de IA ativo e configurado para esta organização",
      },
      invocationId: null,
    };
  }

  let userPrompt: string;
  try {
    userPrompt = renderTemplate(prompt.user_template, input.variables);
  } catch (thrown) {
    return {
      ok: false,
      error: { code: "misconfigured", message: (thrown as Error).message },
      invocationId: null,
    };
  }

  let fallbackFrom: string | undefined;
  let lastError: AppError | null = null;

  for (const { row, provider } of active) {
    const startedAt = Date.now();
    let validationFeedback: string | undefined;
    /** Modelo da última resposta recebida deste provedor, para o registro de falha ao final. */
    let lastModel: string | undefined;

    // Até duas tentativas por provedor: a primeira, e uma só de retentativa
    // se a saída não bater com o schema. Falha de schema não troca de
    // provedor — é problema de prompt, e trocar de modelo só mascararia
    // (docs/05 §1, "Fallback").
    for (let attempt = 0; attempt < 2; attempt++) {
      let call: ProviderCallResult;
      try {
        call = await provider.call({
          systemPrompt: prompt.system_prompt,
          userPrompt,
          outputSchema: prompt.output_schema,
          modelHint: prompt.model_hint,
          temperature: prompt.temperature,
          validationErrorFeedback: validationFeedback,
        });
      } catch (thrown) {
        lastError = toAppError(thrown);
        break; // erro de rede/provedor: não adianta retentar aqui, passa para o próximo provedor
      }
      lastModel = call.model;

      if (!prompt.output_schema) {
        const invocationId = await recordInvocation(db, {
          organizationId: input.organizationId,
          correlationId: input.correlationId,
          promptKey: input.promptKey,
          promptVersion: prompt.version,
          operation: input.operation,
          provider: row.key,
          model: call.model,
          inputTokens: call.inputTokens,
          outputTokens: call.outputTokens,
          costUsd: estimateCostUsd(call.inputTokens, call.outputTokens, row.config?.pricing?.[call.model]),
          latencyMs: Date.now() - startedAt,
          status: fallbackFrom ? "fallback" : "success",
          fallbackFrom,
          subject: input.subject,
        });
        return {
          ok: true,
          data: call.raw as T,
          invocationId: invocationId ?? "",
          provider: row.key,
          model: call.model,
          costUsd: estimateCostUsd(call.inputTokens, call.outputTokens, row.config?.pricing?.[call.model]),
        };
      }

      const result = validateOutput(prompt.output_schema, call.raw);
      if (result.valid) {
        const costUsd = estimateCostUsd(call.inputTokens, call.outputTokens, row.config?.pricing?.[call.model]);
        const invocationId = await recordInvocation(db, {
          organizationId: input.organizationId,
          correlationId: input.correlationId,
          promptKey: input.promptKey,
          promptVersion: prompt.version,
          operation: input.operation,
          provider: row.key,
          model: call.model,
          inputTokens: call.inputTokens,
          outputTokens: call.outputTokens,
          costUsd,
          latencyMs: Date.now() - startedAt,
          status: fallbackFrom ? "fallback" : "success",
          fallbackFrom,
          subject: input.subject,
        });
        return {
          ok: true,
          data: call.raw as T,
          invocationId: invocationId ?? "",
          provider: row.key,
          model: call.model,
          costUsd,
        };
      }

      validationFeedback = result.message;
      lastError = new AppError("bad_request", `Saída fora do schema: ${result.message}`);
      log.warn("saída de IA fora do output_schema", { attempt, provider: row.key, message: result.message });
    }

    // As duas tentativas deste provedor esgotaram — registra e tenta o
    // próximo provedor da fila (fallback de verdade, não de schema).
    await recordInvocation(db, {
      organizationId: input.organizationId,
      correlationId: input.correlationId,
      promptKey: input.promptKey,
      promptVersion: prompt.version,
      operation: input.operation,
      provider: row.key,
      model: lastModel ?? prompt.model_hint ?? row.key,
      costUsd: null,
      latencyMs: Date.now() - startedAt,
      status: "error",
      error: lastError?.message,
      fallbackFrom,
      subject: input.subject,
    });

    fallbackFrom = row.key;
  }

  return {
    ok: false,
    error: {
      code: "all_providers_failed",
      message: lastError?.message ?? "Todos os provedores de IA falharam",
    },
    invocationId: null,
  };
}

export type { AIInvokeInput, AIInvokeResult } from "./types.ts";
