import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown, Shield, Award, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-navy px-8 pb-20 pt-32 lg:pt-40"
    >
      <div aria-hidden className="grid-texture pointer-events-none absolute inset-0 opacity-60" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-20 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="anim-fade-up [animation-delay:.2s]">
            <span className="eyebrow">Controladoria Estratégica · FP&A · Finanças Corporativas</span>
          </div>

          <h1
            className="anim-fade-up mt-7 font-display text-cream [animation-delay:.35s]"
            style={{
              fontSize: "clamp(42px, 5vw, 70px)",
              fontWeight: 300,
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
            }}
          >
            <em className="italic text-gold">Geração de caixa, rentabilidade</em>
            <br />
            <strong className="block font-semibold">
              e valor econômico começam
              <br />
              com controladoria estratégica.
            </strong>
          </h1>

          <p className="anim-fade-up mt-6 max-w-xl text-base leading-relaxed text-cream-dim [animation-delay:.5s]">
            A Keystone estrutura controladoria, planejamento financeiro e gestão de custos
            para empresas que já não podem se dar ao luxo de decidir com informação
            incompleta. Metodologia proprietária. Entregas no padrão que um conselho espera ver.
          </p>

          <div className="anim-fade-up mt-10 flex flex-wrap items-center gap-5 [animation-delay:.65s]">
            <Link to="/diagnostico" className="btn-gold">
              Solicitar Diagnóstico Financeiro
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <a href="#contato" className="btn-ghost">
              Falar com um Sócio
              <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          </div>

          <p className="anim-fade-up mt-4 text-xs text-cream-mute [animation-delay:.7s]">
            Diagnóstico estruturado, sem custo, sob confidencialidade total.
          </p>

          <div className="anim-fade-up mt-12 flex flex-wrap gap-8 [animation-delay:.8s]">
            <TrustItem icon={Award} bold="15+ anos" rest="em Controladoria e FP&A" />
            <TrustItem icon={Shield} bold="Confidencialidade" rest="total, NDA antes de qualquer contato" />
            <TrustItem icon={Sparkles} bold="Metodologia proprietária" rest="ÓRBITA™ e RICE™" />
          </div>
        </div>

        <div className="anim-fade-in flex justify-center lg:justify-end [animation-delay:.7s]">
          <DashboardPreview />
        </div>
      </div>

      <div className="anim-fade-in absolute bottom-9 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex [animation-delay:1.6s]">
        <span className="text-[9px] uppercase tracking-[0.3em] text-cream-mute">Scroll</span>
        <div
          className="h-12 w-px"
          style={{
            background: "linear-gradient(to bottom, var(--gold), transparent)",
            animation: "scrollPulse 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}

function TrustItem({
  icon: Icon,
  bold,
  rest,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  bold: string;
  rest: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
      <span className="text-xs tracking-wide text-cream-mute">
        <strong className="font-medium text-cream-dim">{bold}</strong> {rest}
      </span>
    </div>
  );
}

function AreaChart() {
  const points = [38, 45, 40, 52, 48, 58, 54, 64, 60, 70, 66, 76];
  const w = 300;
  const h = 110;
  const step = w / (points.length - 1);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / (max - min || 1)) * (h - 16) - 8;
    return [x, y];
  });
  const line = norm.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" preserveAspectRatio="none" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          x2={w}
          y1={(h / 3) * i}
          y2={(h / 3) * i}
          stroke="var(--border-sub)"
          strokeWidth="1"
        />
      ))}
      <polygon points={area} fill="var(--gold)" opacity="0.06" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {norm.map(([x, y], i) =>
        i === norm.length - 1 ? (
          <circle key={i} cx={x} cy={y} r="3.5" fill="var(--gold)" />
        ) : null,
      )}
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full max-w-[380px] border border-border bg-navy-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-border-sub px-6 py-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cream-mute">
          Margem EBITDA — 12 períodos
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-gold"
            style={{ animation: "pulseDot 1.8s ease-in-out infinite" }}
          />
          <span className="text-[9px] uppercase tracking-[0.2em] text-cream-mute">Ao vivo</span>
        </span>
      </div>

      <div className="border-b border-border-sub px-6 pt-5">
        <div className="font-display text-3xl font-medium text-cream">24,8%</div>
        <div className="mb-2 text-[11px] text-gold">+3,2 p.p. vs. período anterior</div>
        <AreaChart />
      </div>

      <div>
        {[
          { label: "Fluxo de Caixa 12m", value: "R$ 18,4M", trend: "+11,6%" },
          { label: "Ponto de Equilíbrio", value: "62% da capacidade", trend: "−8,1 p.p." },
        ].map((ind, i, arr) => (
          <div
            key={ind.label}
            className={`flex items-center justify-between px-6 py-4 ${
              i < arr.length - 1 ? "border-b border-border-sub" : ""
            }`}
          >
            <div className="text-[10px] uppercase tracking-[0.15em] text-cream-mute">{ind.label}</div>
            <div className="text-right">
              <div className="text-sm font-semibold text-cream">{ind.value}</div>
              <div className="text-[10px] text-gold">{ind.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border-sub px-6 py-3.5">
        <span className="text-[9px] uppercase tracking-[0.18em] text-cream-mute">
          Ilustrativo — modelo de acompanhamento Keystone
        </span>
      </div>
    </div>
  );
}
