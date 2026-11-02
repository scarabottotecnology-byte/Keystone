// Consentimento de cookies (LGPD). O rastreamento do HubSpot só carrega depois
// do "Aceitar"; quem recusa navega normalmente, sem cookies de análise.

const STORAGE_KEY = "keystone-cookie-consent";
const CHANGE_EVENT = "keystone:consent";

export type Consent = "accepted" | "declined";

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: Consent): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // navegador sem localStorage: a escolha vale só para esta visita
  }
  window.dispatchEvent(new CustomEvent<Consent>(CHANGE_EVENT, { detail: value }));
}

export function onConsentChange(listener: (value: Consent) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<Consent>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
