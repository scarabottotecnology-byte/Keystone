import { Link } from "@tanstack/react-router";
import { KeystoneMonogram } from "@/components/site/keystone-monogram";
import type { Locale } from "@/lib/i18n";

const LINKS: Record<Locale, { label: string; to: string; anchor?: boolean }[]> = {
  pt: [
    { label: "Home", to: "/" },
    { label: "Serviços", to: "/servicos" },
    { label: "Indicadores", to: "/indicadores" },
    { label: "Calculadoras", to: "/calculadoras" },
    { label: "Para quem", to: "/#para-quem", anchor: true },
    { label: "Ferramentas", to: "/ferramentas" },
    { label: "Diagnóstico", to: "/diagnostico" },
    { label: "Contato", to: "/contato" },
    { label: "Trocar de Contabilidade", to: "/trocar-de-contabilidade" },
    { label: "Contabilidade em Santo André", to: "/contabilidade-santo-andre" },
    { label: "Trabalhe Conosco", to: "/trabalhe-conosco" },
  ],
  en: [
    { label: "Home", to: "/en" },
    { label: "Services", to: "/en/services" },
    { label: "Who we work with", to: "/en#who-we-work-with", anchor: true },
    { label: "Methodology", to: "/en/methodology" },
    { label: "Switching to Keystone", to: "/en/switching" },
    { label: "Contact", to: "/en/contact" },
    { label: "Privacy", to: "/en/privacy" },
  ],
};

const COPY = {
  pt: {
    home: "/",
    brand: "Keystone Contabilidade",
    motto: "Contabilidade em dia, impostos sob controle.",
    other: { label: "English version", href: "/en", hrefLang: "en" },
  },
  en: {
    home: "/en",
    brand: "Keystone",
    motto: "Numbers you can trust, decisions you can defend.",
    other: { label: "Versão em português", href: "/", hrefLang: "pt-BR" },
  },
} as const;

export function SiteFooter({ locale = "pt" }: { locale?: Locale }) {
  const t = COPY[locale];
  return (
    <footer className="border-t border-border-sub bg-navy">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-8 py-14 md:grid-cols-3 md:items-center">
        <Link to={t.home} className="flex items-center gap-3">
          <KeystoneMonogram size={30} />
          <span className="font-display text-base text-cream">{t.brand}</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-7 text-[11px] uppercase tracking-[0.18em] text-cream-mute">
          {LINKS[locale].map((l) =>
            l.anchor ? (
              <a key={l.to} href={l.to} className="hover:text-gold">
                {l.label}
              </a>
            ) : (
              <Link key={l.to} to={l.to} className="hover:text-gold">
                {l.label}
              </Link>
            ),
          )}
          <a href={t.other.href} hrefLang={t.other.hrefLang} className="hover:text-gold">
            {t.other.label}
          </a>
        </nav>
        <div className="md:text-right">
          <p className="font-accent text-sm italic text-gold-light">{t.motto}</p>
          <p className="mt-2 text-[11px] text-cream-mute">© {new Date().getFullYear()} Keystone</p>
        </div>
      </div>
    </footer>
  );
}
