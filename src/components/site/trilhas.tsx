import { Orbit, Layers3, Calculator, Scale } from "lucide-react";

const trilhas = [
  {
    id: "orbita",
    icon: Orbit,
    code: "01",
    name: "ÓRBITA™",
    tagline: "Controladoria mensal recorrente",
    desc: "Cadência mensal de fechamento, análise de variações, reuniões de resultado e plano de ação. Sua empresa entra em órbita previsível em torno dos próprios números.",
    bullets: [
      "Fechamento contábil-gerencial mensal",
      "Reunião executiva de resultado",
      "Painel de KPIs e plano de ação 30/60/90",
    ],
  },
  {
    id: "mfi",
    icon: Layers3,
    code: "02",
    name: "MFI",
    tagline: "Modelo Financeiro Integrado",
    desc: "DRE, fluxo de caixa e balanço conectados em um único modelo dinâmico. Projeções, cenários e simulações para decidir investimentos, captação e crescimento.",
    bullets: [
      "DRE, DFC e Balanço integrados",
      "Cenários: base, otimista, conservador",
      "Valuation e análise de viabilidade",
    ],
  },
  {
    id: "custos",
    icon: Calculator,
    code: "03",
    name: "RICE™",
    tagline: "Método RICE™ — contabilidade de custos e precificação",
    desc: "Contabilidade de custos aplicada à gestão: mapeamento de custos fixos e variáveis, margem de contribuição por produto, ponto de equilíbrio e política de preços baseada em dados — não em achismo.",
    bullets: [
      "Margem de contribuição por SKU",
      "Ponto de equilíbrio operacional",
      "Política de preços e descontos",
    ],
  },
  {
    id: "prisma",
    icon: Scale,
    code: "04",
    name: "PRISMA",
    tagline: "M&A, Valuation e Due Diligence Financeira",
    desc: "Avaliação de empresa e diligência financeira estruturada para fusões, aquisições, entrada de sócios ou venda de participação. WACC derivado da estrutura financeira real da empresa-alvo. DCF com fluxo de caixa livre (FCFF) e Gordon Growth como valor terminal.",
    bullets: [
      "Valuation por DCF/FCFF com Gordon Growth terminal",
      "WACC derivado dos dados reais da empresa-alvo",
      "Múltiplos comparáveis de mercado para triangulação",
    ],
  },
];

export function Trilhas() {
  return (
    <section id="trilhas" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-sm border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            Nossas trilhas
          </span>
          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Quatro frentes integradas de controladoria, FP&A e valuation
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Cada trilha resolve uma dor concreta da gestão financeira — isoladas ou combinadas.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {trilhas.map(({ id, icon: Icon, code, name, tagline, desc, bullets }) => (
            <article
              key={id}
              className="group relative flex flex-col rounded-sm border border-border border-t-2 border-gold/60 bg-card p-8 transition-all hover:border-gold/60 hover:shadow-[0_-2px_20px_rgba(166,25,46,0.12)]"
            >
              <span aria-hidden className="pointer-events-none absolute right-6 top-4 select-none font-display text-6xl font-bold leading-none text-gold opacity-[0.07]">
                {code}
              </span>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-sm bg-primary text-secondary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Trilha {code}
                    </p>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                      {name}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-secondary">
                {tagline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-border pt-6">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1 w-3 shrink-0 bg-secondary" />
                    {b}
                  </li>
                ))}
              </ul>

              <a
                href={`#trilha-${id}`}
                className="mt-8 inline-block border-b border-gold/40 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold hover:text-gold-light"
              >
                Saber mais sobre {name}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
