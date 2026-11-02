import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

/**
 * As três frentes da Keystone, em ordem de maturidade: cada nível se apoia
 * no anterior (não há DRE gerencial confiável sem contabilidade em dia),
 * por isso a numeração aqui carrega informação real.
 */
type Frente = {
  nivel: string;
  nome: string;
  promessa: string;
  paraQuem: string;
  inclui: string[];
  cta: { label: string; to: "/servicos" | "/contato" | "/servicos/$slug"; slug?: string };
};

const frentes: Frente[] = [
  {
    nivel: "Nível 1 · Em dia",
    nome: "Contabilidade e BPO financeiro",
    promessa: "Tudo o que a lei exige, no prazo, sem você correr atrás.",
    paraQuem: "Empresas do Simples Nacional e do Lucro Presumido que querem tirar a rotina das costas.",
    inclui: [
      "Contabilidade mensal e obrigações acessórias",
      "Fiscal: apuração, retenções e guias",
      "Folha, departamento pessoal e eSocial",
      "Contas a pagar, a receber e conciliação",
      "Abertura, alteração e encerramento",
      "Imposto de renda dos sócios",
    ],
    cta: { label: "Ver os serviços", to: "/servicos" },
  },
  {
    nivel: "Nível 2 · Gestão",
    nome: "Controladoria como serviço",
    promessa: "Um controller na sua empresa, sem o custo de contratar um.",
    paraQuem: "Empresas que já faturam bem, mas não sabem com segurança onde ganham e onde perdem dinheiro.",
    inclui: [
      "DRE gerencial mensal por unidade, cliente ou produto",
      "Orçamento anual e acompanhamento orçado x realizado",
      "Indicadores de margem, caixa e capital de giro",
      "Reunião mensal de resultado com os sócios",
      "Consolidação de grupos com várias empresas",
    ],
    cta: { label: "Conhecer a controladoria", to: "/servicos/$slug", slug: "gestao-e-indicadores" },
  },
  {
    nivel: "Nível 3 · Decisão",
    nome: "Consultoria pontual",
    promessa: "Um projeto com começo, meio e fim para uma decisão que não pode errar.",
    paraQuem: "Sócios diante de uma escolha grande: preço, expansão, investimento, venda ou reestruturação.",
    inclui: [
      "Precificação e margem de contribuição",
      "Viabilidade de novo negócio ou unidade",
      "Planejamento tributário e troca de regime",
      "Valuation e preparação para investidor ou crédito",
    ],
    cta: { label: "Falar sobre um projeto", to: "/contato" },
  },
];

export function Frentes() {
  return (
    <section id="servicos" className="border-t border-border-sub bg-navy-mid py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-8">
        <Reveal className="max-w-3xl">
          <h2 className="section-title">
            Da contabilidade em dia à <em>decisão certa</em>
          </h2>
          <p className="mt-5 text-[15px] font-light leading-relaxed text-cream-dim">
            Três frentes, uma equipe. Comece pela rotina e suba de nível quando a empresa pedir,
            sem trocar de escritório nem explicar tudo de novo.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-px bg-border lg:grid-cols-3">
          {frentes.map((f, i) => (
            <RevealItem key={f.nome} className="flex flex-col bg-navy-card">
              {/* Barra de nível: preenche mais a cada frente */}
              <div className="flex h-1 gap-px" aria-hidden>
                {[0, 1, 2].map((n) => (
                  <span key={n} className={`flex-1 ${n <= i ? "bg-gold" : "bg-border-sub"}`} />
                ))}
              </div>

              <div className="flex flex-1 flex-col p-8 md:p-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                  {f.nivel}
                </p>
                <h3 className="mt-4 font-display text-[30px] font-medium leading-tight text-cream">
                  {f.nome}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-cream">{f.promessa}</p>
                <p className="mt-3 text-[13px] font-light leading-relaxed text-cream-dim">
                  {f.paraQuem}
                </p>

                <ul className="mt-8 flex-1 space-y-3 border-t border-border-sub pt-6">
                  {f.inclui.map((item) => (
                    <li key={item} className="flex gap-3 text-[13px] leading-relaxed text-cream-dim">
                      <span aria-hidden className="mt-[10px] w-3 shrink-0 border-t border-gold" />
                      {item}
                    </li>
                  ))}
                </ul>

                {f.cta.to === "/servicos/$slug" ? (
                  <Link to="/servicos/$slug" params={{ slug: f.cta.slug! }} className="btn-ghost mt-10 self-start">
                    {f.cta.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link to={f.cta.to} className="btn-ghost mt-10 self-start">
                    {f.cta.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
