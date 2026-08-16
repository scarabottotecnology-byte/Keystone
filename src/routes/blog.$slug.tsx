import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { getPost, posts } from "@/content/posts";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { meta: post.meta };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.meta.title} — Blog Keystone` },
            { name: "description", content: loaderData.meta.description },
            { property: "og:title", content: loaderData.meta.title },
            { property: "og:description", content: loaderData.meta.description },
            { property: "og:type", content: "article" },
          ],
        }
      : {},
  notFoundComponent: NotFound,
  errorComponent: NotFound,
  component: PostPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function NotFound() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-8 py-40 text-center">
        <h1 className="section-title">Artigo <em>não encontrado</em></h1>
        <p className="mt-4 text-cream-dim">
          Esse conteúdo pode ter sido movido ou ainda não foi publicado.
        </p>
        <Link to="/blog" className="btn-ghost mt-8 inline-flex">
          ← Voltar para o blog
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function PostPage() {
  const { slug } = Route.useParams();
  const post = getPost(slug);
  if (!post) return <NotFound />;
  const { meta, default: Body } = post;
  const others = posts.filter((p) => p.meta.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <article>
          <header className="border-b border-border-sub px-8 pb-16 pt-36 lg:pt-48">
            <div className="mx-auto max-w-3xl">
              <Link
                to="/blog"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold hover:text-gold-light"
              >
                ← Blog Keystone
              </Link>
              <h1
                className="mt-7 font-display text-cream"
                style={{
                  fontSize: "clamp(34px,4.5vw,58px)",
                  fontWeight: 400,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                }}
              >
                {meta.title}
              </h1>
              <div className="mt-7 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.18em] text-cream-mute">
                <span className="text-gold">{meta.category}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(meta.date)}</span>
                <span aria-hidden>·</span>
                <span>{meta.readingTime}</span>
                <span aria-hidden>·</span>
                <span>{meta.author}</span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-8 py-20">
            <div className="post-body text-[16px] leading-[1.85] text-cream-dim">
              <Body />
            </div>
          </div>
        </article>

        {others.length > 0 && (
          <section className="border-t border-border-sub bg-navy-mid">
            <div className="mx-auto max-w-[1400px] px-8 py-20">
              <span className="eyebrow">Continue lendo</span>
              <div className="mt-8 grid gap-px bg-border-sub md:grid-cols-2">
                {others.map(({ meta: m }) => (
                  <Link
                    key={m.slug}
                    to="/blog/$slug"
                    params={{ slug: m.slug }}
                    className="group bg-navy-card p-10 transition-colors hover:bg-navy-light"
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-gold">
                      {m.category} · {m.readingTime}
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-medium text-cream group-hover:text-gold-light">
                      {m.title}
                    </h3>
                    <p className="mt-3 text-[13px] font-light text-cream-dim">
                      {m.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
