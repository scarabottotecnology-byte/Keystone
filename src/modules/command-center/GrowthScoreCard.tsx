import type { LucideIcon } from "lucide-react";
import {
  Handshake,
  LineChart,
  Megaphone,
  PenLine,
  Radar,
  Wallet,
} from "lucide-react";
import { computeGrowthScore, type GrowthScoreComponentInput } from "./growthScore";
import type { CommandCenterPayload } from "./useCommandCenter";

const COMPONENT_META: Record<
  keyof CommandCenterPayload["growth_score"]["weights"],
  { label: string; phase: number; icon: LucideIcon }
> = {
  content: { label: "Content Performance", phase: 5, icon: PenLine },
  leads: { label: "Lead Generation", phase: 10, icon: Megaphone },
  prospecting: { label: "Prospecting", phase: 12, icon: Radar },
  pipeline: { label: "Pipeline", phase: 17, icon: Handshake },
  conversion: { label: "Conversion", phase: 17, icon: LineChart },
  revenue: { label: "Revenue", phase: 17, icon: Wallet },
};

const COMPONENT_ORDER = Object.keys(COMPONENT_META) as Array<
  keyof CommandCenterPayload["growth_score"]["weights"]
>;

export function GrowthScoreCard({
  growthScore,
}: {
  growthScore: CommandCenterPayload["growth_score"];
}) {
  const inputs: GrowthScoreComponentInput[] = COMPONENT_ORDER.map((key) => ({
    key,
    weight: growthScore.weights[key],
    raw: growthScore.raw[key],
    baseline: growthScore.targets[key],
  }));

  const { components, totalScore } = computeGrowthScore(inputs);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border p-6">
        <div className="flex flex-col gap-1">
          <span className="label-caps">Growth Score</span>
          {totalScore === null ? (
            <>
              <span className="numeric text-4xl font-semibold tabular-nums text-muted-foreground">
                —
              </span>
              <p className="max-w-[46ch] text-sm text-muted-foreground">
                Aparece quando os seis componentes abaixo tiverem dado. Até lá, um
                número composto seria calculado sobre uma base incompleta — mais
                confuso que nenhum número.
              </p>
            </>
          ) : (
            <span className="numeric text-4xl font-semibold tabular-nums">
              {Math.round(totalScore)}
              <span className="text-lg text-muted-foreground">/100</span>
            </span>
          )}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {components.map((component) => {
          const meta = COMPONENT_META[component.key as keyof typeof COMPONENT_META];
          const Icon = meta.icon;
          return (
            <li key={component.key} className="flex items-center gap-4 px-6 py-4">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-primary"
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{meta.label}</span>
                <span className="text-xs text-muted-foreground">
                  peso {component.weight}
                </span>
              </div>
              {component.available ? (
                <span className="numeric text-lg font-semibold tabular-nums">
                  {Math.round(component.normalized as number)}
                </span>
              ) : (
                <span className="shrink-0 rounded border border-border px-2 py-1 font-mono text-[0.68rem] text-muted-foreground">
                  sem dado — fase {meta.phase}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
