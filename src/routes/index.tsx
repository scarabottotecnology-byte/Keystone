import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
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
      { title: "Keystone | Escritório de Contabilidade para Simples Nacional e Lucro Presumido" },
      {
        name: "description",
        content:
          "Contabilidade, abertura e encerramento de empresas, BPO financeiro, fiscal e departamento pessoal para empresas do Simples Nacional e Lucro Presumido, agências e escritórios de engenharia e advocacia.",
      },
      { property: "og:title", content: "Keystone | Escritório de Contabilidade" },
      {
        property: "og:description",
        content:
          "Contabilidade em dia, impostos sob controle e atendimento digital. Peça sua proposta em até 1 dia útil.",
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
        <ParaQuem />
        <ServicesPreview />
        <Metodologia />
        <Diferenciais />
        <ContactForm />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
