import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

const segments = [
  {
    name: "Empresas do Simples Nacional",
    pain: "Você paga o DAS todo mês, mas não sabe se o anexo, o fator R e o limite de faturamento estão sendo bem aproveitados.",
    help: "Apuração correta, acompanhamento do teto e aviso antes de o regime deixar de compensar.",
  },
  {
    name: "Empresas do Lucro Presumido",
    pain: "Imposto trimestral, retenções em notas e muitas obrigações acessórias, com risco de erro em cada uma.",
    help: "Apuração de IRPJ, CSLL, PIS, COFINS e ISS, com conferência das retenções e prazos.",
  },
  {
    name: "Agências de emprego",
    pain: "Alta rotatividade, muitas admissões e rescisões, encargos e retenções sobre contratos com empresas clientes.",
    help: "Folha e eSocial em volume, conferência de encargos e controle financeiro por contrato.",
  },
  {
    name: "Agências de marketing",
    pain: "Faturamento bom, caixa irregular, receita por cliente misturada e dúvida entre Simples e Presumido.",
    help: "Planejamento tributário, BPO financeiro e DRE gerencial por cliente e por projeto.",
  },
  {
    name: "Escritórios de engenharia",
    pain: "Receitas por obra ou projeto, registro em conselho, ART, retenções em contratos e fluxo de caixa irregular.",
    help: "Contabilidade por projeto, retenções corretas e fluxo de caixa projetado por contrato.",
  },
  {
    name: "Escritórios de advocacia",
    pain: "Sociedade de advogados, distribuição entre sócios, honorários de êxito e repasses a correspondentes.",
    help: "Estrutura societária e tributária adequada, folha, pró-labore e organização dos honorários.",
  },
];

export function ParaQuem() {
  return (
    <section id="para-quem" className="py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <Reveal>
          <h2 className="section-title max-w-3xl">
            Atendemos de perto quem tem rotina fiscal e financeira própria
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] font-light leading-relaxed text-cream-dim">
            Cada setor tem seus próprios impostos, contratos e vícios de gestão. Entendemos o seu
            antes de montar a proposta.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <RevealItem
              key={s.name}
              className="border border-border-sub p-10 transition-colors hover:border-border"
            >
              <h3 className="font-display text-2xl font-medium text-cream">{s.name}</h3>
              <p className="mt-4 text-[13px] font-light leading-relaxed text-cream-dim">{s.pain}</p>
              <p className="mt-5 border-t border-border-sub pt-5 text-[13px] leading-relaxed text-cream">
                {s.help}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
