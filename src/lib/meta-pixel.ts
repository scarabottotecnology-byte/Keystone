// Pixel do Meta (Facebook e Instagram Ads). Mede quem chega pelos anúncios,
// conta os leads como conversão e alimenta os públicos de remarketing.
// Vazio = desligado. O ID fica no Gerenciador de Eventos do Meta
// (Fontes de dados > Pixel). Carrega só depois do "Aceitar" nos cookies.
export const META_PIXEL_ID = "232313492073163";

// Código de verificação do domínio no Gerenciador de Negócios do Meta
// (Segurança da marca > Domínios > Meta tag). Vazio = sem a tag.
export const META_DOMAIN_VERIFICATION = "";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function loadMetaPixel(): void {
  if (!META_PIXEL_ID || typeof window === "undefined" || window.fbq) return;

  // Fila equivalente ao snippet oficial: as chamadas feitas antes do script
  // terminar de baixar são guardadas e executadas quando ele chega.
  const fbq: Fbq = (...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
}

export function trackMetaPageView(): void {
  window.fbq?.("track", "PageView");
}

/** Conversão de lead: formulário de contato, proposta, diagnóstico ou ferramenta. */
export function trackMetaLead(origem: string): void {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "Lead", { content_name: origem });
}
