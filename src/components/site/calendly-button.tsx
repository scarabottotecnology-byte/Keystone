import { useEffect } from "react";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export const CALENDLY_URL = "https://calendly.com/scarabotto-tecnology";

const CALENDLY_JS = "https://assets.calendly.com/assets/external/widget.js";
const CALENDLY_CSS = "https://assets.calendly.com/assets/external/widget.css";

// O widget só é baixado nas páginas que têm o botão, e depois que a página
// carregou: no <head> de todas as rotas ele bloqueava a primeira pintura e
// pesava no Core Web Vitals (e no ranking) sem uso nenhum.
function loadCalendly() {
  if (typeof document === "undefined" || document.querySelector(`script[src="${CALENDLY_JS}"]`))
    return;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = CALENDLY_CSS;
  document.head.appendChild(css);
  const js = document.createElement("script");
  js.src = CALENDLY_JS;
  js.async = true;
  document.head.appendChild(js);
}

export function CalendlyButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    loadCalendly();
  }, []);

  function open(e: React.MouseEvent) {
    e.preventDefault();
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    } else {
      // Widget script hasn't loaded yet (slow connection) — fall back to a direct visit.
      window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
