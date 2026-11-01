import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  Building2,
  DoorClosed,
  Wallet,
  Landmark,
  Users,
  ShieldCheck,
  UserRound,
  LineChart,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/servicos/")({
  head: () => ({
    meta: [
      { title: "Serviços de Contabilidade, Abertura de Empresas e BPO Financeiro | Keystone" },
      {
        name: "description",
        content:
          "Contabilidade mensal, abertura e encerramento de empresas, BPO financeiro, fiscal, departamento pessoal, regularização e imposto de renda dos sócios.",
      },
      { property: "og:title", content: "Serviços | Keystone Contabilidade" },
      {
        property: "og:description",
        content: "Nove serviços de contabilidade para empresas do Simples Nacional e Lucro Presumido.",
      },
    ],
    links: [{ rel: "canonical", href: "/servicos" }],
  }),
  component: ServicosIndex,
});

const services = [
  { slug: "contabilidade-mensal", Icon: BookOpenCheck, name: "Contabilidade mensal", desc: "Escrituração, balancete, demonstrações e obrigações acessórias.", tags: ["Balancete", "DRE", "ECD e ECF", "DEFIS"] },
  { slug: "abertura-de-empresas", Icon: Building2, name: "Abertura de empresas", desc: "Escolha do regime e do CNAE, contrato social, CNPJ, inscrições e alvarás.", tags: ["CNPJ", "Contrato social", "Alvará", "Conselhos"] },
  { slug: "alteracao-e-encerramento", Icon: DoorClosed, name: "Alteração e encerramento", desc: "Entrada e saída de sócios, mudanças cadastrais e baixa sem pendências.", tags: ["Alteração contratual", "Distrato", "Baixa"] },
  { slug: "bpo-financeiro", Icon: Wallet, name: "BPO financeiro", desc: "Contas a pagar e a receber, conciliação, fluxo de caixa e DRE gerencial.", tags: ["Contas a pagar", "Conciliação", "Fluxo de caixa"] },
  { slug: "fiscal-e-tributario", Icon: Landmark, name: "Fiscal e planejamento tributário", desc: "Apuração do Simples e do Presumido, retenções e comparação de regimes.", tags: ["DAS", "IRPJ e CSLL", "Reforma tributária"] },
  { slug: "departamento-pessoal", Icon: Users, name: "Departamento pessoal e folha", desc: "Admissão, folha, férias, 13º, rescisão e eSocial.", tags: ["Folha", "eSocial", "Rescisão"] },
  { slug: "regularizacao-fiscal", Icon: ShieldCheck, name: "Regularização e parcelamentos", desc: "Declarações em atraso, intimações, malha fina, certidões e parcelamentos.", tags: ["Intimações", "Certidões", "Parcelamento"] },
  { slug: "imposto-de-renda", Icon: UserRound, name: "Imposto de renda dos sócios", desc: "IRPF, carnê-leão e ganho de capital, alinhados aos lucros da empresa.", tags: ["IRPF", "Carnê-leão", "Ganho de capital"] },
  { slug: "gestao-e-indicadores", Icon: LineChart, name: "Gestão e indicadores", desc: "Precificação, ponto de equilíbrio, orçamento e painel mensal.", tags: ["Precificação", "Orçamento", "Indicadores"] },
];

function ServicosIndex() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden px-8 pb-16 pt-36 lg:pt-44">
          <div className="relative z-10 mx-auto max-w-[1400px] text-center">
            <h1 className="section-title mx-auto max-w-3xl">
              Serviços de contabilidade para a rotina inteira da sua empresa.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
              Contrate um serviço ou deixe a rotina fiscal, contábil, de pessoal e financeira com
              a mesma equipe.
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
                    Ver detalhes
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
