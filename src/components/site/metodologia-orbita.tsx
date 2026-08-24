import { Award, RefreshCw } from "lucide-react";

const phases = [
  { letter: "Ó", name: "Objetivos", desc: "Metas financeiras alinhadas à estratégia do negócio." },
  { letter: "R", name: "Roadmap", desc: "Plano de ação trimestral, com responsáveis e prazos definidos." },
  { letter: "B", name: "Budget", desc: "Orçamento corporativo integrado, parametrizado por área e centro de custo." },
  { letter: "I", name: "Indicadores", desc: "KPIs financeiros e operacionais acompanhados em rotina." },
  { letter: "T", name: "Tracking", desc: "Realizado vs. orçado analisado continuamente, não só no fechamento." },
  { letter: "A", name: "Ação", desc: "Planos de ação estruturados para corrigir desvios antes que virem crise." },
];

const steps = [
  { step: "01", title: "Diagnóstico do ciclo atual", desc: "Mapeamento de como orçamento, indicadores e decisão se conectam (ou não) hoje." },
  { step: "02", title: "Implantação do ciclo ÓRBITA™", desc: "Objetivos, roadmap e budget estruturados e parametrizados por área." },
  { step: "03", title: "Rotina de tracking", desc: "Acompanhamento mensal do realizado vs. orçado, com leitura de causa raiz." },
  { step: "04", title: "Ação e recalibragem", desc: "Planos de correção executados e o ciclo reinicia no trimestre seguinte." },
];

export function MetodologiaOrbita() {
  return (
    <section id="orbita" className="border-b border-border-sub bg-navy py-24 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <span className="eyebrow">Metodologia Proprietária</span>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                <Award className="h-4 w-4" strokeWidth={2} />
              </span>
              <h2 className="section-title">
                Método <em>ÓRBITA™</em>
              </h2>
            </div>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-cream-mute">
              Planejamento Financeiro &amp; Acompanhamento Gerencial
            </p>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-dim">
              O Método ÓRBITA™ conecta estratégia e execução financeira — um ciclo contínuo
              que transforma orçamento corporativo em ferramenta de decisão e instala uma
              cultura de gestão baseada em indicadores, não em intuição.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-px border border-border-sub bg-border-sub sm:grid-cols-3">
              {phases.map((phase) => (
                <div key={phase.letter} className="bg-navy-card p-6">
                  <div className="font-display text-3xl italic text-gold">{phase.letter}</div>
                  <div className="mt-2 text-sm font-semibold text-cream">{phase.name}</div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">{phase.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-cream-mute">
              <RefreshCw className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
              Ciclo contínuo — recomeça a cada trimestre
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border-sub pt-12">
          <span className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">Como funciona</span>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step}>
                <div className="font-display text-2xl italic text-gold">{s.step}</div>
                <div className="mt-2 text-sm font-semibold text-cream">{s.title}</div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
