import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Monitor, Shield, Award } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const obligations = [
  { when: "5º dia útil", what: "Pagamento da folha" },
  { when: "Dia 20", what: "DAS do Simples Nacional" },
  { when: "Dia 20", what: "FGTS e contribuição previdenciária" },
  { when: "Último dia útil", what: "DCTFWeb" },
  { when: "Trimestral", what: "IRPJ e CSLL do Lucro Presumido" },
  { when: "Todo mês", what: "Fechamento e relatório para você" },
];

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-navy px-6 pb-20 pt-32 md:px-8 lg:pt-40"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
        <div className="min-w-0">
          <h1
            className="font-display text-cream"
            style={{
              fontSize: "clamp(38px, 4.6vw, 64px)",
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
            }}
          >
            Contabilidade em dia, impostos sob controle e você livre para tocar a empresa.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-dim">
            A Keystone cuida da contabilidade, do fiscal, da folha e do financeiro de empresas do
            Simples Nacional e do Lucro Presumido. Abrimos sua empresa, fechamos o mês no prazo e
            mostramos o que sobrou no caixa.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link to="/contato" className="btn-gold">
              Pedir proposta
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <Link to="/diagnostico" className="btn-ghost">
              Fazer diagnóstico grátis
            </Link>
          </div>

          <p className="mt-4 text-xs text-cream-mute">Resposta em até 1 dia útil. Sem compromisso.</p>

          <ul className="mt-12 grid gap-4">
            <TrustItem icon={Monitor} text="Atendimento 100% digital" />
            <TrustItem icon={Shield} text="Sigilo contábil e LGPD" />
            <TrustItem icon={Award} text="Um responsável fixo pela sua conta" />
          </ul>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="w-full min-w-0 border border-border bg-navy-card"
        >
          <div className="flex items-center gap-3 border-b border-border-sub px-6 py-5">
            <CalendarDays aria-hidden className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
            <h2 className="font-sans text-sm font-semibold text-cream">
              O que acontece todo mês na sua empresa
            </h2>
          </div>
          <ul className="divide-y divide-border-sub">
            {obligations.map((o) => (
              <li
                key={o.what}
                className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-4 px-6 py-4 text-[13px]"
              >
                <span className="text-cream-mute">{o.when}</span>
                <span className="text-cream">{o.what}</span>
                <span className="border border-border-sub px-2 py-1 text-[11px] text-gold">
                  Cuidamos
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-border-sub px-6 py-4 text-[11px] leading-relaxed text-cream-mute">
            Datas gerais. Mudam em feriados e conforme o município, e conferimos a cada competência.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function TrustItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 text-xs text-cream-dim">
      <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
      {text}
    </li>
  );
}
