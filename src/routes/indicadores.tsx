import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, ArrowDown } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Marquee } from "@/components/ui/marquee";

export const Route = createFileRoute("/indicadores")({
  head: () => ({
    meta: [
      { title: "Indicadores Econômicos — Keystone" },
      {
        name: "description",
        content:
          "Referência dos principais indicadores macroeconômicos, moedas e índices de mercado usados em modelagem financeira e planejamento corporativo.",
      },
      { property: "og:title", content: "Indicadores Econômicos — Keystone" },
    ],
    links: [{ rel: "canonical", href: "/indicadores" }],
  }),
  component: IndicadoresPage,
});

type Indicator = {
  name: string;
  value: string;
  change: string;
  up: boolean;
  desc?: string;
  source?: string;
};

const mainIndicators: Indicator[] = [
  {
    name: "SELIC",
    value: "14,75%",
    change: "+0,50 p.p.",
    up: true,
    desc: "Taxa básica de juros da economia brasileira",
    source: "COPOM/BCB",
  },
  {
    name: "CDI",
    value: "14,65%",
    change: "+0,48 p.p.",
    up: true,
    desc: "Certificado de Depósito Interbancário",
    source: "B3",
  },
  {
    name: "IPCA",
    value: "5,53%",
    change: "+0,32 p.p.",
    up: true,
    desc: "Índice Nacional de Preços ao Consumidor Amplo (12m)",
    source: "IBGE",
  },
  {
    name: "IGP-M",
    value: "3,21%",
    change: "-0,15 p.p.",
    up: false,
    desc: "Índice Geral de Preços do Mercado (12m)",
    source: "FGV",
  },
];

const currencies: Indicator[] = [
  { name: "Dólar (USD/BRL)", value: "R$ 5,42", change: "-0,23%", up: false },
  { name: "Euro (EUR/BRL)", value: "R$ 5,89", change: "+0,18%", up: true },
  { name: "Libra (GBP/BRL)", value: "R$ 6,84", change: "-0,12%", up: false },
];

const stockIndices: Indicator[] = [
  { name: "Ibovespa", value: "134.520", change: "+1,2%", up: true, desc: "Principal índice da B3" },
  {
    name: "IFIX",
    value: "3.412",
    change: "+0,8%",
    up: true,
    desc: "Índice de Fundos Imobiliários",
  },
  { name: "S&P 500", value: "5.892", change: "+1,5%", up: true, desc: "Standard & Poor's 500" },
];

function IndicadoresPage() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main className="px-8 pb-24 pt-36 lg:pt-44">
        <div className="mx-auto max-w-[1400px]">
          <div className="text-center">
            <span className="eyebrow mx-auto">Indicadores econômicos</span>
            <h1 className="section-title mx-auto mt-7 max-w-2xl">
              Referências de mercado para <em>modelagem financeira</em>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
              Os indicadores mais usados nos modelos de planejamento financeiro, precificação e
              valuation que construímos para nossos clientes.
            </p>
          </div>

          <div className="mt-6 mx-auto max-w-2xl border border-border-sub bg-navy-card px-6 py-4 text-center">
            <p className="text-xs leading-relaxed text-cream-mute">
              Valores de referência, atualizados periodicamente pela equipe Keystone — não são
              cotação em tempo real. Para dados oficiais, consulte BCB, B3, FGV e IBGE.
            </p>
          </div>

          <Marquee pauseOnHover className="mt-10 border-y border-border-sub bg-navy-card [--duration:35s]">
            {[...mainIndicators, ...currencies, ...stockIndices].map((ind, i) => (
              <div key={`${ind.name}-${i}`} className="mx-6 flex shrink-0 items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-mute">
                  {ind.name}
                </span>
                <span className="font-display text-sm font-medium text-cream">{ind.value}</span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    ind.up ? "text-gold" : "text-red-400"
                  }`}
                >
                  {ind.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {ind.change}
                </span>
              </div>
            ))}
          </Marquee>

          <section className="mt-16">
            <h2 className="font-display text-2xl font-medium text-cream">
              Indicadores macroeconômicos
            </h2>
            <div className="mt-7 grid gap-px bg-border-sub sm:grid-cols-2 lg:grid-cols-4">
              {mainIndicators.map((ind) => (
                <IndicatorCard key={ind.name} indicator={ind} />
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="font-display text-2xl font-medium text-cream">Moedas</h2>
            <div className="mt-7 grid gap-px bg-border-sub sm:grid-cols-3">
              {currencies.map((cur) => (
                <IndicatorCard key={cur.name} indicator={cur} />
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="font-display text-2xl font-medium text-cream">Índices de mercado</h2>
            <div className="mt-7 grid gap-px bg-border-sub sm:grid-cols-3">
              {stockIndices.map((idx) => (
                <IndicatorCard key={idx.name} indicator={idx} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const { name, value, change, up, desc, source } = indicator;
  return (
    <div className="bg-navy-card p-7">
      <div className="text-[10px] uppercase tracking-[0.2em] text-cream-mute">{name}</div>
      <div className="mt-2 font-display text-2xl font-medium text-cream">{value}</div>
      <div
        className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
          up ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {change}
      </div>
      {desc ? <p className="mt-3 text-[12px] leading-relaxed text-cream-mute">{desc}</p> : null}
      {source ? <p className="mt-1 text-[10px] text-cream-mute/60">Fonte: {source}</p> : null}
    </div>
  );
}
