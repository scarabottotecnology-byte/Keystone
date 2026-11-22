import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { readConsent, saveConsent, type Consent } from "@/lib/consent";
import { localeFromPath } from "@/lib/i18n";

const COPY = {
  pt: {
    region: "Aviso de cookies",
    text: "Usamos cookies de análise e marketing (HubSpot e Meta) para entender quais conteúdos ajudam você, medir nossos anúncios e melhorar o site, em conformidade com a LGPD.",
    more: "Saiba mais",
    privacy: "/privacidade",
    decline: "Recusar",
    accept: "Aceitar",
  },
  en: {
    region: "Cookie notice",
    text: "We use analytics and marketing cookies (HubSpot and Meta) to understand which content helps you, measure our ads and improve the site, in line with Brazil's data protection law (LGPD).",
    more: "Learn more",
    privacy: "/en/privacy",
    decline: "Decline",
    accept: "Accept",
  },
} as const;

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = COPY[localeFromPath(pathname)];

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
      aria-label={t.region}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border-sub bg-navy-card/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-6 py-5 text-center md:flex-row md:justify-between md:text-left md:px-8">
        <p className="text-[13px] leading-relaxed text-cream-dim">
          {t.text}{" "}
          <Link to={t.privacy} className="text-gold hover:underline">
            {t.more}
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="whitespace-nowrap text-[13px] text-cream-dim underline-offset-4 hover:underline"
          >
            {t.decline}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="btn-gold whitespace-nowrap"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
