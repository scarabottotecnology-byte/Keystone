import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { posts } from "@/content/posts";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Keystone | FP&A, Controladoria e Finanças" },
      {
        name: "description",
        content:
          "Artigos sobre FP&A, Controladoria, gestão financeira e estratégia para CEOs e CFOs.",
      },
      { property: "og:title", content: "Blog Keystone" },
      {
        property: "og:description",
        content: "Inteligência financeira para líderes que decidem.",
      },
    ],
  }),
  component: BlogIndex,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}

const categories = ["Todos", "Controladoria", "Modelo Financeiro", "Custos", "FP&A", "Tax & Fiscal"];

function BlogIndex() {
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <section className="px-8 pb-12 pt-36 lg:pt-48">
          <div className="mx-auto max-w-[1400px]">
            <span className="eyebrow">Inteligência financeira</span>
            <h1
              className="mt-7 font-display text-cream"
              style={{
                fontSize: "clamp(44px,6vw,76px)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              Insights para
              <br />
              <em className="italic text-gold-light">líderes financeiros</em>
            </h1>
            <p className="mt-6 max-w-2xl font-accent text-lg italic text-cream-dim">
              Artigos práticos sobre FP&A, Controladoria e estratégia financeira para
              quem decide.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-8 pb-20">
          {/* Category filters (visual) */}
          <div className="mb-10 flex flex-wrap gap-3">
            {categories.map((c, i) => (
              <button
                key={c}
                className={`border px-5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                  i === 0
                    ? "border-gold text-gold-light"
                    : "border-border-sub text-cream-mute hover:border-gold hover:text-gold-light"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Featured */}
          {featured && (
            <Link
              to="/blog/$slug"
              params={{ slug: featured.meta.slug }}
              className="group mb-px grid gap-px bg-border-sub md:grid-cols-2"
            >
              <div
                className="relative flex min-h-[360px] items-center justify-center bg-navy-light"
                aria-hidden
              >
                <span className="font-display text-7xl font-light text-gold/40">K</span>
                <div className="absolute left-6 top-6 bg-gold px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-navy">
                  Destaque
                </div>
              </div>
              <div className="flex flex-col justify-center bg-navy-card p-14">
                <div className="text-[10px] uppercase tracking-[0.18em] text-gold">
                  {featured.meta.category} · {featured.meta.readingTime}
                </div>
                <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-cream transition-colors group-hover:text-gold-light">
                  {featured.meta.title}
                </h2>
                <p className="mt-4 text-sm font-light leading-relaxed text-cream-dim">
                  {featured.meta.description}
                </p>
                <span className="btn-gold mt-7 self-start">
                  Ler artigo
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div className="mt-px grid gap-px bg-border-sub md:grid-cols-2 lg:grid-cols-3">
              {rest.map(({ meta }) => (
                <Link
                  key={meta.slug}
                  to="/blog/$slug"
                  params={{ slug: meta.slug }}
                  className="group flex flex-col bg-navy-card transition-colors hover:bg-navy-light"
                >
                  <div
                    className="relative flex aspect-[16/9] items-center justify-center border-b border-border-sub bg-navy-light"
                    aria-hidden
                  >
                    <span className="font-display text-5xl font-light text-gold/30">K</span>
                  </div>
                  <div className="px-7 pb-5 pt-6 text-[10px] uppercase tracking-[0.18em] text-gold">
                    {meta.category} · {meta.readingTime}
                  </div>
                  <h3 className="px-7 pb-3.5 font-display text-[22px] font-medium leading-snug text-cream group-hover:text-gold-light">
                    {meta.title}
                  </h3>
                  <p className="flex-1 px-7 pb-5 text-[13px] font-light leading-relaxed text-cream-mute">
                    {meta.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-border-sub px-7 py-4">
                    <span className="text-[11px] tracking-wide text-cream-mute">
                      {formatDate(meta.date)}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">
                      Ler →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter */}
        <section className="border-t border-border-sub bg-navy-mid py-20">
          <div className="mx-auto grid max-w-[1400px] gap-16 px-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="eyebrow">Newsletter</span>
              <h2 className="section-title mt-6" style={{ fontSize: "clamp(32px,4vw,52px)" }}>
                Inteligência financeira
                <br />
                <em>toda semana</em>
              </h2>
              <p className="mt-5 text-[15px] font-light text-cream-dim">
                Uma análise por semana sobre FP&A, controladoria e estratégia financeira.
                Direto no seu e-mail. Sem spam.
              </p>
            </div>
            <form
              className="w-full"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className="text-[13px] text-cream-mute">
                +1.200 CFOs e CEOs já recebem
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com.br"
                  className="flex-1 border border-border-sub bg-cream/[0.04] px-5 py-3.5 text-sm text-cream outline-none transition-colors placeholder:text-cream-mute focus:border-gold"
                />
                <button type="submit" className="btn-gold">
                  Assinar
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 text-[11px] text-cream-mute opacity-70">
                Cancele quando quiser. Sem compromisso.
              </div>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
