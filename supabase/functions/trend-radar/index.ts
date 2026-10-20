/**
 * Radar de tendências — o que o mercado está discutindo agora, sem IA paga.
 *
 * Lê o Google Trends Brasil (o que está em alta hoje), buscas do Google
 * Notícias com os temas da Keystone e as fontes de
 * `market_intelligence_sources`. Cada item recebe uma nota de relevância pela
 * soma do peso das palavras-chave de `seo_keywords` que aparecem nele. O que
 * passa do corte vira `trend_signals`; o que é forte vira `ai_insights`, de
 * onde a estratégia de conteúdo tira pauta.
 *
 * Foi assim que a escala 6x1 deveria ter sido pega: alta no Trends e palavra
 * "escala 6x1" na lista.
 */
import { createClient } from "@supabase/supabase-js";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { isAutomationSecretValid } from "../_shared/secrets.ts";
import {
  type FeedItem,
  type Keyword,
  parseRss,
  scoreRelevance,
  trafficToNumber,
} from "./rss.ts";

const FETCH_TIMEOUT_MS = 12_000;
/** Abaixo disso o item é ruído para a Keystone e nem é gravado. */
const MIN_RELEVANCE = 20;
/** A partir disso o item vira pauta em `ai_insights`. */
const PROMOTE_RELEVANCE = 45;

const NEWS_QUERIES = [
  '"escala 6x1" OR "jornada de trabalho" empresas',
  '"reforma tributária" empresas',
  '"Simples Nacional" OR "MEI" mudanças',
  'controladoria OR "gestão financeira" empresas',
  '"fluxo de caixa" OR inadimplência empresas',
  "Selic juros crédito empresas",
  '"folha de pagamento" encargos',
];

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

async function fetchFeed(url: string): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (KeystoneGrowthOS trend-radar)" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseRss(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

interface Source {
  name: string;
  url: string;
  kind: "google_trends" | "google_news" | "rss";
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "trend-radar" });
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
      .from("organizations").select("id").eq("slug", "keystone").single();
    if (orgError || !org) {
      throw new AppError("internal", "Organização Keystone não encontrada", {
        cause: orgError,
      });
    }
    const organizationId = (org as { id: string }).id;

    const { data: run } = await db.from("automation_runs").insert({
      organization_id: organizationId,
      definition_key: "WF-016-trend-radar",
      correlation_id: correlationId,
      trigger_type: "schedule",
    }).select("id").single();
    runId = (run as { id: string } | null)?.id ?? null;

    const { data: keywordRows, error: kwError } = await db
      .from("seo_keywords")
      .select("keyword, weight, pillar")
      .eq("organization_id", organizationId);
    if (kwError) {
      throw new AppError("internal", "Falha ao carregar palavras-chave", {
        cause: kwError,
      });
    }
    const keywords = (keywordRows ?? []) as Keyword[];

    const { data: rssRows } = await db
      .from("market_intelligence_sources")
      .select("name, url")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    const sources: Source[] = [
      {
        name: "Google Trends Brasil",
        url: "https://trends.google.com/trending/rss?geo=BR",
        kind: "google_trends",
      },
      ...NEWS_QUERIES.map((q) => ({
        name: `Google Notícias: ${q}`,
        url: `https://news.google.com/rss/search?q=${
          encodeURIComponent(`${q} when:7d`)
        }&hl=pt-BR&gl=BR&ceid=BR:pt-419`,
        kind: "google_news" as const,
      })),
      ...((rssRows ?? []) as { name: string; url: string }[]).map((s) => ({
        name: s.name,
        url: s.url,
        kind: "rss" as const,
      })),
    ];

    const results = await Promise.allSettled(
      sources.map((s) => fetchFeed(s.url)),
    );

    const failures: string[] = [];
    const signals = new Map<string, Record<string, unknown>>();

    results.forEach((result, i) => {
      const source = sources[i];
      if (result.status === "rejected") {
        failures.push(`${source.name}: ${String(result.reason)}`);
        return;
      }
      for (const item of result.value.slice(0, 40)) {
        const { relevance: base, matched } = scoreRelevance(
          `${item.title} ${item.description}`,
          keywords,
        );
        if (matched.length === 0) continue;
        // Estar em alta no Trends é sinal por si: soma bônus pelo volume.
        const bonus = source.kind === "google_trends"
          ? 15 + Math.min(15, Math.log10(trafficToNumber(item.traffic) + 1) * 3)
          : 0;
        const relevance = Math.min(100, Math.round(base + bonus));
        if (relevance < MIN_RELEVANCE) continue;

        const url = source.kind === "google_trends"
          ? (item.newsUrl ||
            `https://trends.google.com/trends/explore?geo=BR&q=${
              encodeURIComponent(item.title)
            }`)
          : item.link;
        if (!url) continue;

        const observed = item.pubDate ? new Date(item.pubDate) : null;
        const existing = signals.get(url);
        if (existing && (existing.relevance as number) >= relevance) continue;
        signals.set(url, {
          organization_id: organizationId,
          source: source.kind === "rss" ? source.name : source.kind,
          title: item.title.slice(0, 500),
          url,
          traffic: item.traffic,
          matched_keywords: matched.map((k) => k.keyword),
          relevance,
          observed_at: observed && !isNaN(observed.getTime())
            ? observed.toISOString()
            : null,
          collected_at: new Date().toISOString(),
        });
      }
    });

    const rows = [...signals.values()];
    if (rows.length > 0) {
      const { error } = await db.from("trend_signals").upsert(rows, {
        onConflict: "organization_id,url",
        ignoreDuplicates: false,
      });
      if (error) {
        throw new AppError("internal", "Falha ao gravar tendências", {
          cause: error,
        });
      }
    }

    // Os mais fortes viram pauta. Só promove uma vez por URL.
    const { data: toPromote } = await db
      .from("trend_signals")
      .select(
        "id, title, url, source, relevance, matched_keywords, observed_at",
      )
      .eq("organization_id", organizationId)
      .is("promoted_insight_id", null)
      .gte("relevance", PROMOTE_RELEVANCE)
      .gte(
        "collected_at",
        new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      )
      .order("relevance", { ascending: false })
      .limit(10);

    const pillarOf = new Map(keywords.map((k) => [k.keyword, k.pillar]));
    let promoted = 0;
    for (const t of (toPromote ?? []) as Record<string, unknown>[]) {
      const matched = (t.matched_keywords as string[]) ?? [];
      const { data: insight, error } = await db.from("ai_insights").insert({
        organization_id: organizationId,
        type: "trend",
        title: t.title,
        description: `Tema em evidência (${t.source}). Palavras-chave: ${
          matched.join(", ")
        }.`,
        source: t.source,
        source_url: t.url,
        observed_at: t.observed_at ?? new Date().toISOString(),
        relevance: t.relevance,
        category: pillarOf.get(matched[0]) ?? "mercado",
        commercial_potential: Math.min(100, Number(t.relevance)),
        recommendation:
          "Publicar enquanto o tema está em alta: carrossel no Instagram, " +
          "infográfico no LinkedIn e imagem + story no Facebook, ligando o " +
          "tema ao impacto em custo, margem ou caixa da empresa.",
      }).select("id").single();
      if (error || !insight) {
        log.warn("falha ao promover tendência", { error: error?.message });
        continue;
      }
      await db.from("trend_signals")
        .update({ promoted_insight_id: (insight as { id: string }).id })
        .eq("id", t.id as string);
      promoted++;
    }

    if (runId) {
      await db.from("automation_runs").update({
        status: failures.length === sources.length
          ? "failed"
          : failures.length > 0
          ? "partial"
          : "succeeded",
        finished_at: new Date().toISOString(),
        items_processed: sources.length,
        items_succeeded: sources.length - failures.length,
        items_failed: failures.length,
        error_summary: failures.length > 0
          ? failures.join(" | ").slice(0, 1000)
          : null,
      }).eq("id", runId);
    }

    const summary = {
      fontes: sources.length,
      fontes_com_falha: failures,
      tendencias_gravadas: rows.length,
      pautas_criadas: promoted,
      top: rows
        .sort((a, b) => (b.relevance as number) - (a.relevance as number))
        .slice(0, 5)
        .map((r) => ({ titulo: r.title, relevancia: r.relevance })),
    };
    log.info("radar de tendências concluído", {
      fontes: summary.fontes,
      gravadas: summary.tendencias_gravadas,
      pautas: promoted,
    });
    return jsonResponse(summary, 200, correlationId);
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha no radar de tendências", error);
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
