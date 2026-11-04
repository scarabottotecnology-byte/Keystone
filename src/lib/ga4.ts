// Google Analytics 4. Mede tráfego, origem (orgânico, direto, campanha) e
// conversões (lead enviado). Vazio = desligado. O Measurement ID (G-XXXXXXX)
// fica em Google Analytics > Administrador > Fluxos de dados > seu site.
// Carrega só depois do "Aceitar" nos cookies, igual ao Pixel do Meta.
export const GA4_MEASUREMENT_ID = "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function loadGa4(): void {
  if (!GA4_MEASUREMENT_ID || typeof window === "undefined" || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID, { send_page_view: true });
}

export function trackGa4PageView(path: string): void {
  window.gtag?.("event", "page_view", { page_path: path });
}

/** Conversão de lead: formulário de contato, proposta, diagnóstico ou ferramenta. */
export function trackGa4Lead(origem: string): void {
  window.gtag?.("event", "generate_lead", { lead_origin: origem });
}
