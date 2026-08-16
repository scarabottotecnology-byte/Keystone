import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { DecisionBar } from "@/components/site/decision-bar";
import { Stats } from "@/components/site/stats";
import { MetodologiaOrbita } from "@/components/site/metodologia-orbita";
import { MetodologiaRice } from "@/components/site/metodologia-rice";
import { Manifesto } from "@/components/site/manifesto";
import { Trilhas } from "@/components/site/trilhas";
import { ServicesPreview } from "@/components/site/services-preview";
import { ContactForm } from "@/components/site/contact-form";
import { ParaQuem } from "@/components/site/para-quem";
import { Diferenciais } from "@/components/site/diferenciais";
import { Metodologia } from "@/components/site/metodologia";
import { Faq } from "@/components/site/faq";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Keystone | Controladoria Terceirizada, FP&A e Contabilidade Gerencial",
      },
      {
        name: "description",
        content:
          "Controladoria terceirizada com contabilidade gerencial, contabilidade de custos, planejamento financeiro corporativo, FP&A e due diligence para empresas em crescimento.",
      },
      {
        property: "og:title",
        content: "Keystone — Controladoria Terceirizada e FP&A",
      },
      {
        property: "og:description",
        content:
          "Fechamento mensal no prazo, indicadores confiáveis, custos sob controle e orçamento vivo para empresas em crescimento.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://story-reader-pal.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://story-reader-pal.lovable.app/" }],

  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <Hero />
        <DecisionBar />
        <Stats />
        <MetodologiaOrbita />
        <MetodologiaRice />
        <Manifesto />
        <Trilhas />
        <ServicesPreview />
        <Metodologia />
        <ContactForm />
        <ParaQuem />
        <Diferenciais />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
