import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { onConsentChange, readConsent } from "@/lib/consent";
import { loadMetaPixel, trackMetaPageView } from "@/lib/meta-pixel";

export function MetaPixel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const firstPath = useRef(true);

  useEffect(() => {
    if (readConsent() === "accepted") {
      loadMetaPixel();
      return;
    }
    return onConsentChange((value) => {
      if (value === "accepted") loadMetaPixel();
    });
  }, []);

  // O site troca de página sem recarregar; sem isto o Meta só veria a primeira.
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname]);

  return null;
}
