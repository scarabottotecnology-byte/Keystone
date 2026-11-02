import { useEffect } from "react";
import { onConsentChange, readConsent } from "@/lib/consent";

// Conta 51638599 (Keystone). O script registra as páginas visitadas, liga a
// visita ao contato quando ele preenche um formulário ou clica num e-mail
// rastreado e captura os formulários do site como contatos no HubSpot
// ("formulários coletados"), sem precisar de chave de API.
const HUBSPOT_PORTAL_ID = "51638599";
const SCRIPT_ID = "hs-script-loader";

function loadHubspot() {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.defer = true;
  script.src = `https://js.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;
  document.body.appendChild(script);
}

export function HubspotTracking() {
  useEffect(() => {
    if (readConsent() === "accepted") {
      loadHubspot();
      return;
    }
    return onConsentChange((value) => {
      if (value === "accepted") loadHubspot();
    });
  }, []);

  return null;
}
