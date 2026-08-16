const items = [
  { n: "01", title: "Foco em empresas em crescimento", desc: "Atendemos empresas e grupos cuja complexidade financeira cresce mais rápido que a estrutura interna — onde a controladoria precisa de método, não de improviso." },
  { n: "02", title: "Entrega board-ready", desc: "Relatórios, modelos e análises em formato que CFO leva para o board sem reformatar nada." },
  { n: "03", title: "Tecnologia onde faz sentido", desc: "Pipeline de dados, ERP, Power BI. Mas só depois que processo e plano de contas estão de pé." },
  { n: "04", title: "Confidencialidade absoluta", desc: "NDA assinado antes de qualquer compartilhamento. LGPD e ambientes controlados, sempre." },
];

export function Diferenciais() {
  return (
    <section className="border-t border-border-sub bg-navy-mid py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <span className="eyebrow">Diferenciais</span>
        <h2 className="section-title mt-6">
          Por que <em>Keystone</em>
        </h2>

        <div className="mt-14 grid gap-px bg-border-sub md:grid-cols-2">
          {items.map(({ n, title, desc }) => (
            <div
              key={n}
              className="flex gap-6 bg-navy-mid p-12 transition-colors hover:bg-navy-light"
            >
              <div className="w-12 shrink-0 font-display text-4xl font-light leading-none text-gold/25">
                {n}
              </div>
              <div>
                <h3 className="font-display text-[22px] font-medium text-cream">{title}</h3>
                <p className="mt-2.5 text-[13px] font-light leading-relaxed text-cream-dim">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
