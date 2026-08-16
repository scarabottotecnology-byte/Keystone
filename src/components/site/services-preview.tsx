import { BarChart3, Building2, Droplet, ClipboardList, Scale, Radio, ArrowRight } from "lucide-react";

const services = [
  { n: "01", Icon: BarChart3, name: "FP&A Estratégico", desc: "Planejamento financeiro integrado com análise de desvios, forecasting e suporte à decisão executiva." },
  { n: "02", Icon: Building2, name: "Controladoria", desc: "Estruturação da função de Controladoria com processos, controles e governança financeira robusta." },
  { n: "03", Icon: Droplet, name: "Gestão de Caixa", desc: "Controle de liquidez, ciclo financeiro e capital de giro com visibilidade total do fluxo de caixa." },
  { n: "04", Icon: ClipboardList, name: "DRE Gerencial", desc: "Resultado gerencial por BU e segmento, do EBITDA ao resultado líquido, em formato board-ready." },
  { n: "05", Icon: Scale, name: "Tax & Fiscal", desc: "Análise tributária estratégica em Lucro Real, JCP, depreciação e adequação à Reforma Tributária." },
  { n: "06", Icon: Radio, name: "BI & Inteligência", desc: "Pipeline de dados com integração ERP e dashboards executivos em Power BI para decisão em tempo real." },
];

export function ServicesPreview() {
  return (
    <section id="servicos" className="py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="grid items-end gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <span className="eyebrow">Nossos serviços</span>
            <h2 className="section-title mt-6">
              Soluções de
              <br />
              <em>alto impacto</em>
            </h2>
          </div>
          <div>
            <p className="text-[15px] font-light leading-relaxed text-cream-dim">
              Cada entrega é projetada para que o C-Level tenha as informações certas,
              no formato certo, no momento certo.
            </p>
            <a href="#contato" className="btn-ghost mt-6">
              Tirar Dúvidas
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-16 grid gap-px bg-border-sub lg:grid-cols-3">
          {services.map(({ n, Icon, name, desc }) => (
            <div
              key={n}
              className="group relative overflow-hidden bg-navy-card p-10 transition-colors hover:bg-navy-light"
            >
              <span className="absolute right-7 top-8 font-display text-5xl font-light leading-none text-gold/[0.08]">
                {n}
              </span>
              <div className="mb-6 flex h-11 w-11 items-center justify-center border border-border transition-colors group-hover:border-gold group-hover:bg-gold-dim">
                <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-[22px] font-medium text-cream">{name}</h3>
              <p className="mt-3 text-[13px] font-light leading-relaxed text-cream-dim">
                {desc}
              </p>
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 w-0 bg-gold transition-all duration-500 group-hover:w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
