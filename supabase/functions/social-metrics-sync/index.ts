/**
 * Coleta diária das métricas dos posts publicados (FASE 8, WF-003) e
 * atualização dos aprendizados (FASE 9, WF-004).
 *
 * Disparada pelo pg_cron, autentica por `x-automation-secret` como as demais
 * automações. Lê do Buffer tudo o que foi publicado nos últimos 120 dias —
 * venha da fila interna ou criado direto no Buffer — e grava um snapshot por
 * post por dia em `buffer_post_metrics`. Reexecutar no mesmo dia faz upsert.
 *
 * Em seguida chama `refresh_content_learnings`, que compara formato, horário,
 * gancho, tamanho e hashtags por canal e só ativa um aprendizado com amostra
 * e confiança mínimas.
 */
import { createClient } from "@supabase/supabase-js";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import {
  findSecret,
  isAutomationSecretValid,
  requireSecret,
} from "../_shared/secrets.ts";
import {
  listSentBufferPostsWithMetrics,
  resolveBufferOrganizationId,
} from "../_shared/buffer.ts";
import {
  classifyFormat,
  classifyHook,
  countHashtags,
  hasLink,
  hookOf,
  localTime,
  metricColumns,
} from "./classify.ts";

const WINDOW_DAYS = 120;

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
      "Content-Type": "application/json",
      [CORRELATION_HEADER]: correlationId,
    },
  });
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "social-metrics-sync" });
  const db = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  let runId: string | null = null;

  try {
    if (request.method !== "POST") {
      throw new AppError("bad_request", "Método não suportado — use POST");
    }
    if (
      !await isAutomationSecretValid(
        db,
        request.headers.get("x-automation-secret"),
      )
    ) {
      throw new AppError(
        "unauthorized",
        "Segredo de automação ausente ou inválido",
      );
    }

    const { data: org, error: orgError } = await db
      .from("organizations")
      .select("id, timezone")
      .eq("slug", "keystone")
      .single();
    if (orgError || !org) {
      throw new AppError("internal", "Organização Keystone não encontrada", {
        cause: orgError,
      });
    }
    const organizationId = (org as { id: string }).id;
    const timeZone = (org as { timezone: string | null }).timezone ??
      "America/Sao_Paulo";

    const { data: run } = await db.from("automation_runs").insert({
      organization_id: organizationId,
      definition_key: "WF-003-social-metrics-sync",
      correlation_id: correlationId,
      trigger_type: "schedule",
    }).select("id").single();
    runId = (run as { id: string } | null)?.id ?? null;

    const accessToken = await requireSecret(db, "buffer_access_token");
    const bufferOrgId = await resolveBufferOrganizationId(
      accessToken,
      await findSecret(db, "buffer_organization_id"),
    );

    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 3600 * 1000);
    const posts = await listSentBufferPostsWithMetrics({
      accessToken,
      organizationId: bufferOrgId,
      since,
    });

    const today = localTime(new Date().toISOString(), timeZone).date;
    const rows = posts
      .filter((p) => p.sentAt && p.metrics && p.metrics.length > 0)
      .map((p) => {
        const when = localTime(p.sentAt as string, timeZone);
        const hook = hookOf(p.text ?? "");
        return {
          organization_id: organizationId,
          buffer_post_id: p.id,
          channel_id: p.channelId,
          channel: p.channelService,
          format: classifyFormat(p.assets ?? []),
          asset_count: (p.assets ?? []).length,
          sent_at: p.sentAt,
          local_hour: when.hour,
          local_dow: when.dow,
          hook_type: classifyHook(hook),
          hook,
          text_length: (p.text ?? "").length,
          hashtag_count: countHashtags(p.text ?? ""),
          has_link: hasLink(p.text ?? ""),
          collected_for: today,
          ...metricColumns(p.metrics),
          metrics_updated_at: p.metricsUpdatedAt,
          raw: p.metrics ?? [],
        };
      });

    let written = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      const { error } = await db.from("buffer_post_metrics").upsert(batch, {
        onConflict: "buffer_post_id,collected_for",
      });
      if (error) {
        throw new AppError("internal", "Falha ao gravar métricas", {
          cause: error,
        });
      }
      written += batch.length;
    }

    const { data: learnings, error: learnError } = await db.rpc(
      "refresh_content_learnings",
      { p_organization_id: organizationId },
    );
    if (learnError) {
      throw new AppError("internal", "Falha ao atualizar aprendizados", {
        cause: learnError,
      });
    }

    const { count: active } = await db
      .from("ai_learnings")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (runId) {
      await db.from("automation_runs").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        items_processed: posts.length,
        items_succeeded: written,
        items_failed: 0,
      }).eq("id", runId);
    }

    const summary = {
      posts_lidos: posts.length,
      snapshots_gravados: written,
      segmentos_analisados: learnings,
      aprendizados_ativos: active ?? 0,
      coletado_para: today,
    };
    log.info("métricas sincronizadas", summary);
    return jsonResponse(summary, 200, correlationId);
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha na sincronização de métricas", error);
    if (runId) {
      await db.from("automation_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_summary: error.message,
      }).eq("id", runId);
    }
    return jsonResponse(
      error.toResponseBody(),
      error.httpStatus,
      correlationId,
    );
  }
});
