import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Calculator,
  Radio,
  Scale,
  FileStack,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/servicos/")({
  head: () => ({
    meta: [
      { title: "Serviços — Controladoria, FP&A, Custos e Valuation | Keystone" },
      {
        name: "description",
        content:
          "Controladoria estratégica, FP&A, gestão de custos, BI financeiro, valuation & M&A e planejamento tributário — metodologia proprietária, equipe sênior, entrega board-ready.",
      },
      { property: "og:title", content: "Serviços — Keystone" },
      {
        property: "og:description",
        content:
          "Seis frentes de controladoria e finanças corporativas para empresas em crescimento.",
      },
    ],
    links: [{ rel: "canonical", href: "/servicos" }],
  }),
  component: ServicosIndex,
});

const services = [
  {
    slug: "controladoria-estrategica",
    Icon: Building2,
    name: "Controladoria Estratégica",
    desc: "Estruturação de processos de controladoria, compliance, governança financeira e controles internos para empresas que exigem excelência operacional.",
    tags: ["Controles internos", "Compliance", "Governança", "Fechamento contábil"],
  },
  {
    slug: "fpa-planejamento-financeiro",
    Icon: BarChart3,
    name: "FP&A e Planejamento Financeiro",
    desc: "Budget, forecast e acompanhamento gerencial com o Método ÓRBITA™ — conectando estratégia e execução financeira em ciclo trimestral.",
    tags: ["Budget corporativo", "Forecast rolling", "Realizado vs. orçado", "Planos de ação"],
  },
  {
    slug: "gestao-estrategica-custos",
    Icon: Calculator,
    name: "Gestão Estratégica de Custos",
    desc: "Mapeamento de direcionadores, centros de custo, custeio por atividade e análise de rentabilidade com o Método RICE™.",
    tags: ["Direcionadores de custo", "Custeio ABC/ABM", "Rentabilidade", "Precificação"],
  },
  {
    slug: "business-intelligence",
    Icon: Radio,
    name: "Business Intelligence",
    desc: "Dashboards financeiros e operacionais com visualização de dados em tempo real para decisão ágil e baseada em evidências.",
    tags: [
      "Dashboards em tempo real",
      "KPIs financeiros",
      "Relatórios automatizados",
      "Data warehouse",
    ],
  },
  {
    slug: "valuation-ma",
    Icon: Scale,
    name: "Valuation & M&A",
    desc: "Avaliação de empresas, due diligence financeira e estruturação de operações societárias com rigor técnico.",
    tags: ["Valuation DCF", "Due diligence", "M&A advisory", "Estruturação de capital"],
  },
  {
    slug: "planejamento-tributario",
    Icon: FileStack,
    name: "Planejamento Tributário",
    desc: "Otimização da carga tributária com legalidade, eficiência e visão estratégica. Análise de regimes e estruturas societárias.",
    tags: ["Regime tributário", "Elisão fiscal", "Transfer pricing", "Benefícios fiscais"],
  },
];

function ServicosIndex() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden px-8 pb-16 pt-36 lg:pt-44">
          <div
            aria-hidden
            className="grid-texture pointer-events-none absolute inset-0 opacity-50"
          />
          <div className="relative z-10 mx-auto max-w-[1400px] text-center">
            <span className="eyebrow mx-auto">Nossas soluções</span>
            <h1 className="section-title mx-auto mt-7 max-w-3xl">
              Serviços de <em>alto impacto</em> para decisões de capital.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
              Cada entrega combina metodologia proprietária, equipe sênior e foco absoluto em
              geração de valor econômico — no formato que um conselho leva para a mesa sem
              reformatar nada.
            </p>
          </div>
        </section>

        <section className="border-t border-border-sub pb-24">
          <div className="mx-auto max-w-[1400px] px-8 pt-16">
            <div className="grid gap-px bg-border-sub md:grid-cols-2 lg:grid-cols-3">
              {services.map(({ slug, Icon, name, desc, tags }) => (
                <Link
                  key={slug}
                  to="/servicos/$slug"
                  params={{ slug }}
                  className="group flex flex-col bg-navy-card p-10 transition-colors hover:bg-navy-light"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center border border-border transition-colors group-hover:border-gold group-hover:bg-gold-dim">
                    <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-display text-[22px] font-medium text-cream group-hover:text-gold-light">
                    {name}
                  </h2>
                  <p className="mt-3 flex-1 text-[13px] font-light leading-relaxed text-cream-dim">
                    {desc}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="border border-border-sub px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-cream-mute"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
                    Conhecer serviço
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
