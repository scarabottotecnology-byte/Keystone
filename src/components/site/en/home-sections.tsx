/**
 * Seções da home em inglês (/en). O visual repete o da home em português; o
 * conteúdo fala com empresas de fora do Brasil que querem controladoria e
 * FP&A remotos, sem tratar de impostos brasileiros.
 *
 * Tudo o que é afirmado sobre experiência vem da trajetória real do
 * fundador (ver fundador.tsx e credenciais.tsx). Não acrescente números,
 * clientes ou certificações que não existam na versão em português.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, Calendar, CalendarDays, Globe2, Lock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { KeystoneMonogram } from "@/components/site/keystone-monogram";
import { CalendlyButton } from "@/components/site/calendly-button";
import { LeadForm } from "@/components/site/lead-form";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ Hero */

const monthlyDeliverables = [
  { when: "Weekly", what: "Bank reconciliation and 13-week cash forecast" },
  { when: "Day 5", what: "Month-end close reviewed and signed off" },
  { when: "Day 8", what: "Management P&L by unit, client or product" },
  { when: "Day 10", what: "Budget vs. actual with variance commentary" },
  { when: "Monthly", what: "KPI dashboard updated" },
  { when: "Monthly", what: "Results meeting with the owners or board" },
];

export function HeroEn() {
  const reduce = useReducedMotion();
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-navy px-6 pb-20 pt-32 md:px-8 lg:pt-40"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
        <div className="min-w-0">
          <h1
            className="font-display text-cream"
            style={{
              fontSize: "clamp(38px, 4.6vw, 64px)",
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
            }}
          >
            A remote controller who closes the month on time and shows what your company{" "}
            <em className="italic text-gold">really earns</em>.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-dim">
            Keystone brings the controllership discipline of large corporate groups to growing
            companies, wherever they are. Management reporting, budgeting, cash forecasting and
            financial operations, delivered remotely and in English, so you can price, hire and
            invest based on numbers you trust.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link to="/en/contact" className="btn-gold">
              Request a proposal
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <Link to="/en/services" className="btn-ghost">
              See our services
            </Link>
          </div>

          <p className="mt-4 text-xs text-cream-mute">
            Reply within 1 business day. No commitment.
          </p>

          <ul className="mt-12 grid gap-4">
            <TrustItem icon={Globe2} text="Fully remote, with one dedicated controller" />
            <TrustItem
              icon={Lock}
              text="Confidentiality first: restricted access, NDA on request"
            />
            <TrustItem icon={Award} text="14 years of controllership in manufacturing and retail" />
          </ul>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="w-full min-w-0 border border-border bg-navy-card"
        >
          <div className="flex items-center gap-3 border-b border-border-sub px-6 py-5">
            <CalendarDays aria-hidden className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
            <h2 className="font-sans text-sm font-semibold text-cream">
              What lands on your desk every month
            </h2>
          </div>
          <ul className="divide-y divide-border-sub">
            {monthlyDeliverables.map((o) => (
              <li
                key={o.what}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 px-5 py-4 text-[13px] sm:grid-cols-[7.5rem_1fr_auto] sm:gap-4 sm:px-6"
              >
                <span className="text-cream-mute">{o.when}</span>
                <span className="text-cream">{o.what}</span>
                <span className="border border-border-sub px-2 py-1 text-[11px] text-gold">
                  Included
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-border-sub px-6 py-4 text-[11px] leading-relaxed text-cream-mute">
            Example calendar. The exact cadence is agreed at onboarding and follows your reporting
            calendar.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function TrustItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 text-xs text-cream-dim">
      <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
      {text}
    </li>
  );
}

/* ----------------------------------------------------------- Credentials */

const credentials = [
  { value: "14 years", text: "in controllership, FP&A and corporate finance" },
  { value: "50+ companies", text: "in the consolidated budget the founder leads today" },
  { value: "Manufacturing & retail", text: "technology, beverages, fashion and pharma" },
  { value: "SAP, TOTVS & Power BI", text: "at home in the systems of companies that scaled" },
];

export function CredentialsEn() {
  return (
    <section aria-label="Experience" className="border-y border-border-sub bg-navy-mid">
      <RevealGroup className="mx-auto grid max-w-[1400px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {credentials.map((c, i) => (
          <RevealItem
            key={c.value}
            className={`px-8 py-8 ${i > 0 ? "border-t border-border-sub sm:border-t-0" : ""} ${
              i % 2 === 1 ? "sm:border-l sm:border-border-sub" : ""
            } ${i > 1 ? "sm:border-t sm:border-border-sub lg:border-t-0" : ""} ${
              i === 2 ? "lg:border-l lg:border-border-sub" : ""
            }`}
          >
            <p className="font-display text-[28px] font-normal leading-none text-gold-light">
              {c.value}
            </p>
            <p className="mt-3 text-[13px] font-light leading-snug text-cream-dim">{c.text}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/* --------------------------------------------------- Ledger ("what you get") */

const entries = [
  {
    debit: "Spreadsheets rebuilt by hand every month",
    credit: "A repeatable month-end close with reconciliations and a review checklist",
  },
  {
    debit: "Finding out about cash shortfalls when a bill is already due",
    credit: "A rolling 13-week cash forecast, updated every week",
  },
  {
    debit: "A P&L that nobody reads",
    credit: "A management P&L by business unit, client, product or project",
  },
  {
    debit: "A budget made once a year and then forgotten",
    credit: "Budget vs. actual every month, with the reasons behind each variance",
  },
  {
    debit: "Pricing, hiring and investment decided on gut feeling",
    credit: "Pricing, break-even and scenarios modeled before you decide",
  },
  {
    debit: "Board and investor reports put together the night before",
    credit: "A monthly reporting pack in English, ready to share",
  },
];

export function LedgerEn() {
  return (
    <section id="what-you-get" className="py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-8">
        <Reveal className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <h2 className="section-title">
            What you get when you <em>hire Keystone</em>
          </h2>
          <p className="text-[15px] font-light leading-relaxed text-cream-dim">
            Finance should help you run the company, not just keep the books. Read it as a journal
            entry: what leaves your desk, and what you get back for your management.
          </p>
        </Reveal>

        <div className="mt-16 border border-border">
          <div className="hidden grid-cols-2 border-b border-border md:grid">
            <p className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream-mute">
              Debit · off your desk
            </p>
            <p className="border-l border-border px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
              Credit · into your management
            </p>
          </div>

          <RevealGroup>
            {entries.map((l) => (
              <RevealItem
                key={l.debit}
                className="grid border-b border-border-sub last:border-b-0 md:grid-cols-2"
              >
                <div className="px-6 pb-2 pt-6 md:px-8 md:py-6">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.25em] text-cream-mute md:hidden">
                    Off your desk
                  </span>
                  <p className="text-[15px] font-light leading-relaxed text-cream-mute line-through decoration-cream-mute/40 decoration-1">
                    {l.debit}
                  </p>
                </div>
                <div className="px-6 pb-6 pt-2 md:border-l md:border-border-sub md:px-8 md:py-6">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gold md:hidden">
                    Into your management
                  </span>
                  <p className="text-[15px] leading-relaxed text-cream">{l.credit}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="border-t-[3px] border-double border-gold/70 bg-navy-card px-6 py-8 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10 md:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
              Balance
            </p>
            <p className="mt-3 font-display text-[26px] font-normal leading-snug text-cream md:mt-0 md:text-[30px]">
              More time to run the business, and numbers you can defend.
            </p>
            <Link to="/en/contact" className="btn-gold mt-6 md:mt-0">
              Request a proposal
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Tiers */

type Tier = {
  level: string;
  name: string;
  promise: string;
  forWhom: string;
  includes: string[];
  cta: { label: string; to: string };
};

const tiers: Tier[] = [
  {
    level: "Level 1 · Control",
    name: "Financial BPO",
    promise: "Your day-to-day finance run properly, without you chasing it.",
    forWhom:
      "Companies whose finances are handled by the owner or by someone who also does other jobs.",
    includes: [
      "Accounts payable and receivable",
      "Bank and card reconciliation",
      "13-week cash flow forecast",
      "Management chart of accounts and cost centers",
      "Month-end close support",
    ],
    cta: { label: "See Financial BPO", to: "/en/services/financial-bpo" },
  },
  {
    level: "Level 2 · Management",
    name: "Controllership as a Service",
    promise: "A controller in your company, without the cost of a full-time hire.",
    forWhom: "Companies that sell well but don't know for sure where they make and lose money.",
    includes: [
      "Monthly management P&L by unit, client or product",
      "Annual budget and monthly budget vs. actual",
      "Margin, cash and working capital KPIs",
      "Monthly results meeting with the owners",
      "Management-level consolidation of multi-entity groups",
    ],
    cta: { label: "See Controllership", to: "/en/services/controllership-as-a-service" },
  },
  {
    level: "Level 3 · Decision",
    name: "FP&A and advisory projects",
    promise: "A project with a clear start and finish for a decision you can't get wrong.",
    forWhom:
      "Owners and boards facing a big call: pricing, expansion, investment or restructuring.",
    includes: [
      "Pricing and contribution margin",
      "Business case for a new unit, product or market",
      "Cost structure review (RICE™ method)",
      "Financial model and reporting for investors or lenders",
    ],
    cta: { label: "Talk about a project", to: "/en/contact" },
  },
];

export function TiersEn() {
  return (
    <section id="services" className="border-t border-border-sub bg-navy-mid py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-8">
        <Reveal className="max-w-3xl">
          <h2 className="section-title">
            From clean numbers to the <em>right decision</em>
          </h2>
          <p className="mt-5 text-[15px] font-light leading-relaxed text-cream-dim">
            Three levels, one team. Start with the routine and move up when the company needs it,
            without changing providers or explaining everything again.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-px bg-border lg:grid-cols-3">
          {tiers.map((f, i) => (
            <RevealItem key={f.name} className="flex flex-col bg-navy-card">
              <div className="flex h-1 gap-px" aria-hidden>
                {[0, 1, 2].map((n) => (
                  <span key={n} className={`flex-1 ${n <= i ? "bg-gold" : "bg-border-sub"}`} />
                ))}
              </div>

              <div className="flex flex-1 flex-col p-8 md:p-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                  {f.level}
                </p>
                <h3 className="mt-4 font-display text-[30px] font-medium leading-tight text-cream">
                  {f.name}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-cream">{f.promise}</p>
                <p className="mt-3 text-[13px] font-light leading-relaxed text-cream-dim">
                  {f.forWhom}
                </p>

                <ul className="mt-8 flex-1 space-y-3 border-t border-border-sub pt-6">
                  {f.includes.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-[13px] leading-relaxed text-cream-dim"
                    >
                      <span aria-hidden className="mt-[10px] w-3 shrink-0 border-t border-gold" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link to={f.cta.to} className="btn-ghost mt-10 self-start">
                  {f.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* --------------------------------------------------- Who we work with */

const segments = [
  {
    name: "Founder-led companies",
    pain: "The business has grown past spreadsheets, but finance still lives in the founder's head.",
    help: "A monthly close, a management P&L and a cash forecast the whole leadership can read.",
  },
  {
    name: "Multi-entity groups",
    pain: "Several companies, each with its own books, and no single view of the group's result.",
    help: "Management-level consolidation and one reporting pack for the whole group.",
  },
  {
    name: "Professional services firms",
    pain: "Agencies, consultancies and engineering firms with good revenue and irregular cash.",
    help: "Margin by client and project, utilization-driven budgets and a 13-week cash view.",
  },
  {
    name: "Manufacturers and distributors",
    pain: "Simplified costing that hides which products, channels or customers lose money.",
    help: "Product and channel profitability with the RICE™ costing method, and pricing to match.",
  },
  {
    name: "Investor-backed companies",
    pain: "Board meetings and investor updates that take days of manual work every month.",
    help: "Budget, forecast, runway and a monthly board pack, built on reconciled numbers.",
  },
  {
    name: "Foreign companies with a Brazilian operation",
    pain: "Headquarters needs clear numbers in English from a subsidiary that reports in Portuguese.",
    help: "Controllership in English that works alongside your local accountant and bridges both sides.",
  },
];

export function WhoWeWorkWithEn() {
  return (
    <section id="who-we-work-with" className="py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <Reveal>
          <h2 className="section-title max-w-3xl">Who we work with</h2>
          <p className="mt-5 max-w-2xl text-[15px] font-light leading-relaxed text-cream-dim">
            Every business has its own cost drivers and blind spots. We learn yours before we write
            a proposal.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <RevealItem
              key={s.name}
              className="border border-border-sub p-10 transition-colors hover:border-border"
            >
              <h3 className="font-display text-2xl font-medium text-cream">{s.name}</h3>
              <p className="mt-4 text-[13px] font-light leading-relaxed text-cream-dim">{s.pain}</p>
              <p className="mt-5 border-t border-border-sub pt-5 text-[13px] leading-relaxed text-cream">
                {s.help}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Founder */

const career = [
  {
    period: "2025 · today",
    where: "Multi-sector group with more than 50 companies",
    role: "Strategic Controllership Specialist",
    done: "Leads the group's consolidated budget, P&L and product pricing.",
  },
  {
    period: "2023 · 2025",
    where: "Coca-Cola FEMSA",
    role: "Senior Controllership Analyst",
    done: "Budget and results control for a distribution center.",
  },
  {
    period: "2020 · 2023",
    where: "Reserva Paulista",
    role: "Controllership Analyst",
    done: "Month-end close, results analysis and management KPIs.",
  },
  {
    period: "2017 · 2020",
    where: "Carmim",
    role: "Senior Finance & Administration Analyst",
    done: "Finance and administration for a fashion and retail brand.",
  },
  {
    period: "2012 · 2017",
    where: "Positivo Tecnologia",
    role: "Finance",
    done: "First years at a publicly listed technology manufacturer.",
  },
];

const education = [
  "Bachelor's degree in Accounting",
  "Technologist degree in Financial Management",
  "MBAs in finance and management",
  "SAP, TOTVS and Power BI",
];

export function FounderEn() {
  return (
    <section id="about" className="border-t border-border-sub py-28">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-6 md:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
        <Reveal>
          <h2 className="section-title">
            Who looks after <em>your numbers</em>
          </h2>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center border border-border">
              <KeystoneMonogram size={28} />
            </div>
            <div>
              <p className="font-display text-xl font-medium text-cream">Jefferson Scarabotto</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">
                Founder, Keystone
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-[15px] font-light leading-relaxed text-cream-dim">
            <p>
              I have spent the last 14 years inside the controllership teams of companies that could
              not afford to get the numbers wrong: manufacturing, distribution and retail, with
              budgets that today consolidate more than 50 companies.
            </p>
            <p>
              Keystone exists to bring that same rigor to companies that don't have, and don't need,
              an in-house controllership department. You get the reporting discipline of a large
              group, delivered remotely by the person who builds it.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-px border border-border-sub bg-border-sub sm:grid-cols-2">
            {education.map((f) => (
              <li key={f} className="bg-navy px-5 py-4 text-[13px] text-cream">
                {f}
              </li>
            ))}
          </ul>
        </Reveal>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Career</p>
          <RevealGroup className="mt-6">
            <div className="relative border-l border-border">
              {career.map((t, i) => (
                <RevealItem key={t.period} className="relative pb-10 pl-8 last:pb-0">
                  <span
                    aria-hidden
                    className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] border ${
                      i === 0 ? "border-gold bg-gold" : "border-border bg-navy"
                    }`}
                  />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">
                      {t.period}
                    </p>
                    <p className="mt-2 font-display text-[22px] font-medium leading-snug text-cream">
                      {t.where}
                    </p>
                    <p className="text-[13px] text-gold">{t.role}</p>
                    <p className="mt-2 text-[13px] font-light leading-relaxed text-cream-dim">
                      {t.done}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- How it works */

const steps = [
  {
    title: "Call and proposal",
    desc: "Tell us about your entities, systems and reporting needs. We reply with scope and fees within 1 business day.",
  },
  {
    title: "Onboarding",
    desc: "Read-only access to your accounting system and banks, a management chart of accounts and an agreed reporting calendar.",
  },
  {
    title: "Monthly routine",
    desc: "We reconcile, close, analyze and build the reports on the dates we agreed.",
  },
  {
    title: "Report and review",
    desc: "Every month, results and cash in plain English, plus what needs a decision.",
  },
];

export function HowItWorksEn() {
  return (
    <section id="how-it-works" className="border-t border-border-sub py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <Reveal>
          <h2 className="section-title max-w-2xl">How it works</h2>
        </Reveal>
        <ol className="mt-14 grid gap-px bg-border-sub md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ title, desc }, i) => (
            <li key={title} className="bg-navy-card p-10">
              <div className="font-display text-3xl font-light text-gold" aria-hidden>
                {i + 1}
              </div>
              <h3 className="mt-5 font-display text-xl font-medium text-cream">{title}</h3>
              <p className="mt-3 text-[13px] font-light leading-relaxed text-cream-dim">{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Contact */

export function ContactSectionEn() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden border-y border-border-sub bg-navy-mid py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: "radial-gradient(ellipse, rgba(166,25,46,0.07) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-8">
        <div className="mb-12 text-center">
          <h2 className="section-title">Request a proposal</h2>
          <p className="mt-5 text-[15px] font-light text-cream-dim">
            Tell us how many entities you have, which systems you use and what you need to see every
            month. We reply within 1 business day, with no commitment.
          </p>

          <div className="mt-8 flex justify-center">
            <CalendlyButton className="btn-gold">
              Book a call
              <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            </CalendlyButton>
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-cream-mute">
            Pick a time in the calendar, with automatic confirmation
          </p>

          <div className="mx-auto mt-9 flex max-w-xs items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-cream-mute">
            <span className="h-px flex-1 bg-border-sub" />
            or send your details
            <span className="h-px flex-1 bg-border-sub" />
          </div>
        </div>

        <LeadForm
          locale="en"
          origem="EN site — Request a proposal"
          submitLabel="Request a proposal"
          successDescription="Thank you. We will get back to you within 1 business day."
          footer={
            <p className="text-center text-[10px] uppercase tracking-[0.15em] text-cream-mute">
              Your details stay confidential. NDA available on request.
            </p>
          }
          fields={[
            { name: "nome", label: "Full name", type: "text", required: true },
            { name: "email", label: "Work email", type: "email", required: true },
            { name: "empresa", label: "Company", type: "text", required: true },
            { name: "telefone", label: "Phone / WhatsApp", type: "tel" },
            {
              name: "mensagem",
              label: "Message",
              type: "text",
              placeholder:
                "E.g. 2 entities, Xero, revenue of about $3M a year. We need a monthly management P&L and a cash forecast.",
            },
          ]}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ */

export const faqEn = [
  {
    q: "Do you work with companies outside Brazil?",
    a: "Yes. The service is fully remote and delivered in English. We are based in São Paulo (UTC−3), which overlaps with business hours across the Americas and with the afternoon in Europe.",
  },
  {
    q: "Do you replace my accountant or tax advisor?",
    a: "No. We focus on controllership, FP&A and financial operations. Statutory accounts and tax filings in your country stay with your local accountant, and we coordinate with them so the numbers match.",
  },
  {
    q: "Which systems do you work with?",
    a: "We work inside the accounting or ERP system you already use, with read-only access whenever possible, and deliver reports in Excel or Power BI. We only suggest a change of system when the gain is clear.",
  },
  {
    q: "How much does it cost?",
    a: "A fixed monthly fee based on scope: number of entities, transaction volume and depth of reporting. Send us the basics and we reply with a proposal within 1 business day.",
  },
  {
    q: "Is my company's data safe?",
    a: "Access is restricted to the people working on your account, we prefer read-only access to banks and systems, and we sign an NDA whenever you want to formalize confidentiality.",
  },
  {
    q: "How quickly do we see the first reports?",
    a: "The first management reports come out in the first monthly cycle after onboarding. Margin gains show up as you act on what the reports reveal.",
  },
];

export function FaqEn() {
  return (
    <section id="faq" className="border-t border-border-sub py-28">
      <div className="mx-auto max-w-3xl px-8">
        <Reveal className="text-center">
          <h2 className="section-title">Frequently asked questions</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="mt-14 w-full">
            {faqEn.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="border-b border-border-sub"
              >
                <AccordionTrigger className="py-6 text-left font-display text-lg font-medium text-cream hover:text-gold-light hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-[14px] font-light leading-relaxed text-cream-dim">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
