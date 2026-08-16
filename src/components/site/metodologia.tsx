import { Search, Compass, Hammer, LineChart, RefreshCw } from "lucide-react";

const passos = [
  {
    n: "01",
    icon: Search,
    title: "Diagnóstico",
    desc: "Sessão de imersão nos números, processos e rotina de gestão. Saída: mapa de oportunidades e riscos priorizados com impacto estimado em resultado.",
  },
  {
    n: "02",
    icon: Compass,
    title: "Plano de voo",
    desc: "Definimos trilhas, escopo, entregáveis e ritos. Cronograma realista, com responsáveis e prazos.",
  },
  {
    n: "03",
    icon: Hammer,
    title: "Implementação",
    desc: "Construímos o modelo financeiro, painéis e processos. A entrega é sempre board-ready — formato que o C-Level leva para reunião sem reformatar nada.",
  },
  {
    n: "04",
    icon: LineChart,
    title: "Reunião de resultado",
    desc: "Cadência mensal com análise de variações, decisões e plano de ação 30/60/90.",
  },
  {
    n: "05",
    icon: RefreshCw,
    title: "Evolução contínua",
    desc: "Revisamos indicadores, ajustamos premissas e expandimos as trilhas conforme o crescimento e as decisões estratégicas da empresa avançam.",
  },
];

export function Metodologia() {
  return (
    <section id="metodologia" className="bg-muted/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-sm border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Metodologia
            </span>
            <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Um processo previsível, do diagnóstico à decisão.
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">
              Cinco passos que transformam dados dispersos em uma rotina de
              gestão financeira clara, com ritmo e responsabilidades definidas.
            </p>
          </div>

          <ol className="relative space-y-6 border-l border-border pl-8">
            {passos.map(({ n, icon: Icon, title, desc }) => (
              <li key={n} className="relative">
                <span className="absolute -left-[42px] grid h-10 w-10 place-items-center rounded-sm border border-border bg-background text-secondary shadow-[var(--shadow-elegant)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="rounded-sm border border-border bg-card p-6 transition-colors hover:border-secondary/60">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Passo {n}
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
