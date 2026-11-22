import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, Scale, Target, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { seo } from "@/lib/site";

export const Route = createFileRoute("/en/services/")({
  head: () =>
    seo("/en/services", {
      title: "Controllership, FP&A and Financial BPO Services | Keystone",
      description:
        "Remote controllership, FP&A, budgeting, financial BPO and cost management for growing companies, delivered in English by one dedicated team.",
      ogTitle: "Services | Keystone",
    }),
  component: ServicesIndexEn,
});

const services = [
  {
    slug: "controllership-as-a-service",
    Icon: LineChart,
    name: "Controllership as a Service",
    desc: "Month-end close review, management P&L, budget vs. actual and a monthly results meeting.",
    tags: ["Management P&L", "Close review", "KPIs"],
  },
  {
    slug: "fpa-budgeting-forecasting",
    Icon: Target,
    name: "FP&A, budgeting and forecasting",
    desc: "Annual budget, rolling forecasts, scenarios and models for investors or lenders.",
    tags: ["Budget", "Forecast", "Scenarios"],
  },
  {
    slug: "financial-bpo",
    Icon: Wallet,
    name: "Financial BPO",
    desc: "Accounts payable and receivable, reconciliation and cash flow forecasting.",
    tags: ["Payables", "Reconciliation", "Cash flow"],
  },
  {
    slug: "cost-management-pricing",
    Icon: Scale,
    name: "Cost management and pricing",
    desc: "Profitability by product, channel and customer, break-even and pricing.",
    tags: ["RICE™", "Profitability", "Pricing"],
  },
];

function ServicesIndexEn() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main>
        <section className="relative overflow-hidden px-8 pb-16 pt-36 lg:pt-44">
          <div className="relative z-10 mx-auto max-w-[1400px] text-center">
            <h1 className="section-title mx-auto max-w-3xl">
              Controllership and finance services for the whole month, not just the year end.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
              Hire one service or hand your management reporting, planning and financial operations
              to the same remote team.
            </p>
          </div>
        </section>

        <section className="border-t border-border-sub pb-24">
          <div className="mx-auto max-w-[1400px] px-8 pt-16">
            <div className="grid gap-px bg-border-sub md:grid-cols-2">
              {services.map(({ slug, Icon, name, desc, tags }) => (
                <Link
                  key={slug}
                  to="/en/services/$slug"
                  params={{ slug }}
                  className="group flex flex-col bg-navy-card p-10 transition-colors hover:bg-navy-light"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center border border-border transition-colors group-hover:border-gold group-hover:bg-gold-dim">
                    <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-display text-[22px] font-medium text-cream group-hover:text-gold-light">
                    {name}
                  </h2>
                  <p className="mt-3 flex-1 text-[13px] font-light leading-relaxed text-cream-dim">
                    {desc}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="border border-border-sub px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-cream-mute"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
                    See details
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border-sub bg-navy-mid py-16">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-6 px-8 text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <span className="eyebrow lg:mx-0">Already have a finance provider?</span>
              <h2 className="mt-4 font-display text-2xl font-medium text-cream">
                You can switch without losing history or a single deadline.
              </h2>
            </div>
            <Link to="/en/switching" className="btn-gold shrink-0">
              See how switching works
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale="en" />
    </div>
  );
}
