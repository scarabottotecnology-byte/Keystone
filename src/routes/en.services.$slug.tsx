import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ServiceCTA, ServiceHero, ServiceSections } from "@/components/site/service-page";
import { getServiceEn } from "@/content/services.en";
import type { ServiceContent } from "@/content/services";
import { SITE_URL, absoluteUrl, seo } from "@/lib/site";

const CTA = { label: "Request a proposal", to: "/en/contact" };

function serviceSchema(s: ServiceContent) {
  const url = absoluteUrl(`/en/services/${s.slug}`);
  const faq = s.sections.flatMap((sec) => (sec.kind === "faq" ? sec.items : []));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: s.name,
        serviceType: s.name,
        description: s.seoDescription,
        url,
        provider: { "@id": `${SITE_URL}/#organizacao` },
        areaServed: "Worldwide",
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/en") },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: absoluteUrl("/en/services"),
          },
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

export const Route = createFileRoute("/en/services/$slug")({
  loader: ({ params }) => {
    const service = getServiceEn(params.slug);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          ...seo(`/en/services/${loaderData.slug}`, {
            title: loaderData.seoTitle,
            description: loaderData.seoDescription,
          }),
          scripts: [
            { type: "application/ld+json", children: JSON.stringify(serviceSchema(loaderData)) },
          ],
        }
      : {},
  notFoundComponent: ServiceNotFoundEn,
  component: ServiceDetailEn,
});

function ServiceNotFoundEn() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-32 text-center">
        <span className="eyebrow mx-auto">Service not found</span>
        <h1 className="section-title mt-6">This page doesn't exist.</h1>
        <Link to="/en/services" className="btn-gold mt-9">
          See all services
        </Link>
      </main>
      <SiteFooter locale="en" />
    </div>
  );
}

function ServiceDetailEn() {
  const service = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main>
        <ServiceHero
          kicker={service.kicker}
          title={service.titlePrefix}
          titleAccent={service.titleAccent}
          description={service.heroDescription}
          cta={CTA}
        />
        <ServiceSections sections={service.sections} />
        <ServiceCTA title={service.cta.title} description={service.cta.description} cta={CTA} />
      </main>
      <SiteFooter locale="en" />
    </div>
  );
}
