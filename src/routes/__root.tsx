import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CookieConsent } from "@/components/site/cookie-consent";
import { HubspotTracking } from "@/components/site/hubspot-tracking";
import { MetaPixel } from "@/components/site/meta-pixel";
import { Ga4 } from "@/components/site/ga4";
import { META_DOMAIN_VERIFICATION } from "@/lib/meta-pixel";
import { captureUtm } from "@/lib/leads";
import { GOOGLE_SITE_VERIFICATION, OG_IMAGE, SITE_URL } from "@/lib/site";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço não existe ou mudou de lugar.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Tente recarregar ou volte para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}

// Dados estruturados da empresa (schema.org), lidos pelo Google para o painel
// de conhecimento e os resultados com o nome e o site da Keystone.
const ORGANIZACAO = {
  "@context": "https://schema.org",
  "@type": "AccountingService",
  "@id": `${SITE_URL}/#organizacao`,
  name: "Keystone",
  url: SITE_URL,
  email: "contato@keystone-contabilidade.com",
  logo: `${SITE_URL}/apple-touch-icon.png`,
  image: OG_IMAGE,
  description:
    "Contabilidade, fiscal, folha, BPO financeiro e controladoria para empresas do Simples Nacional e do Lucro Presumido.",
  founder: { "@type": "Person", name: "Jefferson Scarabotto" },
  // Cidades primeiro: o Google usa areaServed para associar a empresa às
  // buscas locais ("contabilidade em Santo André"), que são as alcançáveis.
  areaServed: [
    ...[
      "Santo André",
      "São Bernardo do Campo",
      "São Caetano do Sul",
      "Diadema",
      "Mauá",
      "Ribeirão Pires",
      "Rio Grande da Serra",
    ].map((name) => ({ "@type": "City", name })),
    { "@type": "State", name: "São Paulo" },
    { "@type": "Country", name: "Brasil" },
  ],
  availableLanguage: "pt-BR",
  knowsAbout: [
    "Contabilidade",
    "BPO financeiro",
    "Controladoria",
    "Planejamento tributário",
    "Departamento pessoal",
    "Simples Nacional",
    "Lucro Presumido",
  ],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Keystone | Escritório de Contabilidade" },
      {
        name: "description",
        content:
          "Contabilidade, abertura de empresas, BPO financeiro, fiscal e departamento pessoal para empresas do Simples Nacional e Lucro Presumido.",
      },
      { name: "author", content: "Keystone" },
      { property: "og:title", content: "Keystone" },
      {
        property: "og:description",
        content: "Contabilidade em dia, impostos sob controle e atendimento digital.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Keystone" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Keystone: contabilidade e controladoria para PMEs" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
      ...(GOOGLE_SITE_VERIFICATION
        ? [{ name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION }]
        : []),
      ...(META_DOMAIN_VERIFICATION
        ? [{ name: "facebook-domain-verification", content: META_DOMAIN_VERIFICATION }]
        : []),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ORGANIZACAO) }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Guarda a origem da visita (utm_*) logo na chegada: quem vem de um post
  // costuma navegar antes de preencher qualquer formulário, e sem isso a
  // atribuição se perde entre a primeira página e a conversão.
  useEffect(() => {
    captureUtm();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <CookieConsent />
      <HubspotTracking />
      <MetaPixel />
      <Ga4 />
    </QueryClientProvider>
  );
}
