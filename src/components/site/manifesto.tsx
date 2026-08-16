export function Manifesto() {
  return (
    <section className="relative overflow-hidden border-b border-border-sub bg-navy py-28 lg:py-36">
      <div aria-hidden className="grid-texture pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-4xl px-8 text-center">
        <span className="eyebrow mx-auto justify-center">Nossa Abordagem</span>
        <p className="mt-8 font-display text-[clamp(28px,4.2vw,50px)] italic leading-[1.25] text-cream">
          Não somos uma consultoria.
          <br />
          <span className="not-italic font-semibold text-gold">Somos uma capacidade</span> que
          permanece na empresa e evolui com o negócio.
        </p>
      </div>
    </section>
  );
}
