import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { AiGrowthInsightCard } from "./AiGrowthInsightCard";
import { GrowthScoreCard } from "./GrowthScoreCard";
import { KpiTiles } from "./KpiTiles";
import { NextBestActionsCard } from "./NextBestActionsCard";
import { useCommandCenter, useNextBestActions } from "./useCommandCenter";

/**
 * Primeiro módulo ativo do produto (FASE 3). A primeira tela deve responder
 * em menos de dez segundos "o que está acontecendo com o crescimento" — hoje
 * a resposta honesta é "nada ainda, e é isso que cada bloco explica", porque
 * nenhum módulo de origem (conteúdo, leads, prospecção, pipeline) existe.
 * Ver a nota de projeto na migração `command_center_growth_score.sql`.
 */
export function CommandCenterPage() {
  const commandCenter = useCommandCenter();
  const nextBestActions = useNextBestActions();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Command Center"
        description="O que está acontecendo com o crescimento — Growth Score, pipeline, receita e a próxima ação."
      />

      <QueryState
        isLoading={commandCenter.isLoading}
        isError={commandCenter.isError}
        error={commandCenter.error}
        onRetry={() => commandCenter.refetch()}
      >
        {commandCenter.data && (
          <div className="flex flex-col gap-8">
            <KpiTiles kpis={commandCenter.data.kpis} />
            <GrowthScoreCard growthScore={commandCenter.data.growth_score} />
            <div className="grid gap-6 lg:grid-cols-2">
              <AiGrowthInsightCard />
              <NextBestActionsCard query={nextBestActions} />
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}
