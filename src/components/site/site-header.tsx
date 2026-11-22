import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { KeystoneMonogram } from "@/components/site/keystone-monogram";
import { switchLocalePath, type Locale } from "@/lib/i18n";

type NavItem = { label: string; to: string; highlight?: boolean };

const NAV: Record<Locale, NavItem[]> = {
  pt: [
    { label: "Serviços", to: "/servicos" },
    { label: "Ferramentas", to: "/ferramentas" },
    { label: "Diagnóstico", to: "/diagnostico", highlight: true },
    { label: "Contato", to: "/contato" },
  ],
  en: [
    { label: "Services", to: "/en/services" },
    { label: "Methodology", to: "/en/methodology" },
    { label: "Switching", to: "/en/switching" },
    { label: "Contact", to: "/en/contact" },
  ],
};

const COPY = {
  pt: {
    home: "/",
    tagline: "Contabilidade & Controladoria",
    cta: "Pedir proposta",
    ctaTo: "/contato",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    switchLabel: "EN",
    switchAria: "English version",
  },
  en: {
    home: "/en",
    tagline: "Controllership & Finance",
    cta: "Request a proposal",
    ctaTo: "/en/contact",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchLabel: "PT",
    switchAria: "Versão em português",
  },
} as const;

export function SiteHeader({ locale = "pt" }: { locale?: Locale }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = COPY[locale];
  const navItems = NAV[locale];
  const otherLocalePath = switchLocalePath(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-border-sub bg-navy/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 md:px-8">
        <Link to={t.home} className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <KeystoneMonogram size={30} />
          <div className="leading-none">
            <div className="font-display text-base font-medium tracking-wide text-cream">
              Keystone
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-cream-mute">
              {t.tagline}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-[11px] font-medium uppercase tracking-[0.2em] transition-colors hover:text-gold ${
                item.highlight ? "text-gold" : "text-cream-dim"
              }`}
              activeProps={{ className: "text-gold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href={otherLocalePath}
            hrefLang={locale === "pt" ? "en" : "pt-BR"}
            aria-label={t.switchAria}
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-cream-dim transition-colors hover:text-gold"
          >
            {t.switchLabel}
          </a>
          <Link to={t.ctaTo} className="btn-gold">
            {t.cta}
          </Link>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <a
            href={otherLocalePath}
            hrefLang={locale === "pt" ? "en" : "pt-BR"}
            aria-label={t.switchAria}
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-cream-dim hover:text-gold"
          >
            {t.switchLabel}
          </a>
          <button
            type="button"
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center border border-gold/40 text-gold"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border-sub bg-navy">
          <nav className="mx-auto flex max-w-[1400px] flex-col px-6 py-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-border-sub/60 py-4 text-xs font-medium uppercase tracking-[0.2em] text-cream-dim hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={t.ctaTo}
              onClick={() => setOpen(false)}
              className="btn-gold mt-6 justify-center"
            >
              {t.cta}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
