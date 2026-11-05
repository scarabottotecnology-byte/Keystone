import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LeadForm } from "@/components/site/lead-form";
import {
  ServiceHero,
  ServiceSection,
  ServiceProblemList,
  ServiceStepGrid,
  ServiceFaqList,
} from "@/components/site/service-page";
import { SITE_URL, absoluteUrl, seo } from "@/lib/site";

const faq = [
  {
    q: "Preciso abrir um novo CNPJ para trocar de contabilidade?",
    a: "Não. O CNPJ é da empresa, independente de quem faz a contabilidade. A troca não altera seu registro na Receita Federal nem gera reinício de histórico.",
  },
  {
    q: "O que acontece com pendências ou dívidas tributárias do período anterior?",
    a: "Elas são da empresa, não do contador — continuam existindo (ou não) independente da troca. Fazemos o levantamento do histórico fiscal logo no início para você saber exatamente a situação antes de seguir em frente.",
  },
  {
    q: "Preciso avisar o contador atual?",
    a: "Recomendamos formalizar o encerramento por escrito. Ajudamos a organizar essa comunicação e o repasse de documentos — balancetes, folha de pagamento, guias e obrigações em aberto.",
  },
  {
    q: "Quanto tempo leva a transição?",
    a: "Depende do tamanho e da complexidade da operação. Isso é avaliado já no diagnóstico inicial, sem custo e sem compromisso.",
  },
  {
    q: "Vou perder histórico contábil na troca?",
    a: "Não. O histórico contábil e fiscal é repassado como parte da transição, para a Keystone assumir com os números certos — não do zero.",
  },
];

function schema() {
  const url = absoluteUrl("/trocar-de-contabilidade");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#servico`,
        name: "Transição assistida de contabilidade",
        serviceType: "Troca de contador",
        description:
          "Transição assistida para empresas que querem trocar de contador sem risco de obrigação perdida ou histórico fiscal fora de controle.",
        url,
        provider: { "@id": `${SITE_URL}/#organizacao` },
        areaServed: { "@type": "Country", name: "Brasil" },
        inLanguage: "pt-BR",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Trocar de Contabilidade", item: url },
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

export const Route = createFileRoute("/trocar-de-contabilidade")({
  head: () => ({
    ...seo("/trocar-de-contabilidade", {
      title: "Trocar de Contabilidade Sem Perder Prazo | Keystone",
      description:
        "Troca de contador assistida: comunicação com a contabilidade atual, repasse de histórico fiscal e transição sem obrigação perdida. Diagnóstico inicial sem custo.",
      ogTitle: "Trocar de Contabilidade — Keystone",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(schema()) }],
  }),
  component: TrocarDeContabilidadePage,
});

function TrocarDeContabilidadePage() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <ServiceHero
          kicker="Troca de contabilidade"
          title="Seu contador atual"
          titleAccent="só entrega guia, ou também explica o número?"
          description="Se a resposta incomoda, pode ser hora de trocar. Fazemos a transição com você: comunicação com o contador atual, repasse de histórico fiscal e início da operação sem obrigação perdida no meio do caminho."
        />

        <ServiceSection
          eyebrow="Sinais de alerta"
          title="Como saber se é hora de"
          titleEm="trocar"
          intro="Nenhum desses sinais, isolado, é motivo suficiente. Juntos, costumam indicar que a contabilidade parou de acompanhar o tamanho que a empresa virou."
        >
          <ServiceProblemList
            items={[
              "O fechamento mensal atrasa e ninguém explica por quê.",
              "Você só ouve do seu contador quando há multa ou prazo perdido.",
              "As guias chegam prontas, mas ninguém explica o que elas significam pro caixa da empresa.",
              "A empresa cresceu, mas a contabilidade continua tratando como se fosse pequena.",
              "Você não sabe a margem real por produto, cliente ou canal.",
              "Decisões de preço, contratação e investimento são no feeling, não em número.",
            ]}
          />
        </ServiceSection>

        <ServiceSection
          eyebrow="O processo"
          title="Como funciona a"
          titleEm="transição"
          tone="navy-mid"
          intro="A troca não precisa ser um risco. O processo é conduzido com você, um passo por vez."
        >
          <ServiceStepGrid
            steps={[
              {
                title: "Diagnóstico inicial",
                desc: "Avaliamos o histórico fiscal e contábil da empresa, sem custo e sem compromisso.",
              },
              {
                title: "Comunicação formal",
                desc: "Ajudamos a organizar o encerramento com o contador atual e o repasse de documentos.",
              },
              {
                title: "Procuração eletrônica",
                desc: "Você assina a procuração que autoriza a Keystone a atuar nos órgãos competentes.",
              },
              {
                title: "Início da operação",
                desc: "Assumimos o fechamento, as obrigações e a controladoria a partir da data combinada.",
              },
            ]}
          />
        </ServiceSection>

        <ServiceSection eyebrow="Perguntas frequentes" title="Antes de" titleEm="trocar" align="center">
          <ServiceFaqList items={faq} />
        </ServiceSection>

        <section className="border-t border-border-sub bg-navy-mid py-24">
          <div className="mx-auto max-w-2xl px-8">
            <div className="text-center">
              <h2 className="section-title">
                Pronto para <em>trocar</em>?
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cream-dim">
                Conte como está sua contabilidade hoje. Avaliamos o histórico e dizemos, sem
                rodeio, se faz sentido trocar.
              </p>
            </div>
            <div className="mt-10">
              <LeadForm
                origem="Trocar de Contabilidade"
                submitLabel="Quero trocar de contabilidade"
                successTitle="Recebido."
                successDescription="Nossa equipe retornará em até 24 horas úteis para entender sua situação atual."
                fields={[
                  { name: "nome", label: "Nome completo", type: "text", required: true },
                  { name: "email", label: "E-mail", type: "email", required: true },
                  { name: "empresa", label: "Empresa", type: "text", required: true },
                  { name: "telefone", label: "Telefone / WhatsApp", type: "tel" },
                  {
                    name: "mensagem",
                    label: "Mensagem",
                    type: "text",
                    placeholder: "Ex.: Hoje estou no Simples Nacional, contabilidade atrasa o fechamento há meses.",
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
