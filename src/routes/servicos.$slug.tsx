import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { getService } from "@/content/services";
import {
  ServiceHero,
  ServiceSection,
  ServiceProblemList,
  ServiceStepGrid,
  ServiceMethodGrid,
  ServiceResultsGrid,
  ServiceFeatureGrid,
  ServiceChecklist,
  ServiceFaqList,
  ServiceCTA,
} from "@/components/site/service-page";
import { SITE_URL, absoluteUrl, seo } from "@/lib/site";
import type { ServiceContent } from "@/content/services";

// Dados estruturados do serviço (schema.org): o Google e as buscas com IA leem
// o que é o serviço, quem presta e as perguntas frequentes, com a navegação
// Início > Serviços > serviço.
function serviceSchema(s: ServiceContent) {
  const url = absoluteUrl(`/servicos/${s.slug}`);
  const faq = s.sections.flatMap((sec) => (sec.kind === "faq" ? sec.items : []));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#servico`,
        name: s.name,
        serviceType: s.name,
        description: s.seoDescription,
        url,
        provider: { "@id": `${SITE_URL}/#organizacao` },
        areaServed: { "@type": "Country", name: "Brasil" },
        inLanguage: "pt-BR",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Serviços", item: absoluteUrl("/servicos") },
          { "@type": "ListItem", position: 3, name: s.name, item: url },
        ],
      },
      ...(faq.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };
}

export const Route = createFileRoute("/servicos/$slug")({
  loader: ({ params }) => {
    const service = getService(params.slug);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          ...seo(`/servicos/${loaderData.slug}`, {
            title: loaderData.seoTitle,
            description: loaderData.seoDescription,
          }),
          scripts: [
            { type: "application/ld+json", children: JSON.stringify(serviceSchema(loaderData)) },
          ],
        }
      : {},
  notFoundComponent: ServiceNotFound,
  component: ServiceDetail,
});

function ServiceNotFound() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-32 text-center">
        <span className="eyebrow mx-auto">Serviço não encontrado</span>
        <h1 className="section-title mt-6">Essa página não existe.</h1>
        <Link to="/servicos" className="btn-gold mt-9">
          Ver todos os serviços
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function ServiceDetail() {
  const service = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <ServiceHero
          kicker={service.kicker}
          title={service.titlePrefix}
          titleAccent={service.titleAccent}
          description={service.heroDescription}
        />

        {service.sections.map((section, i) => {
          const tone = i % 2 === 1 ? "navy-mid" : "navy";
          if (section.kind === "problems") {
            return (
              <ServiceSection
                key={section.title}
                eyebrow={section.eyebrow}
                title={section.title}
                titleEm={section.titleEm}
                intro={section.intro}
                tone={tone}
              >
                <ServiceProblemList items={section.items} />
              </ServiceSection>
            );
          }
          if (section.kind === "steps") {
            return (
              <ServiceSection
                key={section.title}
                eyebrow={section.eyebrow}
                title={section.title}
                titleEm={section.titleEm}
                intro={section.intro}
                tone={tone}
                align="center"
              >
                <ServiceStepGrid steps={section.steps} />
              </ServiceSection>
            );
          }
          if (section.kind === "method") {
            return (
              <ServiceSection
                key={section.title}
                eyebrow={section.eyebrow}
                title={section.title}
                titleEm={section.titleEm}
                intro={section.intro}
                tone={tone}
                align="center"
              >
                <ServiceMethodGrid letters={section.letters} />
              </ServiceSection>
            );
          }
          if (section.kind === "results") {
            return (
              <ServiceSection
                key={section.title}
                eyebrow={section.eyebrow}
                title={section.title}
                titleEm={section.titleEm}
                intro={section.intro}
                tone={tone}
                align="center"
              >
                <ServiceResultsGrid results={section.results} />
              </ServiceSection>
            );
          }
          if (section.kind === "features") {
            return (
              <ServiceSection
                key={section.title}
                eyebrow={section.eyebrow}
                title={section.title}
                titleEm={section.titleEm}
                intro={section.intro}
                tone={tone}
              >
                <ServiceFeatureGrid items={section.items} />
              </ServiceSection>
            );
          }
          if (section.kind === "checklist") {
            return (
              <ServiceSection
                key={section.title}
                eyebrow={section.eyebrow}
                title={section.title}
                titleEm={section.titleEm}
                intro={section.intro}
                tone={tone}
              >
                <ServiceChecklist items={section.items} columns={section.columns} />
              </ServiceSection>
            );
          }
          if (section.kind === "faq") {
            return (
              <ServiceSection
                key={section.title}
                eyebrow={section.eyebrow}
                title={section.title}
                titleEm={section.titleEm}
                tone={tone}
                align="center"
              >
                <ServiceFaqList items={section.items} />
              </ServiceSection>
            );
          }
          return null;
        })}

        <ServiceCTA title={service.cta.title} description={service.cta.description} />
      </main>
      <SiteFooter />
    </div>
  );
}
