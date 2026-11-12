import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LeadForm } from "@/components/site/lead-form";
import {
  ServiceHero,
  ServiceSection,
  ServiceProblemList,
  ServiceFeatureGrid,
  ServiceStepGrid,
  ServiceFaqList,
} from "@/components/site/service-page";
import { SITE_URL, absoluteUrl, seo } from "@/lib/site";

// Página local: um escritório novo não disputa "contabilidade" no Brasil
// inteiro, mas consegue a primeira página em buscas com cidade
// ("contabilidade em Santo André", "escritório de contabilidade ABC").
// Mantenha o texto específico da região; páginas de cidade copiadas umas das
// outras são tratadas pelo Google como "doorway pages" e perdem posição.
const PATH = "/contabilidade-santo-andre";

const CIDADES_ABC = [
  "Santo André",
  "São Bernardo do Campo",
  "São Caetano do Sul",
  "Diadema",
  "Mauá",
  "Ribeirão Pires",
  "Rio Grande da Serra",
];

const faq = [
  {
    q: "A Keystone atende empresas de Santo André e do ABC?",
    a: "Sim. A Keystone foi fundada em Santo André e atende empresas de todo o ABC Paulista: Santo André, São Bernardo do Campo, São Caetano do Sul, Diadema, Mauá, Ribeirão Pires e Rio Grande da Serra. O atendimento é digital, então empresas de outras cidades também podem ser atendidas.",
  },
  {
    q: "Quais empresas a Keystone atende?",
    a: "Empresas do Simples Nacional e do Lucro Presumido, com foco em prestadores de serviço: agências de marketing, agências de emprego, escritórios de engenharia e de advocacia, entre outros.",
  },
  {
    q: "Como funciona a nota fiscal de serviço e o ISS em Santo André?",
    a: "O ISS é um imposto municipal: a nota fiscal de serviço é emitida no sistema da prefeitura onde a empresa está estabelecida, e as regras de alíquota e retenção variam por cidade. Cuidamos da apuração e das retenções conforme a cidade de cada cliente do ABC.",
  },
  {
    q: "Consigo abrir uma empresa em Santo André com a Keystone?",
    a: "Sim. Fazemos a abertura completa: escolha do regime tributário, contrato social, CNPJ, inscrição municipal e alvará junto à prefeitura, e o enquadramento correto do CNAE desde o início.",
  },
  {
    q: "Já tenho contador. Dá para trocar sem complicação?",
    a: "Dá. Conduzimos a transição com você: comunicação com o contador atual, repasse de documentos e histórico fiscal, e início da operação sem obrigação perdida no meio do caminho.",
  },
];

function schema() {
  const url = absoluteUrl(PATH);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#servico`,
        name: "Contabilidade em Santo André e ABC Paulista",
        serviceType: "Escritório de contabilidade",
        description:
          "Contabilidade, abertura de empresas, fiscal, departamento pessoal e BPO financeiro para empresas de Santo André e do ABC Paulista.",
        url,
        provider: { "@id": `${SITE_URL}/#organizacao` },
        areaServed: CIDADES_ABC.map((name) => ({ "@type": "City", name })),
        inLanguage: "pt-BR",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Contabilidade em Santo André", item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

export const Route = createFileRoute("/contabilidade-santo-andre")({
  head: () => ({
    ...seo(PATH, {
      title: "Contabilidade em Santo André e ABC | Keystone",
      description:
        "Escritório de contabilidade em Santo André para empresas do ABC: contabilidade, abertura de empresa, fiscal, folha e BPO financeiro. Simples e Presumido.",
      ogTitle: "Contabilidade em Santo André e ABC Paulista — Keystone",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(schema()) }],
  }),
  component: ContabilidadeSantoAndrePage,
});

function ContabilidadeSantoAndrePage() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <ServiceHero
          kicker="Contabilidade em Santo André e ABC"
          title="Escritório de contabilidade em Santo André"
          titleAccent="para empresas do ABC que querem número, não só guia."
          description="A Keystone nasceu em Santo André. Cuidamos da contabilidade, dos impostos, da folha e do financeiro de empresas do Simples Nacional e do Lucro Presumido em todo o ABC Paulista, com atendimento digital e explicação clara de cada número."
        />

        <ServiceSection
          eyebrow="Para quem"
          title="Empresas do ABC que"
          titleEm="cresceram"
          intro="Prestadores de serviço do ABC que passaram do ponto em que a contabilidade só emite guia e precisam entender margem, caixa e imposto."
        >
          <ServiceProblemList
            items={[
              "Agências de marketing e de emprego de Santo André e São Bernardo.",
              "Escritórios de engenharia e de advocacia do ABC.",
              "Empresas do Simples Nacional perto do limite, avaliando o Lucro Presumido.",
              "Quem vai abrir empresa no ABC e quer começar no regime tributário certo.",
              "Quem já tem contador, mas não recebe explicação sobre o próprio caixa.",
            ]}
          />
        </ServiceSection>

        <ServiceSection
          eyebrow="Serviços"
          title="O que fazemos para empresas de"
          titleEm="Santo André"
          tone="navy-mid"
        >
          <ServiceFeatureGrid
            items={[
              {
                title: "Contabilidade mensal",
                desc: "Fechamento, balancete e demonstrações no prazo, com leitura gerencial do resultado.",
              },
              {
                title: "Abertura de empresa",
                desc: "CNPJ, inscrição municipal e alvará na prefeitura, com o regime tributário definido desde o início.",
              },
              {
                title: "Fiscal e tributário",
                desc: "Apuração de Simples, Presumido, ISS municipal e retenções, com revisão do enquadramento.",
              },
              {
                title: "Departamento pessoal",
                desc: "Folha, admissões, rescisões, férias e eSocial.",
              },
              {
                title: "BPO financeiro",
                desc: "Contas a pagar e a receber, conciliação bancária e fluxo de caixa.",
              },
              {
                title: "Controladoria e indicadores",
                desc: "DRE gerencial, margem por cliente e projeção de caixa para decidir com número.",
              },
            ]}
          />
          <p className="mt-10 text-center text-[15px] text-cream-dim">
            Veja todos os <Link to="/servicos" className="text-gold underline">serviços</Link>{" "}
            ou como funciona a{" "}
            <Link to="/trocar-de-contabilidade" className="text-gold underline">
              troca de contabilidade
            </Link>
            .
          </p>
        </ServiceSection>

        <ServiceSection
          eyebrow="Região atendida"
          title="Atendemos todo o"
          titleEm="ABC Paulista"
          intro={`${CIDADES_ABC.join(", ")}. O atendimento é digital, com documentos e reuniões online, então a distância não atrasa nada.`}
        >
          <ServiceStepGrid
            steps={[
              {
                title: "Diagnóstico sem custo",
                desc: "Entendemos a situação contábil e fiscal da empresa antes de qualquer proposta.",
              },
              {
                title: "Proposta clara",
                desc: "Escopo e valor por escrito, sem cobrança surpresa.",
              },
              {
                title: "Início da operação",
                desc: "Assumimos as obrigações a partir da data combinada, sem prazo perdido.",
              },
            ]}
          />
        </ServiceSection>

        <ServiceSection
          eyebrow="Perguntas frequentes"
          title="Contabilidade em"
          titleEm="Santo André"
          align="center"
          tone="navy-mid"
        >
          <ServiceFaqList items={faq} />
        </ServiceSection>

        <section className="border-t border-border-sub bg-navy py-24">
          <div className="mx-auto max-w-2xl px-8">
            <div className="text-center">
              <h2 className="section-title">
                Fale com um contador do <em>ABC</em>
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cream-dim">
                Conte sobre sua empresa. Retornamos em até 24 horas úteis.
              </p>
            </div>
            <div className="mt-10">
              <LeadForm
                origem="Contabilidade Santo André"
                submitLabel="Quero falar com a Keystone"
                successTitle="Recebido."
                successDescription="Nossa equipe retornará em até 24 horas úteis."
                fields={[
                  { name: "nome", label: "Nome completo", type: "text", required: true },
                  { name: "email", label: "E-mail", type: "email", required: true },
                  { name: "empresa", label: "Empresa", type: "text", required: true },
                  { name: "telefone", label: "Telefone / WhatsApp", type: "tel" },
                  {
                    name: "mensagem",
                    label: "Mensagem",
                    type: "text",
                    placeholder: "Ex.: Agência em Santo André, Simples Nacional, quero trocar de contador.",
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
