import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

/* Shared building blocks for /servicos/* pages — reuses the Keystone
   Dark Luxury Corporate design system (navy/gold/cream, Cormorant + Manrope,
   eyebrow / section-title utilities) so every service page feels native to
   the rest of the site instead of importing the old Next.js visual style. */

export function ServiceHero({
  kicker,
  title,
  titleAccent,
  description,
}: {
  kicker: string;
  title: string;
  titleAccent: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy px-8 pb-16 pt-36 lg:pt-44">
      <div aria-hidden className="grid-texture pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative z-10 mx-auto max-w-[1400px]">
        <span className="eyebrow">{kicker}</span>
        <h1
          className="mt-7 max-w-4xl font-display text-cream"
          style={{
            fontSize: "clamp(38px, 5vw, 64px)",
            fontWeight: 300,
            lineHeight: 1.08,
            letterSpacing: "-0.01em",
          }}
        >
          {title} <em className="italic text-gold">{titleAccent}</em>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">{description}</p>
        <Link to="/diagnostico" className="btn-gold mt-9">
          Solicitar Diagnóstico
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}

export function ServiceSection({
  eyebrow,
  title,
  titleEm,
  intro,
  tone = "navy",
  align = "left",
  children,
}: {
  eyebrow: string;
  title: string;
  titleEm?: string;
  intro?: string;
  tone?: "navy" | "navy-mid";
  align?: "left" | "center";
  children: ReactNode;
}) {
  const centered = align === "center";
  return (
    <section
      className={`border-t border-border-sub py-24 lg:py-28 ${tone === "navy-mid" ? "bg-navy-mid" : "bg-navy"}`}
    >
      <div className={`mx-auto max-w-[1400px] px-8 ${centered ? "text-center" : ""}`}>
        <span className={`eyebrow ${centered ? "mx-auto" : ""}`}>{eyebrow}</span>
        <h2 className={`section-title mt-6 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
          {title} {titleEm ? <em>{titleEm}</em> : null}
        </h2>
        {intro ? (
          <p
            className={`mt-5 max-w-2xl text-[15px] leading-relaxed text-cream-dim ${centered ? "mx-auto" : ""}`}
          >
            {intro}
          </p>
        ) : null}
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}

export function ServiceProblemList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-px bg-border-sub md:grid-cols-2">
      {items.map((item) => (
        <div key={item} className="flex gap-4 bg-navy-card p-7">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" strokeWidth={1.5} />
          <p className="text-[13.5px] leading-relaxed text-cream-dim">{item}</p>
        </div>
      ))}
    </div>
  );
}

export function ServiceStepGrid({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <div className="grid gap-px bg-border-sub sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <div key={step.title} className="bg-navy-card p-8 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center border border-gold/40 font-display text-base text-gold">
            {String(i + 1).padStart(2, "0")}
          </div>
          <h3 className="mt-5 font-display text-lg font-medium text-cream">{step.title}</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-cream-mute">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function ServiceMethodGrid({
  letters,
}: {
  letters: { letter: string; name: string; desc: string }[];
}) {
  return (
    <div
      className="grid gap-px border border-border-sub bg-border-sub sm:grid-cols-3"
      style={{ gridTemplateColumns: `repeat(${Math.min(letters.length, 3)}, minmax(0,1fr))` }}
    >
      {letters.map((l) => (
        <div key={l.letter} className="bg-navy-card p-6">
          <div className="font-display text-3xl italic text-gold">{l.letter}</div>
          <div className="mt-2 text-sm font-semibold text-cream">{l.name}</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">{l.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function ServiceResultsGrid({
  results,
}: {
  results: { metric: string; before: string; after: string; change: string }[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {results.map((r) => (
        <div key={r.metric} className="border border-border-sub bg-navy-card p-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cream-mute">{r.metric}</div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs text-cream-mute/70 line-through">{r.before}</span>
            <ArrowRight className="h-3 w-3 text-gold" />
            <span className="font-display text-xl font-medium text-cream">{r.after}</span>
          </div>
          <div className="mt-1.5 text-xs font-medium text-gold">{r.change}</div>
        </div>
      ))}
    </div>
  );
}

export function ServiceFeatureGrid({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div className="grid gap-px bg-border-sub sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="bg-navy-card p-8">
          <h3 className="font-display text-lg font-medium text-cream">{item.title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function ServiceChecklist({ items, columns = 1 }: { items: string[]; columns?: 1 | 2 }) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 border border-border-sub bg-navy-card p-4"
        >
          <Check className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
          <span className="text-[13px] text-cream-dim">{item}</span>
        </div>
      ))}
    </div>
  );
}

export function ServiceFaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border-sub border-t border-border-sub">
      {items.map((item) => (
        <details key={item.q} className="group py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-medium text-cream marker:content-none hover:text-gold-light">
            {item.q}
            <span className="shrink-0 text-gold transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-4 text-[14px] leading-relaxed text-cream-dim">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function ServiceCTA({ title, description }: { title: string; description: string }) {
  return (
    <section className="border-t border-border-sub bg-navy-mid py-24 text-center">
      <div className="mx-auto max-w-2xl px-8">
        <h2 className="section-title">
          <em>{title}</em>
        </h2>
        <p className="mt-5 text-[15px] leading-relaxed text-cream-dim">{description}</p>
        <Link to="/diagnostico" className="btn-gold mt-9 inline-flex">
          Solicitar Diagnóstico
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
