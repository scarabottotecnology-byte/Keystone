/**
 * Idiomas do site. O português fica na raiz (/, /servicos...) e o inglês em
 * /en. O conteúdo em inglês não é tradução literal: fala com empresas de fora
 * do Brasil (controladoria remota), então nem toda página tem par.
 */
export type Locale = "pt" | "en";

export const EN_PREFIX = "/en";

export function localeFromPath(pathname: string): Locale {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? "en" : "pt";
}

/** Páginas equivalentes nos dois idiomas: alimentam o hreflang e o seletor PT/EN. */
const PAIRS: [pt: string, en: string][] = [
  ["/", "/en"],
  ["/servicos", "/en/services"],
  ["/servicos/bpo-financeiro", "/en/services/financial-bpo"],
  ["/servicos/gestao-e-indicadores", "/en/services/controllership-as-a-service"],
  ["/metodologias", "/en/methodology"],
  ["/trocar-de-contabilidade", "/en/switching"],
  ["/contato", "/en/contact"],
  ["/privacidade", "/en/privacy"],
];

function normalize(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** Página equivalente no outro idioma, ou null se ela não existir. */
export function alternatePath(pathname: string): { pt: string; en: string } | null {
  const p = normalize(pathname);
  const pair = PAIRS.find(([pt, en]) => pt === p || en === p);
  return pair ? { pt: pair[0], en: pair[1] } : null;
}

/** Para onde o seletor de idioma leva: a página equivalente ou a home do outro idioma. */
export function switchLocalePath(pathname: string): string {
  const alt = alternatePath(pathname);
  const target: Locale = localeFromPath(pathname) === "en" ? "pt" : "en";
  if (alt) return alt[target];
  return target === "en" ? EN_PREFIX : "/";
}
