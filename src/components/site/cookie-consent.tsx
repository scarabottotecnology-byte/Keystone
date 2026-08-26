import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "keystone-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = window.localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage unavailable (e.g. blocked) — skip showing the banner
      // rather than risk throwing during hydration.
    }
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore write failures
    }
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
          Usamos cookies e dados de navegação para melhorar sua experiência neste site, em
          conformidade com a LGPD.{" "}
          <Link to="/privacidade" className="text-gold hover:underline">
            Saiba mais
          </Link>
          .
        </p>
        <button type="button" onClick={accept} className="btn-gold shrink-0 whitespace-nowrap">
          Aceitar
        </button>
      </div>
    </div>
  );
}
