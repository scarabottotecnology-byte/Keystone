import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/ferramentas/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ferramentas de Decisão de Capital — Keystone" },
      {
        name: "description",
        content:
          "Simule Simples Nacional, Reforma Tributária, ponto de equilíbrio, valuation por EBITDA, capital de giro e VPL/payback para decisões de capital.",
      },
    ],
  }),
  component: FerramentasPage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number, digits = 2) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

function FerramentasPage() {
  const [tab, setTab] = useState<"simples" | "reforma" | "breakeven" | "valuation" | "ncg" | "vpl">(
    "simples",
  );

  return (
    <div className="min-h-screen bg-navy">
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-8 py-16">
        {/* Hero da página de ferramentas */}
        <div className="mb-16 border-b border-border-sub pb-16">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold">
              Ferramentas de Decisão de Capital
            </span>
            <Link
              to="/ferramentas/social"
              className="text-[11px] uppercase tracking-[0.2em] text-cream-mute hover:text-gold"
            >
              Calendário Social Media →
            </Link>
          </div>
          <h1 className="mt-5 font-display text-5xl font-light leading-[1.05] text-cream md:text-6xl">
            Cálculos rápidos para
            <br />
            <strong className="font-semibold">decisões de capital.</strong>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
            Simule cenários tributários, operacionais e de valuation. Tenha números confiáveis antes
            de sentar à mesa de negociação.
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            {[
              { bold: "Simples Nacional", sub: "alíquota efetiva real" },
              { bold: "Reforma Tributária", sub: "comparativo CBS/IBS/IS" },
              { bold: "Ponto de Equilíbrio", sub: "volume e margem mínimos" },
              { bold: "Valuation EBITDA", sub: "enterprise e equity value" },
              { bold: "Capital de Giro", sub: "NCG e ciclo financeiro" },
              { bold: "VPL & Payback", sub: "retorno de investimentos" },
              { bold: "para empresas de R$10M+", sub: "em faturamento" },
            ].map(({ bold, sub }) => (
              <div key={bold} className="flex items-center gap-2.5">
                <div className="h-4 w-px bg-gold/50" />
                <span className="text-xs text-cream-mute">
                  <strong className="font-medium text-cream-dim">{bold}</strong> · {sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-cream-mute">Tributário</p>
            <div className="flex flex-wrap gap-2 border-b border-border-sub">
              <TabButton active={tab === "simples"} onClick={() => setTab("simples")}>
                Simples Nacional 2024
              </TabButton>
              <TabButton active={tab === "reforma"} onClick={() => setTab("reforma")}>
                Reforma Tributária
              </TabButton>
            </div>
          </div>
          <div>
            <p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-cream-mute">
              Decisões de Capital
            </p>
            <div className="flex flex-wrap gap-2 border-b border-border-sub">
              <TabButton active={tab === "breakeven"} onClick={() => setTab("breakeven")}>
                Ponto de Equilíbrio
              </TabButton>
              <TabButton active={tab === "valuation"} onClick={() => setTab("valuation")}>
                Valuation EBITDA
              </TabButton>
              <TabButton active={tab === "ncg"} onClick={() => setTab("ncg")}>
                Capital de Giro
              </TabButton>
              <TabButton active={tab === "vpl"} onClick={() => setTab("vpl")}>
                VPL & Payback
              </TabButton>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {tab === "simples" && <SimplesNacional />}
          {tab === "reforma" && <ReformaTributaria />}
          {tab === "breakeven" && <PontoEquilibrio />}
          {tab === "valuation" && <ValuationEbitda />}
          {tab === "ncg" && <CapitalDeGiro />}
          {tab === "vpl" && <VplPayback />}
        </div>

        <LeadCapture />
      </main>

      <SiteFooter />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors border-b-2 -mb-px ${
        active ? "text-gold border-gold" : "text-cream-mute border-transparent hover:text-cream"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Ferramenta 1 — Simples Nacional ---------- */

type Faixa = { faixa: number; teto: number; aliquota: number; deduzir: number };

const ANEXOS: Record<string, { nome: string; faixas: Faixa[] }> = {
  I: {
    nome: "Anexo I — Comércio",
    faixas: [
      { faixa: 1, teto: 180000, aliquota: 4.0, deduzir: 0 },
      { faixa: 2, teto: 360000, aliquota: 7.3, deduzir: 5940 },
      { faixa: 3, teto: 720000, aliquota: 9.5, deduzir: 13860 },
      { faixa: 4, teto: 1800000, aliquota: 10.7, deduzir: 22500 },
      { faixa: 5, teto: 3600000, aliquota: 14.3, deduzir: 87300 },
      { faixa: 6, teto: 4800000, aliquota: 19.0, deduzir: 378000 },
    ],
  },
  II: {
    nome: "Anexo II — Indústria",
    faixas: [
      { faixa: 1, teto: 180000, aliquota: 4.5, deduzir: 0 },
      { faixa: 2, teto: 360000, aliquota: 7.8, deduzir: 5940 },
      { faixa: 3, teto: 720000, aliquota: 10.0, deduzir: 13860 },
      { faixa: 4, teto: 1800000, aliquota: 11.2, deduzir: 22500 },
      { faixa: 5, teto: 3600000, aliquota: 14.7, deduzir: 85500 },
      { faixa: 6, teto: 4800000, aliquota: 30.0, deduzir: 720000 },
    ],
  },
  III: {
    nome: "Anexo III — Serviços (ISS menor)",
    faixas: [
      { faixa: 1, teto: 180000, aliquota: 6.0, deduzir: 0 },
      { faixa: 2, teto: 360000, aliquota: 11.2, deduzir: 9360 },
      { faixa: 3, teto: 720000, aliquota: 13.5, deduzir: 17640 },
      { faixa: 4, teto: 1800000, aliquota: 16.0, deduzir: 35640 },
      { faixa: 5, teto: 3600000, aliquota: 21.0, deduzir: 125640 },
      { faixa: 6, teto: 4800000, aliquota: 33.0, deduzir: 648000 },
    ],
  },
  IV: {
    nome: "Anexo IV — Serviços (sem CPP)",
    faixas: [
      { faixa: 1, teto: 180000, aliquota: 4.5, deduzir: 0 },
      { faixa: 2, teto: 360000, aliquota: 9.0, deduzir: 8100 },
      { faixa: 3, teto: 720000, aliquota: 10.2, deduzir: 12420 },
      { faixa: 4, teto: 1800000, aliquota: 14.0, deduzir: 39780 },
      { faixa: 5, teto: 3600000, aliquota: 22.0, deduzir: 183780 },
      { faixa: 6, teto: 4800000, aliquota: 33.0, deduzir: 828000 },
    ],
  },
  V: {
    nome: "Anexo V — Serviços (Fator R)",
    faixas: [
      { faixa: 1, teto: 180000, aliquota: 15.5, deduzir: 0 },
      { faixa: 2, teto: 360000, aliquota: 18.0, deduzir: 4500 },
      { faixa: 3, teto: 720000, aliquota: 19.5, deduzir: 9900 },
      { faixa: 4, teto: 1800000, aliquota: 20.5, deduzir: 17100 },
      { faixa: 5, teto: 3600000, aliquota: 23.0, deduzir: 62100 },
      { faixa: 6, teto: 4800000, aliquota: 30.5, deduzir: 540000 },
    ],
  },
};

function SimplesNacional() {
  const [rbt12, setRbt12] = useState(1200000);
  const [anexo, setAnexo] = useState<keyof typeof ANEXOS>("I");
  const [receitaMes, setReceitaMes] = useState(120000);

  const result = useMemo(() => {
    const anexoData = ANEXOS[anexo];
    const faixa =
      anexoData.faixas.find((f) => rbt12 <= f.teto) ??
      anexoData.faixas[anexoData.faixas.length - 1];
    const aliquotaEfetiva =
      rbt12 > 0 ? (rbt12 * (faixa.aliquota / 100) - faixa.deduzir) / rbt12 : 0;
    const efetivaPct = Math.max(aliquotaEfetiva * 100, 0);
    const imposto = receitaMes * (efetivaPct / 100);
    const progresso = Math.min((rbt12 / faixa.teto) * 100, 100);
    return { faixa, efetivaPct, imposto, progresso, anexoNome: anexoData.nome };
  }, [rbt12, anexo, receitaMes]);

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-light text-cream">
          Simulador Simples Nacional 2024
        </h2>
        <p className="mt-2 text-sm text-cream-dim">
          Calcule a alíquota efetiva pelo regime do Simples Nacional.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border-sub bg-navy-card p-8 space-y-6">
          <NumField
            label="Faturamento acumulado — últimos 12 meses (RBT12)"
            value={rbt12}
            onChange={setRbt12}
            money
          />
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
              Anexo do Simples Nacional
            </span>
            <select
              value={anexo}
              onChange={(e) => setAnexo(e.target.value as keyof typeof ANEXOS)}
              className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
            >
              {Object.entries(ANEXOS).map(([k, v]) => (
                <option key={k} value={k} className="bg-navy">
                  {v.nome}
                </option>
              ))}
            </select>
          </label>
          <NumField
            label="Receita bruta do mês atual"
            value={receitaMes}
            onChange={setReceitaMes}
            money
          />
        </div>

        <div className="space-y-6">
          <ResultCard
            label="Alíquota efetiva"
            value={pct(result.efetivaPct)}
            hint={`Alíquota nominal da faixa: ${pct(result.faixa.aliquota, 2)} · Parcela a deduzir: ${brl(result.faixa.deduzir)}`}
          />
          <ResultCard
            label="Imposto estimado do mês"
            value={brl(result.imposto)}
            hint={`${result.anexoNome} · Receita: ${brl(receitaMes)}`}
          />
          <div className="border border-border-sub bg-navy-card p-8">
            <div className="text-[11px] uppercase tracking-[0.25em] text-cream-mute">
              Faixa atual · {result.faixa.faixa}ª
            </div>
            <div className="mt-3 flex items-baseline justify-between text-sm text-cream-dim">
              <span>{brl(rbt12)}</span>
              <span>Teto: {brl(result.faixa.teto)}</span>
            </div>
            <div className="mt-3 h-2 w-full bg-navy border border-border-sub">
              <div
                className="h-full bg-gold transition-all"
                style={{ width: `${result.progresso}%` }}
              />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-cream-mute">
            Fórmula: alíquota efetiva = ((RBT12 × alíquota nominal) − parcela a deduzir) / RBT12.
            Estimativa para fins de planejamento; não substitui apuração fiscal oficial.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Ferramenta 2 — Reforma Tributária ---------- */

type Regime = "simples" | "presumido" | "real";
type Setor =
  | "comercio"
  | "industria"
  | "servicos"
  | "saude"
  | "educacao"
  | "financeiro"
  | "agronegocio"
  | "tecnologia";

const SETORES: Record<Setor, string> = {
  comercio: "Comércio Varejista",
  industria: "Indústria",
  servicos: "Prestação de Serviços Gerais",
  saude: "Saúde",
  educacao: "Educação",
  financeiro: "Financeiro",
  agronegocio: "Agronegócio",
  tecnologia: "Tecnologia / Software",
};

function ReformaTributaria() {
  const [receita, setReceita] = useState(500000);
  const [regime, setRegime] = useState<Regime>("presumido");
  const [setor, setSetor] = useState<Setor>("comercio");
  const [icms, setIcms] = useState(12);
  const [iss, setIss] = useState(5);
  const [pis, setPis] = useState(0.65);
  const [cofins, setCofins] = useState(3);

  // Auto-fill PIS/COFINS por regime
  useEffect(() => {
    if (regime === "presumido") {
      setPis(0.65);
      setCofins(3);
    } else if (regime === "real") {
      setPis(1.65);
      setCofins(7.6);
    } else {
      setPis(0);
      setCofins(0);
    }
  }, [regime]);

  const result = useMemo(() => {
    // Alíquotas de referência
    const CBS_BASE = 8.8;
    const IBS_BASE = 26.5;

    let cbs = CBS_BASE;
    let ibs = IBS_BASE;

    // Reduções setoriais
    if (setor === "saude" || setor === "educacao") {
      cbs = CBS_BASE * 0.4; // redução 60%
      ibs = IBS_BASE * 0.4;
    }
    if (setor === "tecnologia") {
      ibs = IBS_BASE * 0.7; // redução 30% no IBS
    }

    // Imposto Seletivo — setores listados não incluem tabaco/bebidas/veículos; mantemos 0
    const isSel = 0;

    const cargaAtualPct = icms + iss + pis + cofins;
    const cargaNovaPct = cbs + ibs + isSel;

    const cargaAtual = receita * (cargaAtualPct / 100);
    const cargaNova = receita * (cargaNovaPct / 100);
    const variacao = cargaNova - cargaAtual;
    const variacaoPct = cargaAtual > 0 ? (variacao / cargaAtual) * 100 : 0;

    const cashbackAgro = setor === "agronegocio";

    return {
      cbs,
      ibs,
      isSel,
      cargaAtualPct,
      cargaNovaPct,
      cargaAtual,
      cargaNova,
      variacao,
      variacaoPct,
      cashbackAgro,
      breakdown: {
        atual: [
          { label: "ICMS", value: receita * (icms / 100) },
          { label: "ISS", value: receita * (iss / 100) },
          { label: "PIS", value: receita * (pis / 100) },
          { label: "COFINS", value: receita * (cofins / 100) },
        ],
        novo: [
          { label: "CBS", value: receita * (cbs / 100) },
          { label: "IBS", value: receita * (ibs / 100) },
        ],
      },
    };
  }, [receita, setor, icms, iss, pis, cofins]);

  const isReducao = result.variacao < 0;
  const maxBar = Math.max(
    ...result.breakdown.atual.map((b) => b.value),
    ...result.breakdown.novo.map((b) => b.value),
    1,
  );

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-display text-3xl font-light text-cream">
          Calculadora Reforma Tributária — CBS, IBS e IS
        </h2>
        <p className="mt-2 text-sm text-cream-dim">
          Simule o impacto da reforma tributária no seu regime fiscal.
        </p>
      </div>

      <div className="mb-8 border border-gold/25 bg-gold/5 p-5 text-sm text-cream-dim">
        <strong className="text-gold font-medium">Nota:</strong> baseado na EC 132/2023 e PLP
        68/2024. Alíquotas de referência sujeitas a regulamentação complementar. Use para
        planejamento e análise de impacto — não substitui consultoria tributária.
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border-sub bg-navy-card p-8 space-y-6">
          <NumField label="Receita bruta mensal" value={receita} onChange={setReceita} money />
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
              Regime atual
            </span>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value as Regime)}
              className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
            >
              <option value="simples">Simples Nacional</option>
              <option value="presumido">Lucro Presumido</option>
              <option value="real">Lucro Real</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
              Setor de atividade
            </span>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value as Setor)}
              className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
            >
              {Object.entries(SETORES).map(([k, v]) => (
                <option key={k} value={k} className="bg-navy">
                  {v}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <NumField label="ICMS (%)" value={icms} onChange={setIcms} />
            <NumField label="ISS (%)" value={iss} onChange={setIss} />
            <NumField label="PIS (%)" value={pis} onChange={setPis} />
            <NumField label="COFINS (%)" value={cofins} onChange={setCofins} />
          </div>
        </div>

        <div className="space-y-6">
          <ResultCard
            label="Carga tributária atual"
            value={brl(result.cargaAtual)}
            hint={`${brl(result.cargaAtual * 12)} / ano · ${pct(result.cargaAtualPct)} sobre receita`}
          />
          <ResultCard
            label="Carga pós-reforma (estimada)"
            value={brl(result.cargaNova)}
            hint={`${brl(result.cargaNova * 12)} / ano · ${pct(result.cargaNovaPct)} sobre receita · CBS ${pct(result.cbs)} + IBS ${pct(result.ibs)}`}
          />
          <div
            className={`border p-8 ${
              isReducao
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-red-500/40 bg-red-500/5"
            }`}
          >
            <div className="text-[11px] uppercase tracking-[0.25em] text-cream-mute">
              Variação estimada
            </div>
            <div
              className={`mt-3 font-display text-4xl font-light ${
                isReducao ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isReducao ? "" : "+"}
              {brl(result.variacao)}
            </div>
            <div className="mt-1 text-sm text-cream-dim">
              {isReducao ? "" : "+"}
              {pct(result.variacaoPct)} vs. carga atual · anual: {brl(result.variacao * 12)}
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo */}
      <div className="mt-10 border border-border-sub bg-navy-card p-8">
        <h3 className="font-display text-xl font-light text-cream">Comparativo por tributo</h3>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <BarBlock title="Regime atual" bars={result.breakdown.atual} max={maxBar} tone="dim" />
          <BarBlock title="Pós-reforma" bars={result.breakdown.novo} max={maxBar} tone="gold" />
        </div>
      </div>

      {result.cashbackAgro ? (
        <p className="mt-6 text-xs leading-relaxed text-cream-mute">
          Agronegócio: previsão de cashback de IBS para produtor rural pessoa física — não incluso
          nesta simulação.
        </p>
      ) : null}

      <p className="mt-6 text-xs leading-relaxed text-cream-mute">
        Esta simulação usa alíquotas de referência. A alíquota final do IBS será aprovada por cada
        estado e município.{" "}
        <a href="/#contato" className="text-gold hover:underline">
          Solicite uma análise personalizada
        </a>
        .
      </p>
    </section>
  );
}

function BarBlock({
  title,
  bars,
  max,
  tone,
}: {
  title: string;
  bars: { label: string; value: number }[];
  max: number;
  tone: "dim" | "gold";
}) {
  const total = bars.reduce((s, b) => s + b.value, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">{title}</span>
        <span className="text-sm text-cream">{brl(total)}</span>
      </div>
      <div className="mt-4 space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs text-cream-dim">
              <span>{b.label}</span>
              <span>{brl(b.value)}</span>
            </div>
            <div className="mt-1 h-2 w-full bg-navy border border-border-sub">
              <div
                className={`h-full transition-all ${tone === "gold" ? "bg-gold" : "bg-cream/40"}`}
                style={{ width: `${max > 0 ? (b.value / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- shared ---------- */

function NumField({
  label,
  value,
  onChange,
  money,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  money?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">{label}</span>
      <div className="mt-2 relative">
        {money ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream-mute text-sm">
            R$
          </span>
        ) : null}
        <input
          type="number"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`w-full border border-border-sub bg-navy py-3 text-cream outline-none transition-colors focus:border-gold ${
            money ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </label>
  );
}

function ResultCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-gold/30 bg-gradient-to-br from-navy-card to-navy p-8">
      <div className="text-[11px] uppercase tracking-[0.25em] text-cream-mute">{label}</div>
      <div className="mt-3 font-display text-4xl font-light text-gold">{value}</div>
      {hint ? <div className="mt-2 text-xs text-cream-dim">{hint}</div> : null}
    </div>
  );
}

function LeadCapture() {
  const [form, setForm] = useState({ firstname: "", email: "", company: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const { saveLead } = await import("@/lib/leads");
    const result = await saveLead({
      nome: form.firstname,
      email: form.email,
      empresa: form.company,
      telefone: form.phone,
      origem: "Ferramentas Tributárias",
      track: "geral",
    });
    setStatus(result.ok ? "done" : "error");
  }

  return (
    <div className="mt-20 border-t border-border-sub pt-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold">
            Análise personalizada
          </span>
          <h2 className="mt-5 font-display text-4xl font-light leading-tight text-cream">
            Sua simulação revelou
            <br />
            <em className="italic text-gold">uma oportunidade?</em>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-cream-dim">
            Deixe seu contato e receba uma análise tributária personalizada para a realidade da sua
            empresa — sem custo, sem compromisso.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Diagnóstico do regime tributário atual",
              "Comparativo com regimes alternativos",
              "Estimativa de economia anual potencial",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-cream-dim">
                <span className="mt-1.5 h-px w-5 shrink-0 bg-gold/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-border-sub bg-navy-card p-8">
          {status === "done" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-3xl">✓</div>
              <p className="font-display text-xl text-gold">Recebido.</p>
              <p className="mt-3 text-sm text-cream-dim">
                Entraremos em contato em até 24 horas úteis com sua análise personalizada.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {(
                [
                  { name: "firstname", label: "Nome completo", type: "text", required: true },
                  { name: "email", label: "E-mail corporativo", type: "email", required: true },
                  { name: "company", label: "Empresa", type: "text", required: true },
                  { name: "phone", label: "WhatsApp / Telefone", type: "tel", required: false },
                ] as const
              ).map(({ name, label, type, required }) => (
                <label key={name} className="block">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
                    {label}
                    {required && " *"}
                  </span>
                  <input
                    type={type}
                    required={required}
                    value={form[name]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold placeholder:text-cream-mute/40"
                  />
                </label>
              ))}
              {status === "error" && (
                <p className="text-xs text-red-400">Erro ao enviar. Tente novamente.</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-gold mt-2 w-full justify-center disabled:opacity-60"
              >
                {status === "loading" ? "Enviando..." : "Solicitar Análise Personalizada →"}
              </button>
              <p className="text-center text-[10px] uppercase tracking-[0.15em] text-cream-mute">
                Confidencialidade total · Sem spam
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Placeholders das novas calculadoras ---------- */

function PontoEquilibrio() {
  const [cf, setCf] = useState(80000);
  const [pv, setPv] = useState(350);
  const [cvu, setCvu] = useState(140);
  const [producaoAtual, setProducaoAtual] = useState(400);

  const result = useMemo(() => {
    const mc = pv - cvu;
    const mcPct = pv > 0 ? (mc / pv) * 100 : 0;
    const peQtd = mc > 0 ? cf / mc : 0;
    const peReceita = mcPct > 0 ? cf / (mcPct / 100) : 0;
    const margemSeguranca = producaoAtual > 0 ? ((producaoAtual - peQtd) / producaoAtual) * 100 : 0;
    const lucroAtual = producaoAtual * mc - cf;
    return { mc, mcPct, peQtd, peReceita, margemSeguranca, lucroAtual };
  }, [cf, pv, cvu, producaoAtual]);

  const isViavel = result.margemSeguranca > 0;

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-light text-cream">
          Ponto de Equilíbrio Operacional
        </h2>
        <p className="mt-2 text-sm text-cream-dim">
          Calcule o volume mínimo de vendas para cobrir todos os custos da operação.
        </p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border-sub bg-navy-card p-8 space-y-6">
          <NumField label="Custos fixos mensais totais (R$)" value={cf} onChange={setCf} money />
          <NumField label="Preço de venda unitário (R$)" value={pv} onChange={setPv} money />
          <NumField label="Custo variável unitário (R$)" value={cvu} onChange={setCvu} money />
          <NumField
            label="Produção / vendas atuais (unidades/mês)"
            value={producaoAtual}
            onChange={setProducaoAtual}
          />
        </div>
        <div className="space-y-5">
          <ResultCard
            label="Ponto de equilíbrio (unidades)"
            value={Math.ceil(result.peQtd).toLocaleString("pt-BR")}
            hint={`Margem de contribuição unitária: ${brl(result.mc)} · MC%: ${pct(result.mcPct)}`}
          />
          <ResultCard
            label="Receita de equilíbrio"
            value={brl(result.peReceita)}
            hint="Receita mínima necessária para cobrir custos fixos"
          />
          <div
            className={`border p-6 ${isViavel ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}
          >
            <div className="text-[11px] uppercase tracking-[0.25em] text-cream-mute">
              Margem de segurança operacional
            </div>
            <div
              className={`mt-3 font-display text-4xl font-light ${isViavel ? "text-emerald-400" : "text-red-400"}`}
            >
              {pct(result.margemSeguranca, 1)}
            </div>
            <div className="mt-1 text-sm text-cream-dim">
              {isViavel
                ? `Resultado estimado: ${brl(result.lucroAtual)} / mês`
                : "Operação abaixo do ponto de equilíbrio — prejuízo operacional"}
            </div>
          </div>
          <p className="text-xs text-cream-mute leading-relaxed">
            Válido para estrutura de custo linear. Não considera impostos, depreciação ou variações
            sazonais.
          </p>
        </div>
      </div>
    </section>
  );
}

const MULTIPLOS_SETOR: Record<string, { nome: string; min: number; base: number; max: number }> = {
  tecnologia: { nome: "Tecnologia / SaaS", min: 6, base: 8, max: 12 },
  saude: { nome: "Saúde / Farmacêutico", min: 6, base: 8, max: 10 },
  industria: { nome: "Indústria / Manufatura", min: 4, base: 5.5, max: 7 },
  comercio: { nome: "Comércio / Varejo", min: 3, base: 4.5, max: 6 },
  servicos: { nome: "Serviços B2B", min: 4, base: 6, max: 8 },
  agronegocio: { nome: "Agronegócio", min: 4, base: 6, max: 8 },
  logistica: { nome: "Logística / Transporte", min: 4, base: 5, max: 7 },
  construcao: { nome: "Construção / Real Estate", min: 3, base: 4.5, max: 6 },
  educacao: { nome: "Educação", min: 5, base: 7, max: 10 },
};

function ValuationEbitda() {
  const [ebitda, setEbitda] = useState(3000000);
  const [setor, setSetor] = useState("servicos");
  const [multiplicadorCustom, setMultiplicadorCustom] = useState(6);
  const [dividaLiquida, setDividaLiquida] = useState(500000);
  const [useCustom, setUseCustom] = useState(false);

  const result = useMemo(() => {
    const s = MULTIPLOS_SETOR[setor];
    const mult = useCustom && multiplicadorCustom > 0 ? multiplicadorCustom : s.base;
    const multMin = useCustom && multiplicadorCustom > 0 ? multiplicadorCustom * 0.8 : s.min;
    const multMax = useCustom && multiplicadorCustom > 0 ? multiplicadorCustom * 1.2 : s.max;
    const ev = ebitda * mult;
    const evMin = ebitda * multMin;
    const evMax = ebitda * multMax;
    const equity = ev - dividaLiquida;
    const equityMin = evMin - dividaLiquida;
    const equityMax = evMax - dividaLiquida;
    return {
      mult,
      multMin,
      multMax,
      ev,
      evMin,
      evMax,
      equity,
      equityMin,
      equityMax,
      setorNome: s.nome,
    };
  }, [ebitda, setor, multiplicadorCustom, dividaLiquida, useCustom]);

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-light text-cream">
          Valuation Rápido por Múltiplos de EBITDA
        </h2>
        <p className="mt-2 text-sm text-cream-dim">
          Estime o valor da empresa usando múltiplos de mercado por setor. Base para negociações de
          M&A e entrada de sócios.
        </p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border-sub bg-navy-card p-8 space-y-6">
          <NumField label="EBITDA anual (R$)" value={ebitda} onChange={setEbitda} money />
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
              Setor da empresa
            </span>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
            >
              {Object.entries(MULTIPLOS_SETOR).map(([k, v]) => (
                <option key={k} value={k} className="bg-navy">
                  {v.nome} ({v.min}x – {v.max}x)
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="accent-gold h-4 w-4"
            />
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
              Usar múltiplo customizado
            </span>
          </label>
          {useCustom && (
            <NumField
              label="Múltiplo customizado (ex: 6)"
              value={multiplicadorCustom}
              onChange={setMultiplicadorCustom}
            />
          )}
          <NumField
            label="Dívida líquida (R$)"
            value={dividaLiquida}
            onChange={setDividaLiquida}
            money
          />
        </div>
        <div className="space-y-5">
          <ResultCard
            label={`Enterprise Value — ${result.mult.toFixed(1)}x EBITDA`}
            value={brl(result.ev)}
            hint={`Faixa: ${brl(result.evMin)} – ${brl(result.evMax)} · ${result.setorNome}`}
          />
          <ResultCard
            label="Equity Value (EV − Dívida Líquida)"
            value={brl(result.equity)}
            hint={`Faixa: ${brl(result.equityMin)} – ${brl(result.equityMax)}`}
          />
          <div className="border border-gold/20 bg-navy-card p-6 space-y-3">
            <div className="text-[11px] uppercase tracking-[0.25em] text-cream-mute">
              Faixa de múltiplos do setor
            </div>
            {[
              { label: "Conservador", mult: result.multMin, ev: result.evMin },
              { label: "Base de mercado", mult: result.mult, ev: result.ev },
              { label: "Otimista", mult: result.multMax, ev: result.evMax },
            ].map(({ label, mult, ev }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-cream-mute text-xs">
                  {label} · {mult.toFixed(1)}x
                </span>
                <span className="text-cream font-medium">{brl(ev)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-cream-mute leading-relaxed">
            Múltiplos de referência para o mercado brasileiro. Valuation real depende de
            crescimento, qualidade do EBITDA e estrutura de capital. Solicite uma avaliação PRISMA
            para due diligence completa.
          </p>
        </div>
      </div>
    </section>
  );
}

function CapitalDeGiro() {
  const [compras, setCompras] = useState(60000);
  const [pmp, setPmp] = useState(30);
  const [vendas, setVendas] = useState(120000);
  const [pmr, setPmr] = useState(45);
  const [estoques, setEstoques] = useState(40000);
  const [pme, setPme] = useState(30);
  const [saldoMinimo, setSaldoMinimo] = useState(20000);

  const result = useMemo(() => {
    const pmrDias = Math.max(pmr, 0);
    const pmpDias = Math.max(pmp, 0);
    const pmeDias = Math.max(pme, 0);
    const co = (vendas / 30) * pmrDias;
    const cp = (compras / 30) * pmpDias;
    const estoqueGiro = (estoques / 30) * pmeDias;
    const ncg = co + estoqueGiro - cp;
    const ciclo = pmrDias + pmeDias - pmpDias;
    const necessidadeTotal = ncg + saldoMinimo;
    return { co, cp, estoqueGiro, ncg, ciclo, necessidadeTotal };
  }, [compras, pmp, vendas, pmr, estoques, pme, saldoMinimo]);

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-light text-cream">Capital de Giro e NCG</h2>
        <p className="mt-2 text-sm text-cream-dim">
          Calcule a necessidade operacional de caixa, prazo médio e ciclo financeiro.
        </p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border-sub bg-navy-card p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <NumField label="Compras mensais (R$)" value={compras} onChange={setCompras} money />
            <NumField label="PMP (dias)" value={pmp} onChange={setPmp} />
            <NumField label="Vendas mensais (R$)" value={vendas} onChange={setVendas} money />
            <NumField label="PMR (dias)" value={pmr} onChange={setPmr} />
            <NumField label="Estoque médio (R$)" value={estoques} onChange={setEstoques} money />
            <NumField label="PME (dias)" value={pme} onChange={setPme} />
            <NumField
              label="Saldo mínimo operacional (R$)"
              value={saldoMinimo}
              onChange={setSaldoMinimo}
              money
            />
          </div>
        </div>
        <div className="space-y-5">
          <ResultCard
            label="Necessidade de Capital de Giro (NCG)"
            value={brl(result.ncg)}
            hint={`Ciclo financeiro: ${result.ciclo.toFixed(0)} dias`}
          />
          <ResultCard
            label="Necessidade total de caixa"
            value={brl(result.necessidadeTotal)}
            hint="NCG + saldo mínimo operacional"
          />
          <div className="border border-gold/20 bg-navy-card p-6 space-y-3">
            <div className="text-[11px] uppercase tracking-[0.25em] text-cream-mute">
              Composição operacional
            </div>
            {[
              { label: "Contas a receber", value: result.co },
              { label: "Estoque em giro", value: result.estoqueGiro },
              { label: "Contas a pagar", value: -result.cp },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-cream-mute text-xs">{label}</span>
                <span className={`font-medium ${value >= 0 ? "text-cream" : "text-red-400"}`}>
                  {brl(value)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-cream-mute leading-relaxed">
            Fórmula: NCG = Contas a Receber + Estoques − Contas a Pagar. Saldo mínimo representa
            caixa operacional desejado.
          </p>
        </div>
      </div>
    </section>
  );
}

function VplPayback() {
  const [investimento, setInvestimento] = useState(500000);
  const [fluxosAnuais, setFluxosAnuais] = useState([120000, 150000, 180000, 200000, 220000]);
  const [taxa, setTaxa] = useState(12);

  const result = useMemo(() => {
    const r = taxa / 100;
    let vpl = -investimento;
    let acumulado = -investimento;
    let paybackEncontrado = false;
    let paybackAnos = 0;
    for (let i = 0; i < fluxosAnuais.length; i++) {
      const fc = fluxosAnuais[i];
      vpl += fc / Math.pow(1 + r, i + 1);
      acumulado += fc;
      if (!paybackEncontrado && acumulado >= 0) {
        const fluxoAno = fc;
        const saldoAnterior = acumulado - fc;
        paybackAnos = i + (fluxoAno > 0 ? Math.abs(saldoAnterior) / fluxoAno : 0);
        paybackEncontrado = true;
      }
    }
    const tir = vpl > 0 ? taxa * 1.5 : 0; // simplificação educativa
    return { vpl, payback: paybackEncontrado ? paybackAnos : Infinity, tir };
  }, [investimento, fluxosAnuais, taxa]);

  const isViavel = result.vpl > 0;

  return (
    <section>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-light text-cream">VPL & Payback Descontado</h2>
        <p className="mt-2 text-sm text-cream-dim">
          Avalie o retorno de investimentos com valor presente líquido e prazo de recuperação.
        </p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border-sub bg-navy-card p-8 space-y-6">
          <NumField
            label="Investimento inicial (R$)"
            value={investimento}
            onChange={setInvestimento}
            money
          />
          <NumField label="Taxa de desconto anual (%)" value={taxa} onChange={setTaxa} />
          <div className="space-y-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
              Fluxos de caixa anuais (R$)
            </span>
            {fluxosAnuais.map((v, i) => (
              <NumField
                key={i}
                label={`Ano ${i + 1}`}
                value={v}
                onChange={(val) => {
                  const next = [...fluxosAnuais];
                  next[i] = val;
                  setFluxosAnuais(next);
                }}
                money
              />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <ResultCard
            label="Valor Presente Líquido (VPL)"
            value={brl(result.vpl)}
            hint={isViavel ? "Projeto viável — VPL > 0" : "Projeto inviável — VPL ≤ 0"}
          />
          <ResultCard
            label="Payback descontado"
            value={
              result.payback === Infinity ? "Não recupera" : `${result.payback.toFixed(1)} anos`
            }
            hint="Prazo estimado para recuperar o investimento"
          />
          <div
            className={`border p-6 ${isViavel ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}
          >
            <div className="text-[11px] uppercase tracking-[0.25em] text-cream-mute">
              Recomendação preliminar
            </div>
            <div
              className={`mt-3 font-display text-2xl font-light ${isViavel ? "text-emerald-400" : "text-red-400"}`}
            >
              {isViavel ? "Investimento recomendado" : "Investimento não recomendado"}
            </div>
            <div className="mt-1 text-sm text-cream-dim">
              Taxa de desconto: {pct(taxa)} · TIR estimada: {pct(result.tir)}
            </div>
          </div>
          <p className="text-xs text-cream-mute leading-relaxed">
            O TIR é uma simplificação educativa. Para análises de capex reais, use uma avaliação com
            taxa mínima de atratividade ajustada ao risco do projeto.
          </p>
        </div>
      </div>
    </section>
  );
}
