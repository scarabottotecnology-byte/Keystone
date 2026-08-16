import { CalendarClock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QueryState } from "@/components/shared/QueryState";
import { useContentPillars } from "./useContentPillars";
import { useCalendarRules, type CalendarRule } from "./useCalendarRules";

const WEEKDAY_LABELS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const INTENT_LABELS: Record<string, string> = {
  educacao: "Educação",
  dor: "Dor",
  case: "Case",
  insight: "Insight",
  comercial: "Comercial",
};

function RuleRow({ rule }: { rule: CalendarRule }) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
      <span className="w-20 shrink-0 text-sm font-medium capitalize">
        {WEEKDAY_LABELS[rule.weekday]}
      </span>
      <span className="numeric text-xs text-muted-foreground">{rule.slotTime}</span>
      <Badge variant="outline" className="capitalize">{rule.channel}</Badge>
      {rule.intent && (
        <Badge variant="outline">{INTENT_LABELS[rule.intent] ?? rule.intent}</Badge>
      )}
      <span className="text-xs text-muted-foreground">
        {rule.pillarName ?? "pilar escolhido na geração"}
      </span>
    </li>
  );
}

/**
 * Estratégia editorial (documento 12, FASE 4, subtarefa 8) — pilares e
 * regras de distribuição. Sem editor ainda: hoje é leitura do que a
 * migração semeou (os 13 pilares e as cinco regras semanais). Criar,
 * editar e desativar pelo cliente fica para quando a tela crescer além
 * do que a FASE 4 pede — os dados já têm política de escrita
 * (`operator_insert`/`operator_update`) prontas para quando isso acontecer.
 */
export function EditorialStrategySection() {
  const pillars = useContentPillars();
  const rules = useCalendarRules();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-6">
          <Layers className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Pilares de conteúdo</h2>
        </div>
        <div className="p-6">
          <QueryState
            isLoading={pillars.isLoading}
            isError={pillars.isError}
            error={pillars.error}
            isEmpty={pillars.data?.length === 0}
            onRetry={() => pillars.refetch()}
            emptyTitle="Nenhum pilar cadastrado"
          >
            <ul className="flex flex-wrap gap-2">
              {pillars.data?.map((pillar) => (
                <Badge key={pillar.id} variant={pillar.isActive ? "default" : "outline"}>
                  {pillar.name}
                </Badge>
              ))}
            </ul>
          </QueryState>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-6">
          <CalendarClock className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Regras de distribuição semanal</h2>
        </div>
        <div className="p-6">
          <QueryState
            isLoading={rules.isLoading}
            isError={rules.isError}
            error={rules.error}
            isEmpty={rules.data?.length === 0}
            onRetry={() => rules.refetch()}
            emptyTitle="Nenhuma regra cadastrada"
          >
            <ul>
              {rules.data?.map((rule) => <RuleRow key={rule.id} rule={rule} />)}
            </ul>
          </QueryState>
        </div>
      </div>
    </div>
  );
}
