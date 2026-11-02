import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { readConsent, saveConsent, type Consent } from "@/lib/consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  function choose(value: Consent) {
    saveConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border-sub bg-navy-card/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-6 py-5 text-center md:flex-row md:justify-between md:text-left md:px-8">
        <p className="text-[13px] leading-relaxed text-cream-dim">
          Usamos cookies de análise (HubSpot) para entender quais conteúdos ajudam você e melhorar o
          site, em conformidade com a LGPD.{" "}
          <Link to="/privacidade" className="text-gold hover:underline">
            Saiba mais
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="whitespace-nowrap text-[13px] text-cream-dim underline-offset-4 hover:underline"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="btn-gold whitespace-nowrap"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
