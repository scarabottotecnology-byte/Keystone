/**
 * Leitura mínima de RSS e pontuação de relevância.
 *
 * Módulo puro. O runtime das Edge Functions não traz `DOMParser`, e os feeds
 * usados aqui (Google Trends, Google Notícias, portais) são RSS 2.0 simples:
 * extrair `<item>` por expressão regular é suficiente e não puxa dependência.
 */

export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  traffic: string | null;
  newsUrl: string | null;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string | null {
  const match = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"),
  );
  return match ? decode(match[1]) : null;
}

export function parseRss(xml: string): FeedItem[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  return items.map((block) => ({
    title: tag(block, "title") ?? "",
    link: tag(block, "link") ?? "",
    // No Google Trends o contexto vem nas manchetes ligadas ao termo.
    description: tag(block, "description") ??
      (block.match(/<ht:news_item_title>[\s\S]*?<\/ht:news_item_title>/gi) ??
        []).map((t) => decode(t)).join(" "),
    pubDate: tag(block, "pubDate"),
    traffic: tag(block, "ht:approx_traffic"),
    newsUrl: tag(block, "ht:news_item_url"),
  })).filter((item) => item.title.length > 0);
}

export interface Keyword {
  keyword: string;
  weight: number;
  pillar: string | null;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Soma o peso das palavras-chave da Keystone presentes no texto, limitada a
 * 100. A comparação ignora acento e caixa; palavra curta exige fronteira de
 * palavra, para "dre" não casar com "padre".
 */
export function scoreRelevance(
  text: string,
  keywords: Keyword[],
): { relevance: number; matched: Keyword[] } {
  const haystack = normalize(text);
  const matched = keywords.filter((k) => {
    const needle = normalize(k.keyword);
    if (needle.length <= 4) {
      const escaped = needle.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
    }
    return haystack.includes(needle);
  });
  const relevance = Math.min(
    100,
    matched.reduce((sum, k) => sum + k.weight, 0),
  );
  return { relevance, matched };
}

/** "20.000+" ou "1M+" do Google Trends em número aproximado. */
export function trafficToNumber(traffic: string | null): number {
  if (!traffic) return 0;
  const m = traffic.replace(/\./g, "").replace(",", ".").match(
    /([\d.]+)\s*(k|mil|m|mi)?/i,
  );
  if (!m) return 0;
  const base = Number(m[1]);
  const unit = (m[2] ?? "").toLowerCase();
  return unit === "k" || unit === "mil"
    ? base * 1_000
    : unit === "m" || unit === "mi"
    ? base * 1_000_000
    : base;
}
