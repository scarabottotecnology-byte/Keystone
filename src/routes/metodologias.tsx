import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/metodologias")({
  head: () => ({
    meta: [
      { title: "Metodologias Proprietárias — ÓRBITA™ e RICE™ | Keystone" },
      {
        name: "description",
        content:
          "Métodos ÓRBITA™ e RICE™: frameworks proprietários para planejamento financeiro, acompanhamento gerencial e gestão estratégica de custos.",
      },
      { property: "og:title", content: "Metodologias Proprietárias — Keystone" },
    ],
    links: [{ rel: "canonical", href: "/metodologias" }],
  }),
  component: MetodologiasPage,
});

const orbitaPhases = [
  {
    letter: "Ó",
    name: "Objetivos",
    desc: "Definição de metas financeiras alinhadas à estratégia corporativa.",
  },
  {
    letter: "R",
    name: "Roadmap",
    desc: "Plano de ação trimestral, com responsáveis, prazos e entregas.",
  },
  {
    letter: "B",
    name: "Budget",
    desc: "Orçamento corporativo integrado, com premissas e cenários.",
  },
  {
    letter: "I",
    name: "Indicadores",
    desc: "KPIs financeiros e operacionais com visualização em rotina.",
  },
  {
    letter: "T",
    name: "Tracking",
    desc: "Acompanhamento mensal do realizado vs. orçado, com análise de desvios.",
  },
  {
    letter: "A",
    name: "Ação",
    desc: "Planos de ação para corrigir desvios e aproveitar oportunidades.",
  },
];

const orbitaSteps = [
  { step: "01", title: "Diagnóstico do ciclo atual", desc: "Mapeamento de como orçamento, indicadores e decisão se conectam (ou não) hoje." },
  { step: "02", title: "Implantação do ciclo ÓRBITA™", desc: "Objetivos, roadmap e budget estruturados e parametrizados por área." },
  { step: "03", title: "Rotina de tracking", desc: "Acompanhamento mensal do realizado vs. orçado, com leitura de causa raiz." },
  { step: "04", title: "Ação e recalibragem", desc: "Planos de correção executados e o ciclo reinicia no trimestre seguinte." },
];

const riceSteps = [
  { step: "01", title: "Levantamento e reclassificação", desc: "Centros de custo estruturados e despesas reclassificadas por natureza real." },
  { step: "02", title: "Mapeamento de direcionadores", desc: "Identificação de onde a operação desperdiça — muitas vezes sem que ninguém veja." },
  { step: "03", title: "Custeio multidimensional", desc: "Rentabilidade real calculada por produto, canal, cliente e unidade de negócio." },
  { step: "04", title: "Decisão estratégica", desc: "Precificação e mix de produtos ajustados para maximizar margem de contribuição." },
];

const ricePillars = [
  {
    letter: "R",
    name: "Reclassificação",
    desc: "Estruturação de centros de custo e classificação racional de despesas — base sólida para toda análise subsequente.",
  },
  {
    letter: "I",
    name: "Identificação",
    desc: "Mapeamento de direcionadores de custo e análise de desperdícios. Revela onde a empresa perde dinheiro silenciosamente.",
  },
  {
    letter: "C",
    name: "Custeio",
    desc: "Custeio por atividade, produto, canal, cliente e unidade de negócio — a composição real de custos de cada dimensão.",
  },
  {
    letter: "E",
    name: "Estratégia",
    desc: "Precificação estratégica, análise de mix de produtos e decisão baseada em dados, não em achismo.",
  },
];

function MetodologiasPage() {
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
            <span className="eyebrow mx-auto">Metodologias proprietárias</span>
            <h1 className="section-title mx-auto mt-7 max-w-3xl">
              Frameworks que transformam <em>complexidade em resultado</em>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
              Cada metodologia foi desenvolvida a partir de anos de prática em controladoria de
              empresas de alto desempenho, validada em dezenas de projetos.
            </p>
          </div>
        </section>

        {/* ÓRBITA */}
        <section id="orbita" className="border-t border-border-sub bg-navy py-24 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div>
                <span className="eyebrow">Método proprietário</span>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                    <Award className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <h2 className="section-title">
                    Método <em>ÓRBITA™</em>
                  </h2>
                </div>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-cream-mute">
                  Planejamento Financeiro &amp; Acompanhamento Gerencial
                </p>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-dim">
                  O Método ÓRBITA™ conecta estratégia e execução financeira — um ciclo contínuo que
                  transforma orçamento corporativo em ferramenta de decisão. Cada linha orçamentária
                  fica conectada a um objetivo estratégico mensurável, gerando cultura de gestão
                  baseada em indicadores, não em intuição.
                </p>
                <div className="mt-8 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-cream-mute">
                  <RefreshCw className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
                  Ciclo contínuo — recomeça a cada trimestre
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px border border-border-sub bg-border-sub sm:grid-cols-3">
                {orbitaPhases.map((phase) => (
                  <div key={phase.letter} className="bg-navy-card p-6">
                    <div className="font-display text-3xl italic text-gold">{phase.letter}</div>
                    <div className="mt-2 text-sm font-semibold text-cream">{phase.name}</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">
                      {phase.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 border-t border-border-sub pt-12">
              <span className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">
                Como funciona
              </span>
              <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {orbitaSteps.map((s) => (
                  <div key={s.step}>
                    <div className="font-display text-2xl italic text-gold">{s.step}</div>
                    <div className="mt-2 text-sm font-semibold text-cream">{s.title}</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RICE */}
        <section id="rice" className="border-t border-border-sub bg-navy-mid py-24 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div>
                <span className="eyebrow">Método proprietário</span>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                    <Award className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <h2 className="section-title">
                    Método <em>RICE™</em>
                  </h2>
                </div>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-cream-mute">
                  Gestão Estratégica de Custos
                </p>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-dim">
                  O Método RICE™ entrega inteligência analítica e precisão à gestão de custos:
                  identifica desperdícios, mapeia direcionadores e revela a rentabilidade real do
                  negócio — por produto, canal, cliente e unidade.
                </p>
              </div>

              <div className="space-y-px border border-border-sub bg-border-sub">
                {ricePillars.map((pillar) => (
                  <div key={pillar.letter} className="flex items-start gap-6 bg-navy-card p-6">
                    <span className="font-display text-3xl italic text-gold">{pillar.letter}</span>
                    <div>
                      <div className="text-sm font-semibold text-cream">{pillar.name}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-cream-mute">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 border-t border-border-sub pt-12">
              <span className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">
                Como funciona
              </span>
              <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {riceSteps.map((s) => (
                  <div key={s.step}>
                    <div className="font-display text-2xl italic text-gold">{s.step}</div>
                    <div className="mt-2 text-sm font-semibold text-cream">{s.title}</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border-sub py-24 text-center">
          <div className="mx-auto max-w-2xl px-8">
            <h2 className="section-title">
              Conheça as metodologias <em>na prática</em>.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-cream-dim">
              Solicite um diagnóstico e descubra como podemos transformar a gestão financeira da sua
              empresa.
            </p>
            <Link to="/diagnostico" className="btn-gold mt-9 inline-flex">
              Solicitar Diagnóstico
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
