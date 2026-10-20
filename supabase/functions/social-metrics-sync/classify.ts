/**
 * Atributos de um post que a análise de engajamento compara.
 *
 * Módulo puro — sem Deno, sem rede — para ser testável no vitest como os
 * demais. As regras aqui definem os segmentos de `ai_learnings`; mudar uma
 * delas muda o que o sistema aprende, então cada uma é explícita.
 */

export type PostFormat =
  | "texto"
  | "imagem"
  | "carrossel"
  | "documento"
  | "video";
export type HookType = "pergunta" | "numero" | "afirmacao";

export function classifyFormat(assets: { type: string }[]): PostFormat {
  if (assets.some((a) => a.type === "document")) return "documento";
  if (assets.some((a) => a.type === "video")) return "video";
  const images = assets.filter((a) => a.type === "image").length;
  if (images > 1) return "carrossel";
  if (images === 1) return "imagem";
  return "texto";
}

/** Primeira linha não vazia: é o que aparece antes do "ver mais". */
export function hookOf(text: string): string {
  const line = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  return (line ?? "").slice(0, 300);
}

export function classifyHook(hook: string): HookType {
  if (hook.includes("?")) return "pergunta";
  if (/\d|%/.test(hook)) return "numero";
  return "afirmacao";
}

export function countHashtags(text: string): number {
  return (text.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;
}

export function hasLink(text: string): boolean {
  return /https?:\/\//i.test(text);
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Hora e dia da semana no fuso da organização — é o horário que o público vive. */
export function localTime(
  iso: string,
  timeZone: string,
): { hour: number; dow: number; date: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return {
    hour: Number(parts.hour) % 24,
    dow: WEEKDAYS[parts.weekday] ?? 0,
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export interface MetricColumns {
  impressions: number | null;
  reach: number | null;
  views: number | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  follows: number | null;
  engagement_rate: number | null;
}

/**
 * Converte a lista de métricas do Buffer em colunas.
 *
 * Métrica que a rede não informa fica nula — nunca zero. `likes` entra como
 * `reactions` quando a rede não usa o nome novo.
 */
export function metricColumns(
  metrics: { type: string; value: number | null }[] | null,
): MetricColumns {
  const byType = new Map(
    (metrics ?? []).map((m) => [m.type, m.value ?? null]),
  );
  const pick = (type: string) =>
    byType.has(type) ? byType.get(type) ?? null : null;
  return {
    impressions: pick("impressions"),
    reach: pick("reach"),
    views: pick("views"),
    reactions: pick("reactions") ?? pick("likes"),
    comments: pick("comments"),
    shares: pick("shares") ?? pick("reposts"),
    saves: pick("saves"),
    clicks: pick("clicks"),
    follows: pick("follows"),
    engagement_rate: pick("engagementRate"),
  };
}
