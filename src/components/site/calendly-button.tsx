declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export const CALENDLY_URL = "https://calendly.com/scarabotto-tecnology";

export function CalendlyButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
