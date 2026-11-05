import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { seo } from "@/lib/site";

/** Mesmo e-mail já usado em /contato — evita depender de uma caixa nova sem uso. */
const EMAIL_RH = "contato@keystone-contabilidade.com";

export const Route = createFileRoute("/trabalhe-conosco")({
  head: () =>
    seo("/trabalhe-conosco", {
      title: "Trabalhe Conosco — Keystone",
      description:
        "Candidaturas espontâneas para profissionais de controladoria, FP&A e contabilidade na Keystone.",
    }),
  component: TrabalheConoscoPage,
});

function TrabalheConoscoPage() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <section className="px-8 pb-24 pt-36 lg:pt-44">
          <div className="mx-auto max-w-2xl">
            <span className="eyebrow">Carreiras</span>
            <h1 className="section-title mt-7">
              Trabalhe <em>conosco</em>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-cream-dim">
              Não temos vagas abertas no momento, mas recebemos candidaturas espontâneas de
              profissionais de controladoria, FP&A e contabilidade que queiram atuar com rigor
              técnico e proximidade real com o cliente.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-cream-dim">
              Envie seu currículo e uma breve apresentação para o e-mail abaixo. Avisamos quando
              surgir uma posição compatível com o seu perfil.
            </p>

            <a
              href={`mailto:${EMAIL_RH}?subject=${encodeURIComponent("Trabalhe Conosco — Candidatura")}`}
              className="btn-gold mt-9 inline-flex"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              {EMAIL_RH}
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
