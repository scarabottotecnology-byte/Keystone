import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "Cases de Sucesso — Keystone" },
      {
        name: "description",
        content:
          "Resultados comprovados em controladoria, FP&A, gestão de custos e finanças corporativas — impacto mensurável em EBITDA, caixa e valuation.",
      },
      { property: "og:title", content: "Cases de Sucesso — Keystone" },
      {
        property: "og:description",
        content: "Cada projeto gera impacto mensurável em EBITDA, caixa e valuation.",
      },
    ],
    links: [{ rel: "canonical", href: "/cases" }],
  }),
  component: CasesPage,
});

const cases = [
  {
    slug: "grupo-industrial",
    company: "Bragantina Metalúrgica S.A.",
    sector: "Manufatura",
    revenue: "R$ 800M em receita",
    challenge:
      "Processos de controladoria descentralizados, custeio simplificado que mascarava prejuízo em 3 linhas de produto e fechamento contábil em 22 dias.",
    solution:
      "Implantação completa da controladoria com Método RICE™ para custeio por produto e Método ÓRBITA™ para planejamento financeiro.",
    results: [
      { label: "Margem EBITDA", before: "12,3%", after: "16,5%", change: "+4,2 p.p." },
      { label: "Fluxo de caixa livre", before: "R$ 45M", after: "R$ 72M", change: "+60%" },
      { label: "Fechamento contábil", before: "22 dias", after: "7 dias", change: "−68%" },
      { label: "Achados de auditoria", before: "23", after: "3", change: "−87%" },
    ],
  },
  {
    slug: "rede-varejo",
    company: "Vallentti Moda & Casa",
    sector: "Varejo",
    revenue: "R$ 1,2B em receita",
    challenge:
      "Expansão agressiva sem controle de rentabilidade por loja. Orçamento desconectado da estratégia de crescimento.",
    solution:
      "FP&A com Método ÓRBITA™ integrado a dashboard de BI, com acompanhamento de rentabilidade por unidade em tempo real.",
    results: [
      { label: "Lojas lucrativas", before: "62%", after: "89%", change: "+43%" },
      { label: "Margem EBITDA", before: "8,1%", after: "11,7%", change: "+3,6 p.p." },
      { label: "ROI por loja", before: "1,2x", after: "2,8x", change: "+133%" },
      { label: "Acurácia do forecast", before: "72%", after: "94%", change: "+31%" },
    ],
  },
  {
    slug: "tech-solutions",
    company: "Novagrid Tecnologia",
    sector: "Tecnologia",
    revenue: "R$ 145M em receita",
    challenge:
      "Preparação para rodada Series B. Valuation abaixo das expectativas por falta de governança e dados financeiros confiáveis.",
    solution:
      "Reestruturação completa da controladoria, implantação de governança financeira e preparação de data room para due diligence.",
    results: [
      { label: "Valuation", before: "R$ 240M", after: "R$ 768M", change: "3,2x" },
      { label: "Receita", before: "R$ 80M", after: "R$ 145M", change: "+81%" },
      { label: "LTV/CAC", before: "2,1x", after: "4,8x", change: "+129%" },
      { label: "Prazo de due diligence", before: "—", after: "3 semanas", change: "Novo" },
    ],
  },
];

function CasesPage() {
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
            <span className="eyebrow mx-auto">Cases de sucesso</span>
            <h1 className="section-title mx-auto mt-7 max-w-3xl">
              Resultados que <em>transformam</em> a gestão financeira.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
              Cada projeto gera impacto mensurável. Estes são recortes reais de como metodologia
              proprietária e execução disciplinada mudam o resultado de uma empresa.
            </p>
          </div>
        </section>

        <section className="border-t border-border-sub py-20">
          <div className="mx-auto max-w-[1400px] space-y-px bg-border-sub px-8">
            {cases.map((c) => (
              <article
                key={c.slug}
                className="grid gap-10 bg-navy p-10 lg:grid-cols-2 lg:gap-16 lg:p-14"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="border border-border-sub px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-cream-mute">
                      {c.sector}
                    </span>
                    <span className="border border-border-sub px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-cream-mute">
                      {c.revenue}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-medium text-cream">{c.company}</h2>

                  <div className="mt-7">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-gold">Desafio</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-cream-dim">
                      {c.challenge}
                    </p>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-gold">Solução</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-cream-dim">
                      {c.solution}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-5 text-[10px] uppercase tracking-[0.2em] text-cream-mute">
                    Resultados
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {c.results.map((r) => (
                      <div key={r.label} className="border border-border-sub bg-navy-card p-5">
                        <div className="text-[10px] uppercase tracking-[0.15em] text-cream-mute">
                          {r.label}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-cream-mute/60 line-through">
                            {r.before}
                          </span>
                          <ArrowUpRight className="h-3 w-3 text-gold" />
                          <span className="font-display text-lg font-medium text-cream">
                            {r.after}
                          </span>
                        </div>
                        <span className="mt-1 block text-xs font-medium text-gold">{r.change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border-sub bg-navy-mid py-24 text-center">
          <div className="mx-auto max-w-2xl px-8">
            <h2 className="section-title">
              Quer resultados <em>semelhantes?</em>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-cream-dim">
              Comece com um diagnóstico financeiro estruturado, sem custo.
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
