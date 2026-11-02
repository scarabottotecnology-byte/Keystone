import { RevealGroup, RevealItem } from "@/components/site/reveal";

/**
 * Ficha técnica logo abaixo do hero: prova de experiência em uma linha,
 * sem números inventados. Tudo aqui vem da trajetória real do fundador.
 */
const credenciais = [
  { valor: "14 anos", texto: "em controladoria, FP&A e financeiro de empresas" },
  { valor: "50+ empresas", texto: "no orçamento consolidado que o fundador conduz hoje" },
  { valor: "Indústria e varejo", texto: "tecnologia, bebidas, moda e farma no currículo" },
  { valor: "SAP e TOTVS", texto: "acostumado aos sistemas de quem já cresceu" },
];

export function Credenciais() {
  return (
    <section aria-label="Experiência" className="border-y border-border-sub bg-navy-mid">
      <RevealGroup className="mx-auto grid max-w-[1400px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {credenciais.map((c, i) => (
          <RevealItem
            key={c.valor}
            className={`px-8 py-8 ${i > 0 ? "border-t border-border-sub sm:border-t-0" : ""} ${
              i % 2 === 1 ? "sm:border-l sm:border-border-sub" : ""
            } ${i > 1 ? "sm:border-t sm:border-border-sub lg:border-t-0" : ""} ${
              i === 2 ? "lg:border-l lg:border-border-sub" : ""
            }`}
          >
            <p className="font-display text-[28px] font-normal leading-none text-gold-light">
              {c.valor}
            </p>
            <p className="mt-3 text-[13px] font-light leading-snug text-cream-dim">{c.texto}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
