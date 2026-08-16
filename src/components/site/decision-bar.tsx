import { Check } from "lucide-react";

const desafios = [
  "Fechamento gerencial sem prazo definido e sem confiabilidade para decisão",
  "Orçamento que não sobrevive ao primeiro trimestre do ano",
  "Visibilidade de caixa limitada a poucas semanas à frente",
  "Custos sem direcionador claro — preço definido por instinto, não por dado",
  "Indicadores que mudam de fonte conforme quem apresenta",
  "Conselho e investidores questionando números que a empresa não sustenta com segurança",
  "Ausência de rotina estruturada de Budget, Forecast e análise de variação",
  "Financeiro, fiscal e contábil operando como áreas desconectadas",
];

export function DecisionBar() {
  return (
    <section id="desafios" className="border-y border-border-sub bg-navy-mid py-24">
      <div className="mx-auto max-w-[1400px] px-8">
        <span className="eyebrow">O problema</span>
        <h2 className="section-title mt-6">
          Se o CEO reconhece <em>algum destes pontos</em>,
          <br />
          a controladoria precisa de outro patamar
        </h2>
        <p className="mt-5 max-w-2xl text-[14px] font-light leading-relaxed text-cream-dim">
          Não são falhas de contabilidade. São sintomas de uma estrutura financeira que
          cresceu mais rápido do que os processos que deveriam sustentá-la.
        </p>

        <ul className="mt-12 grid gap-x-10 gap-y-5 md:grid-cols-2">
          {desafios.map((item) => (
            <li
              key={item}
              className="flex items-start gap-4 border-b border-border-sub/60 pb-5 text-[14px] font-light text-cream-dim"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center border border-gold/40 text-gold">
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
