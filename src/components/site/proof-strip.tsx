export function ProofStrip() {
  const items = [
    "Indústrias",
    "Comércio & Distribuição",
    "Serviços B2B",
    "Agronegócio",
    "Saúde",
    "Construção",
  ];
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Setores atendidos
        </p>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {items.map((item) => (
            <li
              key={item}
              className="text-sm font-semibold tracking-wide text-foreground/70"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
