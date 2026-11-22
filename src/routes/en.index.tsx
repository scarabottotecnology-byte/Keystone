import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import {
  ContactSectionEn,
  CredentialsEn,
  FaqEn,
  FounderEn,
  HeroEn,
  HowItWorksEn,
  LedgerEn,
  TiersEn,
  WhoWeWorkWithEn,
  faqEn,
} from "@/components/site/en/home-sections";
import { seo } from "@/lib/site";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqEn.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const Route = createFileRoute("/en/")({
  head: () => ({
    ...seo("/en", {
      title: "Keystone | Remote Controllership, FP&A and Financial BPO",
      description:
        "Outsourced controller for growing companies worldwide: month-end close, management P&L, budgeting and cash forecasting, delivered remotely in English.",
      ogTitle: "Keystone | Remote Controllership and FP&A",
      ogDescription:
        "A remote controller who closes the month on time and shows what your company really earns.",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqSchema) }],
  }),
  component: HomeEn,
});

function HomeEn() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main>
        <HeroEn />
        <CredentialsEn />
        <LedgerEn />
        <TiersEn />
        <WhoWeWorkWithEn />
        <FounderEn />
        <HowItWorksEn />
        <ContactSectionEn />
        <FaqEn />
      </main>
      <SiteFooter locale="en" />
    </div>
  );
}
