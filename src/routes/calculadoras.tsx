import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/calculadoras")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Calculadoras Corporativas — Keystone" },
      {
        name: "description",
        content:
          "Ferramentas interativas para simulação financeira: EBITDA, ponto de equilíbrio, ROI, margem, markup, capital de giro, WACC e valuation por múltiplos.",
      },
      { property: "og:title", content: "Calculadoras Corporativas — Keystone" },
    ],
    links: [{ rel: "canonical", href: "/calculadoras" }],
  }),
  component: CalculadorasPage,
});

const brl = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type CalcId = "ebitda" | "breakeven" | "roi" | "margem" | "markup" | "ncg" | "wacc" | "valuation";

const CALCS: { id: CalcId; icon: string; name: string; desc: string }[] = [
  {
    id: "ebitda",
    icon: "◈",
    name: "EBITDA",
    desc: "Lucro antes de juros, impostos, depreciação e amortização.",
  },
  {
    id: "breakeven",
    icon: "◇",
    name: "Ponto de Equilíbrio",
    desc: "Volume mínimo de vendas para cobrir custos.",
  },
  { id: "roi", icon: "↗", name: "ROI", desc: "Retorno sobre investimento." },
  { id: "margem", icon: "▤", name: "Margem Líquida", desc: "Percentual de lucro sobre receita." },
  { id: "markup", icon: "◈", name: "Markup", desc: "Índice de formação de preço." },
  {
    id: "ncg",
    icon: "⊞",
    name: "Capital de Giro",
    desc: "Necessidade de capital de giro operacional (NCG).",
  },
  { id: "wacc", icon: "◎", name: "WACC", desc: "Custo médio ponderado de capital." },
  {
    id: "valuation",
    icon: "♦",
    name: "Valuation",
    desc: "Valor da empresa por múltiplos de EBITDA.",
  },
];

function CalculadorasPage() {
  const [active, setActive] = useState<CalcId>("ebitda");
  const calc = CALCS.find((c) => c.id === active)!;

  return (
    <div className="min-h-screen bg-navy">
      <SiteHeader />
      <main className="mx-auto max-w-[1300px] px-8 py-16 pt-36 lg:pt-44">
        <div className="text-center">
          <span className="eyebrow mx-auto">Ferramentas financeiras</span>
          <h1 className="section-title mx-auto mt-7 max-w-2xl">Calculadoras Corporativas</h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream-dim">
            Ferramentas interativas para simulação e análise financeira rápida.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="space-y-1.5">
            {CALCS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`flex w-full items-center gap-3 border p-4 text-left transition-colors ${
                  active === c.id
                    ? "border-gold bg-navy-card text-cream"
                    : "border-border-sub bg-navy-card/40 text-cream-mute hover:border-gold/40 hover:text-cream"
                }`}
              >
                <span className="text-gold">{c.icon}</span>
                <span className="text-[13px] font-medium">{c.name}</span>
              </button>
            ))}
          </div>

          <div className="border border-border-sub bg-navy-card p-8 md:p-10">
            <h2 className="font-display text-2xl font-medium text-cream">{calc.name}</h2>
            <p className="mt-1.5 text-sm text-cream-dim">{calc.desc}</p>
            <div className="mt-8">
              {active === "ebitda" && <Ebitda />}
              {active === "breakeven" && <BreakEven />}
              {active === "roi" && <Roi />}
              {active === "margem" && <MargemLiquida />}
              {active === "markup" && <Markup />}
              {active === "ncg" && <CapitalDeGiro />}
              {active === "wacc" && <Wacc />}
              {active === "valuation" && <Valuation />}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------- shared inputs ---------- */

function NumField({
  label,
  value,
  onChange,
  money,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  money?: boolean;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">{label}</span>
      <div className="relative mt-2">
        {money ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-cream-mute">
            R$
          </span>
        ) : null}
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`w-full border border-border-sub bg-navy py-3 text-cream outline-none transition-colors focus:border-gold ${
            money ? "pl-10 pr-4" : "px-4"
          } ${suffix ? "pr-10" : ""}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-cream-mute">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function ResultCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-gold/30 bg-gradient-to-br from-navy-card to-navy p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-cream-mute">{label}</div>
      <div className="mt-2 font-display text-3xl font-light text-gold">{value}</div>
      {hint ? <div className="mt-1.5 text-xs text-cream-dim">{hint}</div> : null}
    </div>
  );
}

function Grid({ inputs, results }: { inputs: React.ReactNode; results: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">{inputs}</div>
      <div className="space-y-4">{results}</div>
    </div>
  );
}

/* ---------- calculators (logic ported from keystone-strategic-finance-platform) ---------- */

function Ebitda() {
  const [receita, setReceita] = useState(1000000);
  const [custos, setCustos] = useState(450000);
  const [despesas, setDespesas] = useState(220000);
  const [depreciacao, setDepreciacao] = useState(60000);
  const [amortizacao, setAmortizacao] = useState(15000);

  const result = useMemo(() => {
    const ebitda = receita - custos - despesas + depreciacao + amortizacao;
    const margem = receita > 0 ? (ebitda / receita) * 100 : 0;
    return { ebitda, margem };
  }, [receita, custos, despesas, depreciacao, amortizacao]);

  return (
    <Grid
      inputs={
        <>
          <NumField label="Receita líquida" value={receita} onChange={setReceita} money />
          <NumField label="Custos operacionais" value={custos} onChange={setCustos} money />
          <NumField label="Despesas operacionais" value={despesas} onChange={setDespesas} money />
          <NumField label="Depreciação" value={depreciacao} onChange={setDepreciacao} money />
          <NumField label="Amortização" value={amortizacao} onChange={setAmortizacao} money />
        </>
      }
      results={
        <>
          <ResultCard label="EBITDA" value={brl(result.ebitda)} />
          <ResultCard label="Margem EBITDA" value={`${result.margem.toFixed(1)}%`} />
        </>
      }
    />
  );
}

function BreakEven() {
  const [cf, setCf] = useState(80000);
  const [pv, setPv] = useState(350);
  const [cv, setCv] = useState(140);

  const result = useMemo(() => {
    const mc = pv - cv;
    const bep = mc > 0 ? cf / mc : 0;
    const receita = bep * pv;
    return { mc, bep, receita };
  }, [cf, pv, cv]);

  return (
    <Grid
      inputs={
        <>
          <NumField label="Custos fixos totais" value={cf} onChange={setCf} money />
          <NumField label="Preço de venda unitário" value={pv} onChange={setPv} money />
          <NumField label="Custo variável unitário" value={cv} onChange={setCv} money />
        </>
      }
      results={
        <>
          <ResultCard
            label="Unidades para break even"
            value={Math.ceil(result.bep).toLocaleString("pt-BR")}
          />
          <ResultCard label="Receita no break even" value={brl(result.receita)} />
          <ResultCard label="Margem de contribuição unitária" value={brl(result.mc)} />
        </>
      }
    />
  );
}

function Roi() {
  const [investimento, setInvestimento] = useState(200000);
  const [retorno, setRetorno] = useState(280000);

  const result = useMemo(() => {
    const roi = investimento > 0 ? ((retorno - investimento) / investimento) * 100 : 0;
    const lucro = retorno - investimento;
    const mult = investimento > 0 ? retorno / investimento : 0;
    return { roi, lucro, mult };
  }, [investimento, retorno]);

  return (
    <Grid
      inputs={
        <>
          <NumField
            label="Valor do investimento"
            value={investimento}
            onChange={setInvestimento}
            money
          />
          <NumField label="Retorno obtido" value={retorno} onChange={setRetorno} money />
        </>
      }
      results={
        <>
          <ResultCard label="ROI" value={`${result.roi.toFixed(1)}%`} />
          <ResultCard label="Lucro líquido" value={brl(result.lucro)} />
          <ResultCard label="Multiplicador" value={`${result.mult.toFixed(2)}x`} />
        </>
      }
    />
  );
}

function MargemLiquida() {
  const [receita, setReceita] = useState(500000);
  const [lucro, setLucro] = useState(65000);

  const margem = receita > 0 ? (lucro / receita) * 100 : 0;

  return (
    <Grid
      inputs={
        <>
          <NumField label="Receita líquida" value={receita} onChange={setReceita} money />
          <NumField label="Lucro líquido" value={lucro} onChange={setLucro} money />
        </>
      }
      results={
        <>
          <ResultCard label="Margem líquida" value={`${margem.toFixed(1)}%`} />
          <ResultCard
            label="Cada R$ 1 de receita gera"
            value={brl(margem / 100)}
            hint="de lucro líquido"
          />
        </>
      }
    />
  );
}

function Markup() {
  const [custo, setCusto] = useState(100);
  const [df, setDf] = useState(15);
  const [dv, setDv] = useState(10);
  const [lucroDesejado, setLucroDesejado] = useState(20);

  const result = useMemo(() => {
    const total = df + dv + lucroDesejado;
    const markup = total < 100 ? 100 / (100 - total) : 0;
    const preco = custo * markup;
    return { markup, preco };
  }, [custo, df, dv, lucroDesejado]);

  return (
    <Grid
      inputs={
        <>
          <NumField label="Custo do produto" value={custo} onChange={setCusto} money />
          <NumField label="Despesas fixas" value={df} onChange={setDf} suffix="%" />
          <NumField label="Despesas variáveis" value={dv} onChange={setDv} suffix="%" />
          <NumField
            label="Lucro desejado"
            value={lucroDesejado}
            onChange={setLucroDesejado}
            suffix="%"
          />
        </>
      }
      results={
        <>
          <ResultCard label="Markup" value={result.markup.toFixed(2)} />
          <ResultCard label="Preço de venda" value={brl(result.preco)} />
          <ResultCard label="Margem de lucro em R$" value={brl(result.preco - custo)} />
        </>
      }
    />
  );
}

function CapitalDeGiro() {
  const [pmr, setPmr] = useState(45);
  const [pme, setPme] = useState(30);
  const [pmp, setPmp] = useState(30);
  const [custoMensal, setCustoMensal] = useState(150000);

  const result = useMemo(() => {
    const ciclo = pmr + pme - pmp;
    const ncg = (custoMensal / 30) * ciclo;
    return { ciclo, ncg };
  }, [pmr, pme, pmp, custoMensal]);

  return (
    <Grid
      inputs={
        <>
          <NumField
            label="Prazo médio de recebimento"
            value={pmr}
            onChange={setPmr}
            suffix="dias"
          />
          <NumField label="Prazo médio de estoque" value={pme} onChange={setPme} suffix="dias" />
          <NumField label="Prazo médio de pagamento" value={pmp} onChange={setPmp} suffix="dias" />
          <NumField
            label="Custo operacional mensal"
            value={custoMensal}
            onChange={setCustoMensal}
            money
          />
        </>
      }
      results={
        <>
          <ResultCard label="Ciclo de conversão de caixa" value={`${result.ciclo} dias`} />
          <ResultCard label="Necessidade de capital de giro" value={brl(result.ncg)} />
        </>
      }
    />
  );
}

function Wacc() {
  const [pl, setPl] = useState(3000000);
  const [divida, setDivida] = useState(1500000);
  const [ke, setKe] = useState(15);
  const [kd, setKd] = useState(12);
  const [ir, setIr] = useState(34);

  const result = useMemo(() => {
    const total = pl + divida;
    const we = total > 0 ? pl / total : 0;
    const wd = total > 0 ? divida / total : 0;
    const wacc = we * ke + wd * kd * (1 - ir / 100);
    return { we, wd, wacc };
  }, [pl, divida, ke, kd, ir]);

  return (
    <Grid
      inputs={
        <>
          <NumField label="Valor do patrimônio líquido" value={pl} onChange={setPl} money />
          <NumField label="Valor da dívida" value={divida} onChange={setDivida} money />
          <NumField label="Custo do capital próprio" value={ke} onChange={setKe} suffix="%" />
          <NumField label="Custo da dívida" value={kd} onChange={setKd} suffix="%" />
          <NumField label="Alíquota de IR" value={ir} onChange={setIr} suffix="%" />
        </>
      }
      results={
        <>
          <ResultCard label="WACC" value={`${result.wacc.toFixed(2)}%`} />
          <ResultCard
            label="Participação capital próprio"
            value={`${(result.we * 100).toFixed(1)}%`}
          />
          <ResultCard label="Participação dívida" value={`${(result.wd * 100).toFixed(1)}%`} />
        </>
      }
    />
  );
}

function Valuation() {
  const [ebitda, setEbitda] = useState(3000000);
  const [multiplo, setMultiplo] = useState(6);
  const [divida, setDivida] = useState(500000);

  const result = useMemo(() => {
    const ev = ebitda * multiplo;
    const equity = ev - divida;
    return { ev, equity };
  }, [ebitda, multiplo, divida]);

  return (
    <Grid
      inputs={
        <>
          <NumField label="EBITDA anual" value={ebitda} onChange={setEbitda} money />
          <NumField label="Múltiplo de EBITDA" value={multiplo} onChange={setMultiplo} />
          <NumField label="Dívida líquida" value={divida} onChange={setDivida} money />
        </>
      }
      results={
        <>
          <ResultCard
            label="Enterprise Value"
            value={brl(result.ev)}
            hint={`${multiplo.toFixed(1)}x EBITDA`}
          />
          <ResultCard label="Equity Value" value={brl(result.equity)} hint="EV − dívida líquida" />
        </>
      }
    />
  );
}
