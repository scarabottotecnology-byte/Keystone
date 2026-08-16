import { ArrowRight, MessageCircle } from "lucide-react";

export function CtaBanner() {
  return (
    <section
      id="contato"
      className="relative overflow-hidden border-y border-border-sub bg-navy-mid py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse, rgba(166,25,46,0.07) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
        <h2 className="section-title">
          Pronto para ter uma <em>controladoria</em>
          <br />
          que sustenta as suas decisões?
        </h2>
        <p className="mt-5 text-[15px] font-light text-cream-dim">
          30 minutos de conversa estratégica inicial. Sem compromisso.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-5">
          <a
            href="https://calendar.google.com/calendar"
            target="_blank"
            rel="noreferrer"
            className="btn-gold"
          >
            Agendar Diagnóstico
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <a href="#contato" className="btn-ghost">
            <MessageCircle className="h-3.5 w-3.5" />
            Fale Conosco
          </a>
        </div>
      </div>
    </section>
  );
}
