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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Keystone | Contabilidade, BPO financeiro e Controladoria para PMEs" },
      {
        name: "description",
        content:
          "Contabilidade, fiscal, folha e BPO financeiro com a controladoria de grandes grupos: DRE gerencial, orçamento e consultoria para empresas do Simples Nacional e do Lucro Presumido.",
      },
      { property: "og:title", content: "Keystone | Contabilidade e Controladoria" },
      {
        property: "og:description",
        content:
          "Contabilidade em dia e números para decidir. Peça sua proposta em até 1 dia útil.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://keystone-phi.vercel.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://keystone-phi.vercel.app/" }],
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
