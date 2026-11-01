import { Link } from "@tanstack/react-router";
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
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

const services = [
  { slug: "contabilidade-mensal", Icon: BookOpenCheck, name: "Contabilidade mensal", desc: "Escrituração, balancete, demonstrações e obrigações acessórias, com contador responsável." },
  { slug: "abertura-de-empresas", Icon: Building2, name: "Abertura de empresas", desc: "Regime, CNAE, contrato social, CNPJ, inscrições e alvarás até você poder faturar." },
  { slug: "alteracao-e-encerramento", Icon: DoorClosed, name: "Alteração e encerramento", desc: "Entrada e saída de sócios, mudanças cadastrais e baixa sem pendências." },
  { slug: "bpo-financeiro", Icon: Wallet, name: "BPO financeiro", desc: "Contas a pagar e a receber, conciliação, fluxo de caixa e DRE gerencial feitos por nós." },
  { slug: "fiscal-e-tributario", Icon: Landmark, name: "Fiscal e planejamento tributário", desc: "Apuração do Simples e do Presumido, retenções e comparação de regimes." },
  { slug: "departamento-pessoal", Icon: Users, name: "Departamento pessoal e folha", desc: "Admissão, folha, férias, 13º, rescisão e eSocial." },
  { slug: "regularizacao-fiscal", Icon: ShieldCheck, name: "Regularização e parcelamentos", desc: "Declarações em atraso, intimações, malha fina, certidões e parcelamento de débitos." },
  { slug: "imposto-de-renda", Icon: UserRound, name: "Imposto de renda dos sócios", desc: "IRPF, carnê-leão, ganho de capital e coerência com os lucros da empresa." },
  { slug: "gestao-e-indicadores", Icon: LineChart, name: "Gestão e indicadores", desc: "Precificação, ponto de equilíbrio, orçamento e painel mensal para decidir." },
];

export function ServicesPreview() {
  return (
    <section id="servicos" className="py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <Reveal className="grid items-end gap-12 lg:grid-cols-2 lg:gap-20">
          <h2 className="section-title">
            Tudo o que sua empresa precisa de um escritório de contabilidade
          </h2>
          <div>
            <p className="text-[15px] font-light leading-relaxed text-cream-dim">
              Da abertura ao encerramento, do imposto do mês ao resultado da empresa. Contrate um
              serviço ou deixe a rotina inteira conosco.
            </p>
            <Link to="/servicos" className="btn-ghost mt-6">
              Ver todos os serviços
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-px bg-border-sub md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ slug, Icon, name, desc }) => (
            <RevealItem key={slug} className="bg-navy-card">
              <Link
                to="/servicos/$slug"
                params={{ slug }}
                className="group relative flex h-full flex-col overflow-hidden p-10 transition-colors hover:bg-navy-light"
              >
                <div className="mb-6 flex h-11 w-11 items-center justify-center border border-border transition-colors group-hover:border-gold group-hover:bg-gold-dim">
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-[22px] font-medium text-cream">{name}</h3>
                <p className="mt-3 text-[13px] font-light leading-relaxed text-cream-dim">{desc}</p>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
