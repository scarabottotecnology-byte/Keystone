import type { LucideIcon } from "lucide-react";
import { Handshake, TrendingUp, Wallet } from "lucide-react";
import type { CommandCenterPayload } from "./useCommandCenter";

interface KpiDefinition {
  key: keyof CommandCenterPayload["kpis"];
  previousKey: keyof CommandCenterPayload["kpis"];
  label: string;
  icon: LucideIcon;
  phase: number;
  format: (value: number) => string;
}

const CURRENCY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const KPIS: KpiDefinition[] = [
  {
    key: "pipeline_value",
    previousKey: "pipeline_value_previous_period",
    label: "Pipeline gerado",
    icon: Handshake,
    phase: 17,
    format: (v) => CURRENCY.format(v),
  },
  {
    key: "leads_generated",
    previousKey: "leads_generated_previous_period",
    label: "Leads gerados",
    icon: TrendingUp,
    phase: 10,
    format: (v) => v.toLocaleString("pt-BR"),
  },
  {
    key: "revenue_closed",
    previousKey: "revenue_closed_previous_period",
    label: "Receita fechada",
    icon: Wallet,
    phase: 17,
    format: (v) => CURRENCY.format(v),
  },
];

function Delta({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) {
    return <span className="text-xs text-muted-foreground">sem período anterior</span>;
  }
  const diff = current - previous;
  if (diff === 0) {
    return <span className="text-xs text-muted-foreground">estável</span>;
  }
  const positive = diff > 0;
  const pct = previous !== 0 ? Math.abs((diff / previous) * 100) : null;
  return (
    <span className={`text-xs font-medium ${positive ? "text-positive" : "text-negative"}`}>
      {positive ? "▲" : "▼"} {pct === null ? "—" : `${pct.toFixed(0)}%`} vs. período anterior
    </span>
  );
}

export function KpiTiles({ kpis }: { kpis: CommandCenterPayload["kpis"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {KPIS.map((kpi) => {
        const Icon = kpi.icon;
        const value = kpis[kpi.key];
        const previous = kpis[kpi.previousKey];
        return (
          <div key={kpi.key} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
              <span className="label-caps">{kpi.label}</span>
            </div>
            {value === null ? (
              <>
                <span className="numeric text-2xl font-semibold tabular-nums text-muted-foreground">—</span>
                <span className="text-xs text-muted-foreground">
                  sem dado — chega na fase {kpi.phase}
                </span>
              </>
            ) : (
              <>
                <span className="numeric text-2xl font-semibold tabular-nums">
                  {kpi.format(value)}
                </span>
                <Delta current={value} previous={previous} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
