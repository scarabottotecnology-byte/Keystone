const audience = [
  {
    role: "CEO",
    title: "Chief Executive Officer",
    pain: "O fechamento sai tarde e cada área apresenta um número diferente. Você decide contratação, preço e investimento sem enxergar o resultado real do mês.",
    quote: "“Preciso de números que contem a história, não que escondam ela.”",
  },
  {
    role: "CFO",
    title: "Chief Financial Officer",
    pain: "O time financeiro está consumido pela operação: conciliação, lançamento, planilha. Falta contabilidade gerencial e planejamento financeiro corporativo de verdade — budget, forecast e análise de variação.",
    quote: "“Quero subir o nível da minha controladoria sem aumentar headcount.”",
  },
  {
    role: "Sócio / Diretor",
    title: "Acionista ou Conselho",
    pain: "Os processos existem, mas vivem em planilhas frágeis. O caixa surpreende, o custo por produto é estimativa e o orçamento envelhece no primeiro trimestre.",
    quote: "Precisamos de governança financeira real antes do próximo salto de crescimento.",
  },
];

export function ParaQuem() {
  return (
    <section id="sobre" className="py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <span className="eyebrow">Para quem é</span>
        <h2 className="section-title mt-6">
          Construído para quem
          <br />
          <em>responde pelos números</em>
        </h2>


        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {audience.map((a) => (
            <article
              key={a.role}
              className="border border-border-sub p-10 transition-colors hover:border-border hover:bg-gold/[0.02]"
            >
              <div className="font-display text-3xl font-medium text-cream">{a.role}</div>
              <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-gold">
                {a.title}
              </div>
              <p className="mt-5 text-[13px] font-light leading-relaxed text-cream-dim">
                {a.pain}
              </p>
              <p className="mt-5 border-t border-border-sub pt-5 font-accent text-[15px] italic leading-snug text-gold-light">
                {a.quote}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
