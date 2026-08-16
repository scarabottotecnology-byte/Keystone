const stats = [
  { num: "15", suffix: "+", label: "Anos em Controladoria e FP&A", desc: "Controladoria e FP&A em grupos empresariais de grande porte" },
  { num: "R$", suffix: "bi+", label: "em Consolidações Analisadas", desc: "Consolidações financeiras de grupos multisegmento" },
  { num: "4", suffix: "", label: "Trilhas de Solução", desc: "ÓRBITA · MFI · Custos · PRISMA" },
  { num: "100", suffix: "%", label: "Serviço Recorrente", desc: "Rotina mensal de fechamento, indicadores e reunião de resultado" },
];

export function Stats() {
  return (
    <section className="border-y border-border-sub bg-navy">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`group relative overflow-hidden p-11 transition-colors hover:bg-white/[0.02] ${
              i < stats.length - 1 ? "border-b border-border-sub lg:border-b-0 lg:border-r" : ""
            }`}
          >
            <span aria-hidden className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-8xl font-light leading-none text-gold/[0.06]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }}
            />
            <div className="font-display text-5xl font-light leading-none tracking-tight text-gold-light">
              {s.num}
              <span className="text-2xl text-gold">{s.suffix}</span>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cream-mute">
              {s.label}
            </div>
            <p className="mt-2.5 text-[13px] font-light leading-relaxed text-cream-dim">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
