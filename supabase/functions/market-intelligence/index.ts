/**
 * Agente A1 — Market Intelligence (docs/05-AGENTES-DE-IA.md §4).
 *
 * Disparado por cron via n8n (WF-015), não por um usuário logado — por isso
 * autentica por segredo compartilhado (`x-automation-secret`), não pelo JWT
 * que `_shared/auth.ts` verifica. Não é o atalho do achado C-01: não há
 * sessão de usuário para agir em nome de, e o escopo por organização é
 * resolvido explicitamente aqui (hoje sempre a Keystone, ADR-014), nunca
 * implicitamente por RLS. Mesmo raciocínio já registrado para
 * `automation_runs` e para `ai-gateway`.
 *
 * Fontes sem conteúdo (zero `market_intelligence_sources` ativas) não é erro
 * — é o estado real de quem ainda não configurou nenhuma. A execução
 * termina `succeeded` com `items_processed: 0`, não falha.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { invoke } from "../_shared/ai-gateway/gateway.ts";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { isAutomationSecretValid } from "../_shared/secrets.ts";
import { extractPlainText, truncate } from "../_shared/sourceContent.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "content-type, x-automation-secret, x-correlation-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_SOURCE_CHARS = 6000;
const FETCH_TIMEOUT_MS = 15_000;

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

function jsonResponse(
  body: unknown,
  status: number,
  correlationId: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      [CORRELATION_HEADER]: correlationId,
    },
  });
}

/**
 * Confere o segredo de automação — ambiente primeiro, Vault depois.
 *
 * Antes exigia `AUTOMATION_WEBHOOK_SECRET` no ambiente e falhava com
 * `misconfigured` quando ele não existia. Como a migração para o Vault moveu
 * o segredo para dentro do banco, esta função passou a recusar **toda**
 * execução do cron: A1 nunca rodou uma única vez desde então, e por isso
 * `ai_insights` está vazia e nenhuma pauta nova foi gerada. O `social-publish`
 * já tinha sido migrado; este ficou para trás e ninguém notou, porque o cron
 * registra `succeeded` (a chamada HTTP saiu) mesmo quando a função devolve
 * 500 — o erro só aparece no corpo da resposta.
 */
async function verifyAutomationSecret(
  request: Request,
  db: SupabaseClient,
): Promise<void> {
  const provided = request.headers.get("x-automation-secret");
  if (!await isAutomationSecretValid(db, provided)) {
    throw new AppError(
      "unauthorized",
      "Segredo de automação ausente ou inválido",
    );
  }
}

interface FetchedSource {
  name: string;
  url: string;
  content: string;
}

async function fetchSource(name: string, url: string): Promise<FetchedSource> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    return {
      name,
      url,
      content: truncate(extractPlainText(raw), MAX_SOURCE_CHARS),
    };
  } finally {
    clearTimeout(timeout);
  }
}

interface InsightPayload {
  type: string;
  title: string;
  description: string;
  source: string;
  source_url: string;
  observed_at: string;
  relevance: number;
  category?: string;
  commercial_potential: number;
  recommendation?: string;
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "market-intelligence" });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const db: SupabaseClient = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let runId: string | null = null;

  try {
    if (request.method !== "POST") {
      throw new AppError("bad_request", "Método não suportado — use POST");
    }
    await verifyAutomationSecret(request, db);

    // ADR-014: ferramenta interna, uma organização só. Se isso mudar, o
    // payload do webhook precisa trazer organization_id — não adivinhar.
    const { data: org, error: orgError } = await db
      .from("organizations")
      .select("id")
      .eq("slug", "keystone")
      .single();
    if (orgError || !org) {
      throw new AppError("internal", "Organização Keystone não encontrada", {
        cause: orgError,
      });
    }
    const organizationId = (org as { id: string }).id;

    const { data: run, error: runError } = await db
      .from("automation_runs")
      .insert({
        organization_id: organizationId,
        definition_key: "WF-015-market-intelligence",
        correlation_id: correlationId,
        trigger_type: "schedule",
      })
      .select("id")
      .single();
    if (runError) {
      throw new AppError(
        "internal",
        "Falha ao registrar execução da automação",
        { cause: runError },
      );
    }
    runId = (run as { id: string }).id;

    const { data: sources, error: sourcesError } = await db
      .from("market_intelligence_sources")
      .select("name, url")
      .eq("organization_id", organizationId)
      .eq("is_active", true);
    if (sourcesError) {
      throw new AppError("internal", "Falha ao carregar fontes de mercado", {
        cause: sourcesError,
      });
    }

    if (!sources || sources.length === 0) {
      await db.from("automation_runs").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        items_processed: 0,
        error_summary: "Nenhuma fonte ativa configurada",
      }).eq("id", runId);
      log.info("nenhuma fonte ativa — nada a analisar");
      return jsonResponse(
        { insights_created: 0, reason: "no_active_sources" },
        200,
        correlationId,
      );
    }

    const { data: pillars, error: pillarsError } = await db
      .from("content_pillars")
      .select("name")
      .eq("organization_id", organizationId)
      .eq("is_active", true);
    if (pillarsError) {
      throw new AppError("internal", "Falha ao carregar pilares de conteúdo", {
        cause: pillarsError,
      });
    }

    const fetched = await Promise.allSettled(
      (sources as { name: string; url: string }[]).map((s) =>
        fetchSource(s.name, s.url)
      ),
    );
    const succeeded = fetched
      .filter((r): r is PromiseFulfilledResult<FetchedSource> =>
        r.status === "fulfilled"
      )
      .map((r) => r.value);
    const sourcesFailed = fetched.length - succeeded.length;

    if (succeeded.length === 0) {
      await db.from("automation_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        items_failed: fetched.length,
        error_summary: "Todas as fontes ativas falharam ao buscar conteúdo",
      }).eq("id", runId);
      return jsonResponse(
        {
          error: {
            code: "all_sources_failed",
            message: "Todas as fontes falharam ao buscar conteúdo",
          },
        },
        502,
        correlationId,
      );
    }

    const sourcesText = succeeded.map((s) =>
      `### ${s.name} (${s.url})\n${s.content}`
    ).join("\n\n");
    const pillarsText = ((pillars as { name: string }[] | null) ?? []).map((
      p,
    ) => `- ${p.name}`).join("\n");

    const result = await invoke<{ insights: InsightPayload[] }>(
      {
        promptKey: "market_intelligence.analyze",
        operation: "market_intelligence",
        organizationId,
        correlationId,
        variables: { sources: sourcesText, pillars: pillarsText },
      },
      { db, log },
    );

    if (!result.ok) {
      await db.from("automation_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_summary: `${result.error.code}: ${result.error.message}`,
      }).eq("id", runId);
      return jsonResponse({ error: result.error }, 502, correlationId);
    }

    const insights = result.data.insights ?? [];
    let created = 0;
    for (const insight of insights) {
      const { error: insertError } = await db.from("ai_insights").insert({
        organization_id: organizationId,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        source: insight.source,
        source_url: insight.source_url,
        observed_at: insight.observed_at,
        relevance: insight.relevance,
        category: insight.category,
        commercial_potential: insight.commercial_potential,
        recommendation: insight.recommendation,
        ai_invocation_id: result.invocationId || null,
      });
      if (insertError) {
        log.warn("falha ao gravar um insight — os demais seguem", {
          error: insertError.message,
        });
      } else {
        created++;
      }
    }

    await db.from("automation_runs").update({
      status: "succeeded",
      finished_at: new Date().toISOString(),
      items_processed: insights.length,
      items_succeeded: created,
      items_failed: (insights.length - created) + sourcesFailed,
    }).eq("id", runId);

    log.info("execução concluída", {
      insights_created: created,
      sources_failed: sourcesFailed,
    });

    return jsonResponse(
      {
        insights_created: created,
        sources_analyzed: succeeded.length,
        sources_failed: sourcesFailed,
      },
      200,
      correlationId,
    );
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha na execução de market-intelligence", error);
    if (runId) {
      // Melhor esforço: se até isto falhar, a run fica "running" para sempre
      // — visível como travada em qualquer painel de execuções, não perdida
      // em silêncio, mas também não pode derrubar a resposta de erro real.
      try {
        await db.from("automation_runs").update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_summary: error.message,
        }).eq("id", runId);
      } catch {
        // ver comentário acima
      }
    }
    return jsonResponse(
      error.toResponseBody(),
      error.httpStatus,
      correlationId,
    );
  }
});
