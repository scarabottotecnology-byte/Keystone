// Endereço público do site. Canonical, og:url, sitemap e dados estruturados
// partem daqui: um link relativo ou de outro domínio no canonical faz o Google
// indexar o endereço errado.
export const SITE_URL = "https://keystone-contabilidade.com";

// Hosts antigos ou alternativos que devem redirecionar (301) para SITE_URL,
// para não haver conteúdo duplicado entre domínios.
export const REDIRECT_HOSTS = ["keystone-phi.vercel.app", "www.keystone-contabilidade.com"];

export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonical(path: string) {
  return { rel: "canonical", href: absoluteUrl(path) };
}
