const pillars = [
  { letter: "R", name: "Reclassificação", desc: "Estruturação de centros de custo e reclassificação de despesas por natureza." },
  { letter: "I", name: "Identificação", desc: "Mapeamento de direcionadores de custo e desperdícios ocultos na operação." },
  { letter: "C", name: "Custeio", desc: "Custeio por produto, canal, cliente e unidade de negócio — não só por centro contábil." },
  { letter: "E", name: "Estratégia", desc: "Precificação, mix de produtos e decisões que maximizam margem de contribuição." },
];

export function MetodologiaRice() {
  return (
    <section id="rice" className="border-b border-border-sub bg-navy-mid py-24 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <span className="eyebrow">Metodologia Proprietária</span>
            <h2 className="section-title mt-6">
              Método <em>RICE™</em>
            </h2>
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
      </div>
    </section>
  );
}
