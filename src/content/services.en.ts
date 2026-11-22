// Serviços do site em inglês (/en/services). Não são traduções dos serviços em
// português: o público é de empresas de fora do Brasil, então o foco é
// controladoria, FP&A e operações financeiras, sem impostos brasileiros.
import type { ServiceContent } from "@/content/services";

type Faq = { q: string; a: string };

function build(o: {
  slug: string;
  kicker: string;
  name: string;
  titlePrefix: string;
  titleAccent: string;
  heroDescription: string;
  seoTitle: string;
  seoDescription: string;
  problems: string[];
  includes: { title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  checklist: string[];
  faq: Faq[];
}): ServiceContent {
  return {
    slug: o.slug,
    kicker: o.kicker,
    name: o.name,
    titlePrefix: o.titlePrefix,
    titleAccent: o.titleAccent,
    heroDescription: o.heroDescription,
    seoTitle: o.seoTitle,
    seoDescription: o.seoDescription,
    sections: [
      {
        kind: "problems",
        eyebrow: "When to call us",
        title: "Signs you need",
        titleEm: "help here",
        items: o.problems,
      },
      {
        kind: "features",
        eyebrow: "What we do",
        title: "What's",
        titleEm: "included",
        items: o.includes,
      },
      {
        kind: "steps",
        eyebrow: "How it works",
        title: "From the first call to the",
        titleEm: "monthly routine",
        steps: o.steps,
      },
      {
        kind: "checklist",
        eyebrow: "To get started",
        title: "What we need",
        titleEm: "from you",
        items: o.checklist,
        columns: 2,
      },
      {
        kind: "faq",
        eyebrow: "FAQ",
        title: "Questions about",
        titleEm: o.name,
        items: o.faq,
      },
    ],
    cta: {
      title: "Want to know what it costs for your company?",
      description:
        "Tell us how many entities you have, which systems you use and what you need to see every month. We reply with a proposal within 1 business day.",
    },
  };
}

export const servicesEn: ServiceContent[] = [
  build({
    slug: "controllership-as-a-service",
    seoTitle: "Outsourced Controller & Controllership Services | Keystone",
    seoDescription:
      "A part-time remote controller for growing companies: month-end close review, management P&L, budget vs. actual, KPIs and a monthly results meeting.",
    kicker: "Controllership",
    name: "Controllership as a Service",
    titlePrefix: "Controllership",
    titleAccent: "as a service",
    heroDescription:
      "A controller in your company without the cost of a full-time hire: a reviewed month-end close, a management P&L you can read, budget vs. actual every month and a meeting to decide what to do about it.",
    problems: [
      "The month closes late, and nobody can explain why the result changed.",
      "You don't know for sure which units, clients or products make money.",
      "The budget was made once and nobody compares it with the actuals.",
      "The partners disagree about how the company is really doing.",
    ],
    includes: [
      {
        title: "Month-end close review",
        desc: "Reconciliations, accruals and a close checklist, so the numbers are right before anyone reads them.",
      },
      {
        title: "Management P&L",
        desc: "Results by business unit, client, product or project, compared with last month and last year.",
      },
      {
        title: "Budget vs. actual",
        desc: "Monthly variance analysis with the reasons behind each relevant gap.",
      },
      {
        title: "KPI dashboard",
        desc: "A handful of margin, cash and working capital indicators chosen for your business.",
      },
      {
        title: "Group view",
        desc: "Management-level consolidation when the business runs through several entities.",
      },
      {
        title: "Monthly results meeting",
        desc: "A conversation with the owners or board that ends with an action plan.",
      },
    ],
    steps: [
      { title: "Diagnosis", desc: "We review your cost structure, history and current reports." },
      {
        title: "Model",
        desc: "We set up the management chart of accounts, cost centers and report formats.",
      },
      { title: "Monthly cycle", desc: "Close review, reports and KPIs on the agreed dates." },
      { title: "Decision", desc: "We discuss pricing, cost and investment adjustments with you." },
    ],
    checklist: [
      "Read-only access to your accounting system",
      "Trial balance or P&L for the last 12 months",
      "Organization chart and cost centers",
      "Main clients, contracts and price list",
      "Budget or targets, if they exist",
      "One point of contact in the company",
    ],
    faq: [
      {
        q: "Does this replace a CFO?",
        a: "For small and mid-sized companies it covers much of what a CFO does day to day. It does not replace an in-house finance team in larger organizations.",
      },
      {
        q: "Do you keep the statutory books?",
        a: "No. Statutory accounting and tax filings stay with your local accountant. We review the close and build the management view on top of it.",
      },
      {
        q: "How soon do we get the first reports?",
        a: "In the first monthly cycle after onboarding. Margin gains appear as you act on what the reports show.",
      },
    ],
  }),
  build({
    slug: "fpa-budgeting-forecasting",
    seoTitle: "Outsourced FP&A: Budgeting and Forecasting | Keystone",
    seoDescription:
      "Annual budget, rolling forecasts, scenarios and monthly tracking with the ORBITA™ method, so your plan drives decisions instead of sitting in a file.",
    kicker: "FP&A",
    name: "FP&A, budgeting and forecasting",
    titlePrefix: "FP&A, budgeting and",
    titleAccent: "forecasting",
    heroDescription:
      "An annual budget connected to your strategy, rolling forecasts and scenarios, tracked every month with the ORBITA™ method so the plan drives decisions instead of sitting in a drawer.",
    problems: [
      "The budget is a spreadsheet made in January and forgotten by March.",
      "You can't say with confidence what the year will close at.",
      "Hiring and investment plans aren't tied to a cash forecast.",
      "Investors or lenders ask for a model you don't have.",
    ],
    includes: [
      {
        title: "Annual budget",
        desc: "Revenue, costs, headcount and capex, built from clear assumptions by area.",
      },
      {
        title: "Rolling forecast",
        desc: "Quarterly re-forecast of the year based on the actuals to date.",
      },
      {
        title: "Scenarios",
        desc: "Base, downside and upside cases to test decisions before you make them.",
      },
      {
        title: "Cash flow forecast",
        desc: "A 13-week view for operations and a 12-month view for planning.",
      },
      {
        title: "Monthly tracking",
        desc: "Budget vs. actual with root-cause analysis and corrective actions.",
      },
      {
        title: "Investor and lender model",
        desc: "A financial model and reporting pack ready for due diligence or credit.",
      },
    ],
    steps: [
      { title: "Objectives", desc: "We translate strategy into measurable financial targets." },
      { title: "Budget", desc: "We build the budget with each area's owner." },
      { title: "Tracking", desc: "Monthly budget vs. actual with variance commentary." },
      { title: "Action", desc: "Corrective plans, and the cycle restarts every quarter." },
    ],
    checklist: [
      "P&L and balance sheet for the last 12 to 24 months",
      "Strategic goals for the year",
      "Headcount and payroll by area",
      "Sales pipeline or revenue drivers",
      "Planned investments",
      "Owner of each budget area",
    ],
    faq: [
      {
        q: "We have never had a budget. Is it too early?",
        a: "No. A simple first budget with monthly tracking already changes how decisions are made. It gets more detailed as the company grows.",
      },
      {
        q: "Which tools do you use?",
        a: "Excel or Power BI by default, or the planning tool you already have.",
      },
      {
        q: "What is the ORBITA™ method?",
        a: "Our planning cycle: Objectives, Roadmap, Budget, Indicators, Tracking and Action. See the Methodology page for the details.",
      },
    ],
  }),
  build({
    slug: "financial-bpo",
    seoTitle: "Financial BPO: Payables, Receivables and Cash | Keystone",
    seoDescription:
      "Payables, receivables, bank reconciliation, cash forecasting and management reporting, run remotely so you always know how much cash you have and will have.",
    kicker: "Financial BPO",
    name: "Financial BPO",
    titlePrefix: "Financial",
    titleAccent: "BPO",
    heroDescription:
      "Accounts payable and receivable, bank reconciliation, cash forecasting and a management P&L, run by us so you know how much cash you have, what's coming in and what's left at the end of the month.",
    problems: [
      "Finance is run by you, or by someone who also does three other jobs.",
      "You find out cash is short when a payment is already due.",
      "You don't know which client, project or contract is most profitable.",
      "The company bills well, but cash never seems to follow.",
    ],
    includes: [
      {
        title: "Accounts payable",
        desc: "Scheduling and checking supplier payments, always subject to your final approval.",
      },
      {
        title: "Accounts receivable and collections",
        desc: "Invoicing follow-up, overdue control and reminder routines.",
      },
      {
        title: "Bank reconciliation",
        desc: "Daily or weekly matching of bank statements, cards and entries.",
      },
      {
        title: "Cash flow forecast",
        desc: "Weekly and monthly view of what comes in and goes out over the next months.",
      },
      {
        title: "Management P&L",
        desc: "Monthly results by cost center, client or project.",
      },
      {
        title: "KPIs and monthly meeting",
        desc: "A short dashboard and a conversation to decide the next step.",
      },
    ],
    steps: [
      { title: "Mapping", desc: "We learn your accounts, tools and approval routine." },
      {
        title: "Management chart of accounts",
        desc: "We organize categories and cost centers around your business.",
      },
      { title: "Operation", desc: "We run day-to-day finance on the agreed cadence." },
      { title: "Management", desc: "We deliver reports and discuss what to adjust." },
    ],
    checklist: [
      "Read-only access to banks and cards",
      "List of suppliers, clients and recurring contracts",
      "Finance system or spreadsheet in use",
      "Payment approval policy",
      "Cash or margin targets, if any",
      "One point of contact in the company",
    ],
    faq: [
      {
        q: "Do you move the company's money?",
        a: "We run finance with the level of access you define. Payments can always depend on your final approval.",
      },
      {
        q: "Do I need to change systems?",
        a: "Not necessarily. We work with what you already use and only suggest changes when the gain is clear.",
      },
      {
        q: "Does BPO replace my accountant?",
        a: "No. They are different, complementary services. Your local accountant keeps the statutory books and tax filings.",
      },
    ],
  }),
  build({
    slug: "cost-management-pricing",
    seoTitle: "Cost Management, Profitability and Pricing | Keystone",
    seoDescription:
      "Product, channel and customer profitability with the RICE™ costing method, break-even analysis and pricing that protects your margin.",
    kicker: "Costs and pricing",
    name: "Cost management and pricing",
    titlePrefix: "Cost management and",
    titleAccent: "pricing",
    heroDescription:
      "Find out which products, channels and customers really make money. The RICE™ method rebuilds your cost structure, shows where the business leaks margin and turns it into prices you can defend.",
    problems: [
      "You don't know the minimum price each product or service needs.",
      "The company grows, but the margin doesn't follow.",
      "Simplified costing may be hiding products or clients that lose money.",
      "Discounts are given without knowing what they cost.",
    ],
    includes: [
      {
        title: "Cost center structure",
        desc: "Expenses reclassified by their real nature, as the base for every analysis.",
      },
      {
        title: "Cost driver mapping",
        desc: "Where the operation spends, and where it wastes without anyone noticing.",
      },
      {
        title: "Profitability by dimension",
        desc: "Real margin by product, channel, customer and business unit.",
      },
      {
        title: "Break-even",
        desc: "How much you need to sell each month to cover all costs.",
      },
      {
        title: "Pricing",
        desc: "Price calculation that accounts for costs, taxes and target margin.",
      },
      {
        title: "Mix decisions",
        desc: "Which products, clients or channels to grow, fix or drop.",
      },
    ],
    steps: [
      { title: "Reclassify", desc: "Cost centers structured and expenses reclassified." },
      { title: "Identify", desc: "Cost drivers mapped and waste made visible." },
      { title: "Cost", desc: "Profitability calculated by product, channel and customer." },
      { title: "Execute", desc: "Pricing and mix adjusted to maximize contribution margin." },
    ],
    checklist: [
      "P&L for the last 12 months",
      "List of fixed and variable costs",
      "Current price list and discount policy",
      "Sales by product, channel and customer",
      "Headcount and cost by role",
      "Margin targets, if any",
    ],
    faq: [
      {
        q: "Is this a one-off project or ongoing?",
        a: "It usually starts as a project and becomes part of the monthly routine, so margins are tracked after prices change.",
      },
      {
        q: "Does it work for service companies?",
        a: "Yes. For services the cost drivers are mostly people and time, and profitability is measured by client and project.",
      },
      {
        q: "What is the RICE™ method?",
        a: "Our cost management framework: Reclassification, Identification, Costing and Execution. See the Methodology page for the details.",
      },
    ],
  }),
];

export function getServiceEn(slug: string) {
  return servicesEn.find((s) => s.slug === slug);
}
