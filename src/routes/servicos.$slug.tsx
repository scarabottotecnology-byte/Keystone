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

export const Route = createFileRoute("/servicos/$slug")({
  loader: ({ params }) => {
    const service = getService(params.slug);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Keystone` },
          { name: "description", content: loaderData.heroDescription },
          { property: "og:title", content: `${loaderData.name} — Keystone` },
          { property: "og:description", content: loaderData.heroDescription },
        ]
      : [],
    links: [{ rel: "canonical", href: `/servicos/${loaderData?.slug ?? ""}` }],
  }),
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
