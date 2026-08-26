import { Link } from "@tanstack/react-router";
import keystoneIcon from "@/assets/keystone-icon.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-sub bg-navy">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-8 py-14 md:grid-cols-3 md:items-center">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={keystoneIcon}
            alt="Keystone Capital Advisory"
            className="h-11 w-11 shrink-0 object-contain"
          />
          <span className="font-display text-base text-cream">Keystone Capital Advisory</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-7 text-[11px] uppercase tracking-[0.18em] text-cream-mute">
          <Link to="/" className="hover:text-gold">
            Home
          </Link>
          <Link to="/servicos" className="hover:text-gold">
            Serviços
          </Link>
          <Link to="/metodologias" className="hover:text-gold">
            Metodologias
          </Link>
          <Link to="/cases" className="hover:text-gold">
            Cases
          </Link>
          <Link to="/indicadores" className="hover:text-gold">
            Indicadores
          </Link>
          <Link to="/calculadoras" className="hover:text-gold">
            Calculadoras
          </Link>
          <a href="/#sobre" className="hover:text-gold">
            Sobre
          </a>
          <Link to="/ferramentas" className="hover:text-gold">
            Ferramentas
          </Link>
          <Link to="/diagnostico" className="hover:text-gold">
            Diagnóstico
          </Link>
          <Link to="/contato" className="hover:text-gold">
            Contato
          </Link>
        </nav>
        <div className="md:text-right">
          <p className="font-accent text-sm italic text-gold-light">
            Clareza financeira para decisões que importam.
          </p>
          <p className="mt-2 text-[11px] text-cream-mute">© {new Date().getFullYear()} Keystone</p>
        </div>
      </div>
    </footer>
  );
}
