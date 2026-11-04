import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { onConsentChange, readConsent } from "@/lib/consent";
import { loadGa4, trackGa4PageView } from "@/lib/ga4";

export function Ga4() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const firstPath = useRef(true);

  useEffect(() => {
    if (readConsent() === "accepted") {
      loadGa4();
      return;
    }
    return onConsentChange((value) => {
      if (value === "accepted") loadGa4();
    });
  }, []);

  // O site troca de página sem recarregar; sem isto o GA4 só veria a primeira.
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    trackGa4PageView(pathname);
  }, [pathname]);

  return null;
}
