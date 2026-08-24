import { Award } from "lucide-react";

const pillars = [
  { letter: "R", name: "Reclassificação", desc: "Estruturação de centros de custo e reclassificação de despesas por natureza." },
  { letter: "I", name: "Identificação", desc: "Mapeamento de direcionadores de custo e desperdícios ocultos na operação." },
  { letter: "C", name: "Custeio", desc: "Custeio por produto, canal, cliente e unidade de negócio — não só por centro contábil." },
  { letter: "E", name: "Estratégia", desc: "Precificação, mix de produtos e decisões que maximizam margem de contribuição." },
];

const steps = [
  { step: "01", title: "Levantamento e reclassificação", desc: "Centros de custo estruturados e despesas reclassificadas por natureza real." },
  { step: "02", title: "Mapeamento de direcionadores", desc: "Identificação de onde a operação desperdiça — muitas vezes sem que ninguém veja." },
  { step: "03", title: "Custeio multidimensional", desc: "Rentabilidade real calculada por produto, canal, cliente e unidade de negócio." },
  { step: "04", title: "Decisão estratégica", desc: "Precificação e mix de produtos ajustados para maximizar margem de contribuição." },
];

export function MetodologiaRice() {
  return (
    <section id="rice" className="border-b border-border-sub bg-navy-mid py-24 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <span className="eyebrow">Metodologia Proprietária</span>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                <Award className="h-4 w-4" strokeWidth={2} />
              </span>
              <h2 className="section-title">
                Método <em>RICE™</em>
              </h2>
            </div>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-cream-mute">
              Gestão Estratégica de Custos
            </p>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-dim">
              O Método RICE™ entrega inteligência analítica e precisão à gestão de custos:
              identifica desperdícios, mapeia direcionadores e revela a rentabilidade real
              do negócio — por produto, canal, cliente e unidade.
            </p>
          </div>

          <div className="space-y-px border border-border-sub bg-border-sub">
            {pillars.map((pillar) => (
              <div key={pillar.letter} className="flex items-start gap-6 bg-navy-card p-6">
                <span className="font-display text-3xl italic text-gold">{pillar.letter}</span>
                <div>
                  <div className="text-sm font-semibold text-cream">{pillar.name}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-cream-mute">{pillar.desc}</p>
                </div>
              </div>
            ))}
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
