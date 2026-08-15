import { ListChecks } from "lucide-react";
import { QueryState } from "@/components/shared/QueryState";
import type { NextBestAction } from "./useCommandCenter";
import type { UseQueryResult } from "@tanstack/react-query";

/**
 * `rpc_next_best_actions()` é consulta determinística, não a IA — o agente A9
 * chega na FASE 19 e só então escreve a justificativa em cima desta mesma
 * lista (documento 12, FASE 3, subtarefa 6).
 */
export function NextBestActionsCard({
  query,
}: {
  query: UseQueryResult<NextBestAction[]>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Next Best Action</h2>
      </div>
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={query.data?.length === 0}
        onRetry={() => query.refetch()}
        emptyTitle="Nenhuma ação recomendada ainda"
        emptyDescription="A consulta é determinística sobre lead, prospect, conteúdo e pipeline — nenhuma dessas fontes existe nesta fase. Assim que a primeira nascer (Leads, FASE 10), esta lista passa a priorizar de verdade."
      >
        <ul className="flex flex-col gap-3">
          {query.data?.map((action) => (
            <li key={action.id} className="rounded-md border border-border p-3">
              <p className="text-sm font-medium">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.reason}</p>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
