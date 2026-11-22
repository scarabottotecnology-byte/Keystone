import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LeadForm } from "@/components/site/lead-form";
import {
  ServiceFaqList,
  ServiceHero,
  ServiceProblemList,
  ServiceSection,
  ServiceStepGrid,
} from "@/components/site/service-page";
import { SITE_URL, absoluteUrl, seo } from "@/lib/site";

// Par em inglês de /trocar-de-contabilidade. Para o público de fora, a troca
// é de quem cuida da controladoria e do financeiro (outro fornecedor ou
// planilhas internas), não do contador que faz os livros e os impostos.

const faq = [
  {
    q: "Do I have to change my accountant?",
    a: "No. Your local accountant can keep the statutory books and tax filings. We take over management reporting, planning and financial operations, and coordinate with them.",
  },
  {
    q: "What happens to our historical data?",
    a: "We take it over as part of the transition: past reports, trial balances and the files you used to track results, so the first reports already compare with history instead of starting from zero.",
  },
  {
    q: "Do we need to tell our current provider?",
    a: "We recommend ending the engagement in writing. We help plan that handover and the list of files and accesses to request.",
  },
  {
    q: "How long does the transition take?",
    a: "It depends on the number of entities and on how organized the history is. We assess it during the first call, with no cost or commitment.",
  },
  {
    q: "Will anything be missed during the switch?",
    a: "We agree on a cut-over date and a handover checklist, so every recurring payment, report and deadline has an owner before the change.",
  },
];

function schema() {
  const url = absoluteUrl("/en/switching");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: "Assisted switch of controllership and finance provider",
        serviceType: "Finance provider transition",
        description:
          "An assisted transition for companies that want to move their controllership and financial operations to Keystone without losing history or deadlines.",
        url,
        provider: { "@id": `${SITE_URL}/#organizacao` },
        areaServed: "Worldwide",
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/en") },
          { "@type": "ListItem", position: 2, name: "Switching to Keystone", item: url },
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

export const Route = createFileRoute("/en/switching")({
  head: () => ({
    ...seo("/en/switching", {
      title: "Switching Your Finance Provider to Keystone | Keystone",
      description:
        "An assisted switch of controllership and financial operations: handover from your current provider, history taken over and no missed deadlines.",
      ogTitle: "Switching to Keystone",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(schema()) }],
  }),
  component: SwitchingPageEn,
});

function SwitchingPageEn() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main>
        <ServiceHero
          kicker="Switching to Keystone"
          title="Does your finance team"
          titleAccent="only send reports, or also explain the numbers?"
          description="If the answer bothers you, it may be time to switch. We run the transition with you: handover from your current provider or in-house spreadsheets, history taken over and reporting started without missing a deadline."
          cta={{ label: "Talk about switching", to: "/en/contact" }}
        />

        <ServiceSection
          eyebrow="Warning signs"
          title="How to tell it's time to"
          titleEm="switch"
          intro="None of these signs alone is reason enough. Together, they usually mean finance stopped keeping up with the size the company has become."
        >
          <ServiceProblemList
            items={[
              "The month-end close is late and nobody explains why.",
              "You only hear from finance when something has already gone wrong.",
              "Reports arrive, but nobody explains what they mean for cash.",
              "The company has grown, but finance still runs it like a small business.",
              "You don't know the real margin by product, client or channel.",
              "Pricing, hiring and investment decisions are made on gut feeling, not numbers.",
            ]}
          />
        </ServiceSection>

        <ServiceSection
          eyebrow="The process"
          title="How the"
          titleEm="transition works"
          tone="navy-mid"
          intro="Switching doesn't have to be a risk. We run the process with you, one step at a time."
        >
          <ServiceStepGrid
            steps={[
              {
                title: "First assessment",
                desc: "We review your current reports, systems and history, with no cost or commitment.",
              },
              {
                title: "Handover plan",
                desc: "We help you end the current engagement and list the files and accesses to transfer.",
              },
              {
                title: "Access and set-up",
                desc: "Read-only access to your systems and banks, plus the management chart of accounts.",
              },
              {
                title: "Go-live",
                desc: "We take over the close review, reporting and financial routine from the agreed date.",
              },
            ]}
          />
        </ServiceSection>

        <ServiceSection eyebrow="FAQ" title="Before you" titleEm="switch" align="center">
          <ServiceFaqList items={faq} />
        </ServiceSection>

        <section className="border-t border-border-sub bg-navy-mid py-24">
          <div className="mx-auto max-w-2xl px-8">
            <div className="text-center">
              <h2 className="section-title">
                Ready to <em>switch</em>?
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cream-dim">
                Tell us how your finance works today. We review it and tell you, plainly, whether
                switching makes sense.
              </p>
            </div>
            <div className="mt-10">
              <LeadForm
                locale="en"
                origem="EN site — Switching"
                submitLabel="I want to switch"
                successTitle="Received."
                successDescription="We will get back to you within 1 business day to understand your current setup."
                fields={[
                  { name: "nome", label: "Full name", type: "text", required: true },
                  { name: "email", label: "Work email", type: "email", required: true },
                  { name: "empresa", label: "Company", type: "text", required: true },
                  { name: "telefone", label: "Phone / WhatsApp", type: "tel" },
                  {
                    name: "mensagem",
                    label: "Message",
                    type: "text",
                    placeholder:
                      "E.g. Our outsourced bookkeeper sends a P&L six weeks after month-end and nobody explains it.",
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale="en" />
    </div>
  );
}
