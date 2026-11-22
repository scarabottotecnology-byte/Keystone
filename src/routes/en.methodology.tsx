import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { seo } from "@/lib/site";

export const Route = createFileRoute("/en/methodology")({
  head: () =>
    seo("/en/methodology", {
      title: "Our Methodology — ORBITA™ and RICE™ | Keystone",
      description:
        "ORBITA™ and RICE™, the frameworks Keystone uses for financial planning, monthly management tracking and strategic cost management in growing companies.",
      ogTitle: "Proprietary Methodology — Keystone",
    }),
  component: MethodologyPageEn,
});

const orbitaPhases = [
  {
    letter: "O",
    name: "Objectives",
    desc: "Financial targets aligned with the company's strategy.",
  },
  {
    letter: "R",
    name: "Roadmap",
    desc: "A quarterly action plan with owners, deadlines and deliverables.",
  },
  {
    letter: "B",
    name: "Budget",
    desc: "An integrated budget, with explicit assumptions and scenarios.",
  },
  {
    letter: "I",
    name: "Indicators",
    desc: "Financial and operational KPIs reviewed as a routine.",
  },
  { letter: "T", name: "Tracking", desc: "Monthly budget vs. actual, with variance analysis." },
  { letter: "A", name: "Action", desc: "Action plans to correct gaps and seize opportunities." },
];

const orbitaSteps = [
  {
    step: "01",
    title: "Diagnosis of the current cycle",
    desc: "How budget, indicators and decisions connect today, or fail to.",
  },
  {
    step: "02",
    title: "ORBITA™ cycle set-up",
    desc: "Objectives, roadmap and budget structured and set up by area.",
  },
  {
    step: "03",
    title: "Tracking routine",
    desc: "Monthly budget vs. actual, with root-cause analysis.",
  },
  {
    step: "04",
    title: "Action and recalibration",
    desc: "Corrective plans are executed and the cycle restarts the next quarter.",
  },
];

const ricePillars = [
  {
    letter: "R",
    name: "Reclassification",
    desc: "Cost centers structured and expenses classified by their real nature: the base for every analysis that follows.",
  },
  {
    letter: "I",
    name: "Identification",
    desc: "Cost drivers mapped and waste analyzed. It shows where the company quietly loses money.",
  },
  {
    letter: "C",
    name: "Costing",
    desc: "Costing by activity, product, channel, customer and business unit: the real cost of each dimension.",
  },
  {
    letter: "E",
    name: "Execution",
    desc: "Strategic pricing, product mix analysis and decisions based on data, not hunches.",
  },
];

const riceSteps = [
  {
    step: "01",
    title: "Survey and reclassification",
    desc: "Cost centers structured and expenses reclassified by their real nature.",
  },
  {
    step: "02",
    title: "Cost driver mapping",
    desc: "Finding where the operation wastes money, often without anyone noticing.",
  },
  {
    step: "03",
    title: "Multidimensional costing",
    desc: "Real profitability by product, channel, customer and business unit.",
  },
  {
    step: "04",
    title: "Strategic decision",
    desc: "Pricing and product mix adjusted to maximize contribution margin.",
  },
];

function MethodologyPageEn() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main>
        <section className="relative overflow-hidden px-8 pb-16 pt-36 lg:pt-44">
          <div className="relative z-10 mx-auto max-w-[1400px] text-center">
            <span className="eyebrow mx-auto">Proprietary methodology</span>
            <h1 className="section-title mx-auto mt-7 max-w-3xl">
              Frameworks that turn <em>complexity into results</em>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream-dim">
              Each method grew out of years of controllership practice inside large corporate
              groups, and is adapted to the size of each client.
            </p>
          </div>
        </section>

        <section id="orbita" className="border-t border-border-sub bg-navy py-24 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div>
                <span className="eyebrow">Proprietary method</span>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                    <Award className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <h2 className="section-title">
                    The <em>ORBITA™</em> method
                  </h2>
                </div>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-cream-mute">
                  Financial planning &amp; management tracking
                </p>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-dim">
                  ORBITA™ connects strategy and financial execution: a continuous cycle that turns
                  the budget into a decision tool. Every budget line is tied to a measurable
                  strategic objective, building a management culture based on indicators instead of
                  intuition.
                </p>
                <div className="mt-8 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-cream-mute">
                  <RefreshCw className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
                  Continuous cycle: restarts every quarter
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px border border-border-sub bg-border-sub sm:grid-cols-3">
                {orbitaPhases.map((phase) => (
                  <div key={phase.name} className="bg-navy-card p-6">
                    <div className="font-display text-3xl italic text-gold">{phase.letter}</div>
                    <div className="mt-2 text-sm font-semibold text-cream">{phase.name}</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">
                      {phase.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Steps label="How it works" steps={orbitaSteps} />
          </div>
        </section>

        <section id="rice" className="border-t border-border-sub bg-navy-mid py-24 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div>
                <span className="eyebrow">Proprietary method</span>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                    <Award className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <h2 className="section-title">
                    The <em>RICE™</em> method
                  </h2>
                </div>
                <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-cream-mute">
                  Strategic cost management
                </p>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream-dim">
                  RICE™ brings analytical rigor to cost management: it finds waste, maps cost
                  drivers and reveals the real profitability of the business by product, channel,
                  customer and unit.
                </p>
              </div>

              <div className="space-y-px border border-border-sub bg-border-sub">
                {ricePillars.map((pillar) => (
                  <div key={pillar.name} className="flex items-start gap-6 bg-navy-card p-6">
                    <span className="font-display text-3xl italic text-gold">{pillar.letter}</span>
                    <div>
                      <div className="text-sm font-semibold text-cream">{pillar.name}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-cream-mute">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Steps label="How it works" steps={riceSteps} />
          </div>
        </section>

        <section className="border-t border-border-sub py-24 text-center">
          <div className="mx-auto max-w-2xl px-8">
            <h2 className="section-title">
              See the methods <em>in practice</em>.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-cream-dim">
              Tell us about your company and we will show how they apply to your numbers.
            </p>
            <Link to="/en/contact" className="btn-gold mt-9 inline-flex">
              Request a proposal
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale="en" />
    </div>
  );
}

function Steps({
  label,
  steps,
}: {
  label: string;
  steps: { step: string; title: string; desc: string }[];
}) {
  return (
    <div className="mt-16 border-t border-border-sub pt-12">
      <span className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">{label}</span>
      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.step}>
            <div className="font-display text-2xl italic text-gold">{s.step}</div>
            <div className="mt-2 text-sm font-semibold text-cream">{s.title}</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-mute">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
