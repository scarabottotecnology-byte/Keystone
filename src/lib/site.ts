// Endereço público do site. Canonical, og:url, sitemap e dados estruturados
// partem daqui: um link relativo ou de outro domínio no canonical faz o Google
// indexar o endereço errado.
export const SITE_URL = "https://keystone-contabilidade.com";

// Hosts antigos ou alternativos que devem redirecionar (301) para SITE_URL,
// para não haver conteúdo duplicado entre domínios.
export const REDIRECT_HOSTS = ["keystone-phi.vercel.app", "www.keystone-contabilidade.com"];

// Código da tag HTML do Google Search Console (Configurações > Verificação de
// propriedade > Tag HTML: só o valor de content="..."). Vazio = sem a tag.
// Dispensável se a propriedade for verificada por DNS na Hostinger.
export const GOOGLE_SITE_VERIFICATION = "";

export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonical(path: string) {
  return { rel: "canonical", href: absoluteUrl(path) };
}

type SeoOptions = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  noindex?: boolean;
};

/**
 * Cabeçalho de SEO de uma página: title, description, Open Graph e canonical
 * saem juntos, para nenhuma página ficar sem og:url ou herdar o og:title
 * genérico da raiz. Mire em title até 60 caracteres e description entre 120 e
 * 160: acima disso o Google corta no resultado de busca.
 */
export function seo(path: string, o: SeoOptions) {
  return {
    meta: [
      { title: o.title },
      { name: "description", content: o.description },
      { property: "og:title", content: o.ogTitle ?? o.title },
      { property: "og:description", content: o.ogDescription ?? o.description },
      { property: "og:url", content: absoluteUrl(path) },
      ...(o.noindex ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: [canonical(path)],
  };
}
