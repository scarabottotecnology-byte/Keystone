import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/shared/QueryState";
import { GenerateIdeaDialog } from "./GenerateIdeaDialog";
import { useInsights } from "./useInsights";

const TYPE_LABELS: Record<string, string> = {
  trend: "Tendência",
  pain: "Dor",
  question: "Pergunta",
  economic: "Econômico",
  opportunity: "Oportunidade",
};

function ScoreBadge({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">
        {label}: <span className="italic">sem nota</span>
      </span>
    );
  }
  return (
    <span className="numeric text-xs text-muted-foreground">
      {label}: <span className="font-medium text-foreground">{value}</span>/100
    </span>
  );
}

export function InsightsFeed() {
  const insights = useInsights();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Market Intelligence</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Insights gerados pelo agente A1 a partir das fontes configuradas — cada um com
          fonte rastreável, nunca fabricado.
        </p>
      </div>

      <div className="p-6">
        <QueryState
          isLoading={insights.isLoading}
          isError={insights.isError}
          error={insights.error}
          isEmpty={insights.data?.length === 0}
          onRetry={() => insights.refetch()}
          emptyTitle="Nenhum insight ainda"
          emptyDescription="O agente A1 roda às 06:00 em dias úteis (WF-015) sobre as fontes configuradas em Market Intelligence Sources. Sem fonte ativa, não há o que analisar — cadastre ao menos uma para o feed começar a preencher."
        >
          <ul className="flex flex-col gap-4">
            {insights.data?.map((insight) => (
              <li key={insight.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{TYPE_LABELS[insight.type] ?? insight.type}</Badge>
                      {insight.category && (
                        <span className="text-xs text-muted-foreground">{insight.category}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold">{insight.title}</h3>
                  </div>
                  <GenerateIdeaDialog
                    insightId={insight.id}
                    insightTitle={insight.title}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Sparkles className="size-4" />
                        Gerar ideia
                      </Button>
                    }
                  />
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{insight.description}</p>

                {insight.recommendation && (
                  <p className="mt-2 text-sm">
                    <span className="label-caps">Recomendação </span>
                    {insight.recommendation}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <ScoreBadge label="Relevância" value={insight.relevance} />
                  <ScoreBadge label="Potencial comercial" value={insight.commercialPotential} />
                  <a
                    href={insight.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline underline-offset-4"
                  >
                    {insight.source}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  );
}
