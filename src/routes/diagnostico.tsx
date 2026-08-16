import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { createHubspotLead } from "@/lib/hubspot.functions";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico de Maturidade Financeira — Keystone" },
      {
        name: "description",
        content:
          "Avalie em 3 minutos o grau de maturidade financeira da sua empresa. Score 0-100 com classificação e recomendações.",
      },
      { property: "og:title", content: "Diagnóstico de Maturidade Financeira — Keystone" },
      { property: "og:description", content: "Avalie em 3 minutos o grau de maturidade financeira da sua empresa." },
      { property: "og:url", content: "/diagnostico" },
    ],
    links: [{ rel: "canonical", href: "/diagnostico" }],
  }),
  component: DiagnosticoPage,
});

type Option = { label: string; points: 0 | 1 | 2 | 3 };
type Question = { q: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    q: "Com que frequência sua empresa fecha o resultado gerencial (DRE)?",
    options: [
      { label: "Não fechamos formalmente", points: 0 },
      { label: "Trimestralmente ou quando necessário", points: 1 },
      { label: "Mensalmente, mas com atraso de 15+ dias", points: 2 },
      { label: "Mensalmente, até o dia 10", points: 3 },
    ],
  },
  {
    q: "Sua empresa sabe a margem de contribuição real por produto ou serviço?",
    options: [
      { label: "Não sabemos", points: 0 },
      { label: "Temos uma noção geral", points: 1 },
      { label: "Sabemos para os principais produtos", points: 2 },
      { label: "Sim, por SKU/serviço, atualizado", points: 3 },
    ],
  },
  {
    q: "Como é feita a projeção de caixa?",
    options: [
      { label: "Não projetamos", points: 0 },
      { label: "Planilha simples, curto prazo", points: 1 },
      { label: "Fluxo projetado 3 meses", points: 2 },
      { label: "Fluxo projetado 12+ meses com cenários", points: 3 },
    ],
  },
  {
    q: "A empresa tem orçamento anual (budget) formal?",
    options: [
      { label: "Não", points: 0 },
      { label: "Metas de venda apenas", points: 1 },
      { label: "Budget completo, sem acompanhamento mensal", points: 2 },
      { label: "Budget + análise mensal de variações", points: 3 },
    ],
  },
  {
    q: "Como são tomadas as decisões de investimento (capex)?",
    options: [
      { label: "Pela intuição do sócio", points: 0 },
      { label: "Análise simples de custo", points: 1 },
      { label: "Payback calculado", points: 2 },
      { label: "VPL/TIR com taxa mínima definida", points: 3 },
    ],
  },
  {
    q: "A empresa conhece seu custo de capital (WACC)?",
    options: [
      { label: "Nunca calculamos", points: 0 },
      { label: "Sabemos o custo dos empréstimos", points: 1 },
      { label: "Estimativa informal", points: 2 },
      { label: "WACC calculado e usado nas decisões", points: 3 },
    ],
  },
  {
    q: "Como está a governança entre sócios sobre finanças?",
    options: [
      { label: "Sem regras formais", points: 0 },
      { label: "Acordo verbal", points: 1 },
      { label: "Acordo de sócios básico", points: 2 },
      { label: "Acordo + fórum de decisão + relatórios periódicos", points: 3 },
    ],
  },
  {
    q: "Se um investidor pedisse os números da empresa hoje, em quanto tempo estariam prontos?",
    options: [
      { label: "Meses, não temos organizado", points: 0 },
      { label: "Semanas de trabalho", points: 1 },
      { label: "Alguns dias", points: 2 },
      { label: "Prontos ou quase — dados auditáveis", points: 3 },
    ],
  },
  {
    q: "Quem analisa os números e propõe ações estratégicas?",
    options: [
      { label: "Ninguém formalmente", points: 0 },
      { label: "O contador externo", points: 1 },
      { label: "Sócio ou gerente financeiro acumulando função", points: 2 },
      { label: "Controller/FP&A dedicado ou consultoria estratégica", points: 3 },
    ],
  },
  {
    q: "A empresa já avaliou formalmente quanto vale (valuation)?",
    options: [
      { label: "Nunca", points: 0 },
      { label: "Estimativa informal por múltiplos", points: 1 },
      { label: "Valuation feito há mais de 2 anos", points: 2 },
      { label: "Valuation atualizado com metodologia", points: 3 },
    ],
  },
];

type Level = {
  name: string;
  color: string;
  description: string;
  recs: string[];
};

function getLevel(score: number): Level {
  if (score <= 25)
    return {
      name: "Gestão Frágil",
      color: "text-red-400",
      description:
        "Decisões estão sendo tomadas sem base financeira confiável. Risco alto em qualquer movimento de capital.",
      recs: [
        "Estruturar o fechamento mensal do resultado gerencial (DRE) com prazo claro.",
        "Implementar controle básico de caixa projetado para os próximos 90 dias.",
        "Contratar apoio externo (controladoria/consultoria) para blindar decisões críticas.",
      ],
    };
  if (score <= 50)
    return {
      name: "Gestão Reativa",
      color: "text-orange-400",
      description:
        "Existem controles básicos, mas a empresa reage aos números em vez de antecipá-los. Decisões grandes ainda são apostas.",
      recs: [
        "Construir budget anual com acompanhamento mensal de variações (real vs. planejado).",
        "Mapear margem de contribuição por linha de produto/serviço.",
        "Formalizar governança financeira mínima entre sócios e criar rotina de comitê.",
      ],
    };
  if (score <= 75)
    return {
      name: "Gestão Estruturada",
      color: "text-gold",
      description:
        "Boa base de controle e rotina. O próximo salto é transformar dados em inteligência estratégica para decisões de capital.",
      recs: [
        "Calcular WACC e usar como taxa mínima nas decisões de investimento (VPL/TIR).",
        "Modelar cenários de fluxo de caixa de 12+ meses com sensibilidades.",
        "Preparar valuation atualizado para decisões de sócio, M&A ou captação.",
      ],
    };
  return {
    name: "Gestão Estratégica",
    color: "text-emerald-400",
    description:
      "Alto nível de maturidade. A empresa está pronta para movimentos sofisticados: M&A, captação estruturada, expansão com modelo validado.",
    recs: [
      "Estruturar data room permanente para acelerar processos de captação/M&A.",
      "Aprofundar simulações de cenários e stress test para decisões de capital.",
      "Buscar advisory estratégico para maximizar valor em transações e reestruturações.",
    ],
  };
}

const SEGMENTS = [
  { color: "bg-red-400" },
  { color: "bg-orange-400" },
  { color: "bg-gold" },
  { color: "bg-emerald-400" },
];

function DiagnosticoPage() {
  const [stage, setStage] = useState<"intro" | "quiz" | "result">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(QUESTIONS.length).fill(null),
  );

  const score = Math.round(
    (answers.reduce<number>((sum, a) => sum + (a ?? 0), 0) * 100) / 30,
  );
  const level = getLevel(score);

  function select(points: number) {
    const next = [...answers];
    next[step] = points;
    setAnswers(next);
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) setStep(step + 1);
      else setStage("result");
    }, 300);
  }

  function restart() {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setStep(0);
    setStage("intro");
  }

  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main className="pt-32 pb-24">
        {stage === "intro" && <Intro onStart={() => setStage("quiz")} />}
        {stage === "quiz" && (
          <Quiz
            step={step}
            question={QUESTIONS[step]}
            selected={answers[step]}
            onSelect={select}
            onBack={() => step > 0 && setStep(step - 1)}
          />
        )}
        {stage === "result" && (
          <Result score={score} level={level} onRestart={restart} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-6 text-center">
      <span className="eyebrow">Diagnóstico Executivo</span>
      <h1 className="section-title mt-6 text-4xl md:text-5xl">
        Qual o grau de <em>maturidade financeira</em> da sua empresa?
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base font-light text-cream-dim">
        10 perguntas. 3 minutos. Um score claro de onde sua gestão financeira
        está — e o que falta para decisões de capital seguras.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-[0.2em] text-cream-mute">
        <span>Score 0–100</span>
        <span className="text-gold/40">·</span>
        <span>4 níveis de maturidade</span>
        <span className="text-gold/40">·</span>
        <span>Resultado imediato</span>
      </div>
      <button onClick={onStart} className="btn-gold mt-12 text-base">
        Iniciar Diagnóstico →
      </button>
    </section>
  );
}

function Quiz({
  step,
  question,
  selected,
  onSelect,
  onBack,
}: {
  step: number;
  question: Question;
  selected: number | null;
  onSelect: (points: number) => void;
  onBack: () => void;
}) {
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  return (
    <section className="mx-auto max-w-3xl px-6">
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-cream-mute">
          <span>
            Pergunta {step + 1} de {QUESTIONS.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full bg-navy-card">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="font-display text-2xl md:text-3xl text-cream">
        {question.q}
      </h2>

      <div className="mt-8 space-y-3">
        {question.options.map((opt, i) => {
          const isSelected = selected === opt.points;
          return (
            <button
              key={i}
              onClick={() => onSelect(opt.points)}
              className={`w-full border p-5 text-left transition-all ${
                isSelected
                  ? "border-gold bg-navy-card"
                  : "border-border-sub bg-navy-card hover:border-gold/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                    isSelected ? "border-gold" : "border-cream-mute/40"
                  }`}
                >
                  {isSelected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                  )}
                </span>
                <span className="text-sm text-cream">{opt.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-between">
        <button
          onClick={onBack}
          disabled={step === 0}
          className="text-[11px] uppercase tracking-[0.2em] text-cream-mute hover:text-gold disabled:opacity-30"
        >
          ← Voltar
        </button>
      </div>
    </section>
  );
}

function Result({
  score,
  level,
  onRestart,
}: {
  score: number;
  level: Level;
  onRestart: () => void;
}) {
  const [form, setForm] = useState({ nome: "", email: "", empresa: "", telefone: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const [firstname, ...rest] = form.nome.trim().split(" ");
    const res = await createHubspotLead({
      data: {
        firstname: firstname || form.nome,
        lastname: rest.join(" "),
        email: form.email,
        company: form.empresa,
        phone: form.telefone,
        origem: `Diagnóstico Maturidade — Score ${score} (${level.name})`,
      },
    });
    setStatus(res.ok ? "done" : "error");
  }

  return (
    <section className="mx-auto max-w-3xl px-6">
      <div className="text-center">
        <span className="eyebrow">Resultado do Diagnóstico</span>
        <div className="mt-8 flex items-baseline justify-center gap-2">
          <span className={`font-display text-8xl md:text-9xl leading-none ${level.color}`}>
            {score}
          </span>
          <span className="font-display text-2xl text-cream-mute">/100</span>
        </div>
        <h2 className={`mt-6 font-display text-3xl md:text-4xl ${level.color}`}>
          {level.name}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] font-light text-cream-dim">
          {level.description}
        </p>
      </div>

      {/* Gauge */}
      <div className="mt-12">
        <div className="grid grid-cols-4 gap-1">
          {SEGMENTS.map((s, i) => (
            <div key={i} className={`h-2 ${s.color} opacity-60`} />
          ))}
        </div>
        <div className="relative h-6">
          <div
            className="absolute top-0 h-6 w-[2px] bg-cream transition-all"
            style={{ left: `calc(${Math.min(score, 100)}% - 1px)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-cream-mute">
          <span>Frágil</span>
          <span>Reativa</span>
          <span>Estruturada</span>
          <span>Estratégica</span>
        </div>
      </div>

      {/* Recomendações */}
      <div className="mt-14 border border-border-sub bg-navy-card p-8">
        <h3 className="font-display text-xl text-cream">Próximos passos recomendados</h3>
        <ul className="mt-6 space-y-4">
          {level.recs.map((r, i) => (
            <li key={i} className="flex gap-4">
              <span className="mt-2 h-px w-6 shrink-0 bg-gold" />
              <span className="text-sm text-cream-dim">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Conversão */}
      <div className="mt-10 border border-gold/30 bg-navy-card p-8 md:p-10">
        {status === "done" ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold text-2xl">
              ✓
            </div>
            <p className="font-display text-2xl text-cream">Análise a caminho</p>
            <p className="mt-3 text-sm text-cream-dim">
              Nossa equipe retornará em até 24 horas úteis com a análise detalhada do seu diagnóstico.
            </p>
            <button onClick={onRestart} className="mt-8 text-[11px] uppercase tracking-[0.2em] text-gold hover:text-gold-light">
              Refazer diagnóstico →
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="eyebrow">Análise completa</span>
              <h3 className="mt-4 font-display text-2xl text-cream">
                Receba a análise completa do seu diagnóstico
              </h3>
              <p className="mt-3 text-sm text-cream-dim">
                Interpretação personalizada por um especialista + recomendações específicas para o momento da sua empresa.
              </p>
            </div>
            <form onSubmit={submit} className="mt-8 space-y-4">
              {(
                [
                  { name: "nome", label: "Nome completo", type: "text" },
                  { name: "email", label: "E-mail corporativo", type: "email" },
                  { name: "empresa", label: "Empresa", type: "text" },
                  { name: "telefone", label: "Telefone / WhatsApp", type: "tel" },
                ] as const
              ).map(({ name, label, type }) => (
                <label key={name} className="block">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
                    {label} *
                  </span>
                  <input
                    type={type}
                    required
                    value={form[name]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
                  />
                </label>
              ))}
              {status === "error" && (
                <p className="text-xs text-red-400">Erro ao enviar. Tente novamente.</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-gold w-full justify-center disabled:opacity-60"
              >
                {status === "loading" ? "Enviando..." : "Receber análise completa →"}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="mx-auto block text-[11px] uppercase tracking-[0.2em] text-cream-mute hover:text-gold"
              >
                Refazer diagnóstico
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
