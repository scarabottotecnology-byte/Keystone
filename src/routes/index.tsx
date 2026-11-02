import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Credenciais } from "@/components/site/credenciais";
import { Ganhos } from "@/components/site/ganhos";
import { Frentes } from "@/components/site/frentes";
import { Fundador } from "@/components/site/fundador";
import { ContactForm } from "@/components/site/contact-form";
import { ParaQuem } from "@/components/site/para-quem";
import { Metodologia } from "@/components/site/metodologia";
import { Faq } from "@/components/site/faq";
import { SiteFooter } from "@/components/site/site-footer";
import { seo } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () =>
    seo("/", {
      title: "Keystone | Contabilidade, BPO Financeiro e Controladoria",
      description:
        "Contabilidade, fiscal, folha e BPO financeiro com controladoria de verdade: DRE gerencial, custos e orçamento para PMEs do Simples e do Lucro Presumido.",
      ogTitle: "Keystone | Contabilidade e Controladoria",
      ogDescription:
        "Contabilidade em dia e números para decidir. Peça sua proposta em até 1 dia útil.",
    }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <Hero />
        <Credenciais />
        <Ganhos />
        <Frentes />
        <ParaQuem />
        <Fundador />
        <Metodologia />
        <ContactForm />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
