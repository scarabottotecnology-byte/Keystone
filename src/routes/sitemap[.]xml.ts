import { createFileRoute } from "@tanstack/react-router";
import { posts } from "@/content/posts";
import { services } from "@/content/services";
import { absoluteUrl } from "@/lib/site";

// Gerado a cada pedido a partir do conteúdo: serviço ou artigo novo entra no
// sitemap sem ninguém lembrar de editar um arquivo. Ferramentas internas
// (login, calendário de social media) e a política de privacidade (noindex)
// ficam de fora de propósito: sitemap só lista o que deve ser indexado.
const PAGINAS = [
  "/",
  "/servicos",
  "/diagnostico",
  "/calculadoras",
  "/ferramentas",
  "/indicadores",
  "/metodologias",
  "/cases",
  "/blog",
  "/contato",
];

function urlEntry(path: string, lastmod?: string) {
  return `  <url><loc>${absoluteUrl(path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const entries = [
          ...PAGINAS.map((p) => urlEntry(p)),
          ...services.map((s) => urlEntry(`/servicos/${s.slug}`)),
          ...posts.map((p) => urlEntry(`/blog/${p.meta.slug}`, p.meta.date)),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
