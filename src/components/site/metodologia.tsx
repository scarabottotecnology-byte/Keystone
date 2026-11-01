import { Reveal } from "@/components/site/reveal";

const passos = [
  { title: "Conversa e proposta", desc: "Você conta o regime, a equipe e o faturamento. Respondemos com escopo e valor em até 1 dia útil." },
  { title: "Migração sem susto", desc: "Cuidamos da troca de contador, da procuração eletrônica e do levantamento da situação atual." },
  { title: "Rotina mensal", desc: "Você envia os documentos até a data combinada. Nós apuramos, entregamos guias e fechamos o mês." },
  { title: "Relatório e conversa", desc: "Todo mês, resultado e caixa em linguagem simples, e o que precisa de decisão." },
];

export function Metodologia() {
  return (
    <section id="metodologia" className="border-t border-border-sub py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <Reveal>
          <h2 className="section-title max-w-2xl">Como funciona na prática</h2>
        </Reveal>
        <ol className="mt-14 grid gap-px bg-border-sub md:grid-cols-2 lg:grid-cols-4">
          {passos.map(({ title, desc }, i) => (
            <li key={title} className="bg-navy-card p-10">
              <div className="font-display text-3xl font-light text-gold" aria-hidden>
                {i + 1}
              </div>
              <h3 className="mt-5 font-display text-xl font-medium text-cream">{title}</h3>
              <p className="mt-3 text-[13px] font-light leading-relaxed text-cream-dim">{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
