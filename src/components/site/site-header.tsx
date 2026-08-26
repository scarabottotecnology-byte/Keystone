import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import keystoneIcon from "@/assets/keystone-icon.png";

const navItems = [
  { label: "Serviços", to: "/servicos" as const },
  { label: "Metodologias", to: "/metodologias" as const },
  { label: "Cases", to: "/cases" as const },
  { label: "Ferramentas", to: "/ferramentas" as const },
  { label: "Diagnóstico", to: "/diagnostico" as const },
  { label: "Contato", to: "/contato" as const },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src={keystoneIcon}
            alt="Keystone Capital Advisory"
            className="h-11 w-11 shrink-0 object-contain"
          />
          <div className="leading-none">
            <div className="font-display text-base font-medium tracking-wide text-cream">
              Keystone
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-cream-mute">
              Controladoria
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`text-[11px] font-medium uppercase tracking-[0.2em] transition-colors hover:text-gold ${
                item.label === "Diagnóstico" ? "text-gold" : "text-cream-dim"
              }`}
              activeProps={{ className: "text-gold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link to="/diagnostico" className="btn-gold hidden md:inline-flex">
          Diagnóstico Gratuito
        </Link>

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center border border-gold/40 text-gold md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border-sub bg-navy">
          <nav className="mx-auto flex max-w-[1400px] flex-col px-6 py-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-border-sub/60 py-4 text-xs font-medium uppercase tracking-[0.2em] text-cream-dim hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/diagnostico"
              onClick={() => setOpen(false)}
              className="btn-gold mt-6 justify-center"
            >
              Diagnóstico Gratuito
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
