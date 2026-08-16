import { PageHeader } from "@/components/shared/PageHeader";
import { EditorialStrategySection } from "./EditorialStrategySection";
import { InsightsFeed } from "./InsightsFeed";

export function IntelligencePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Intelligence"
        description="Descobrir oportunidade de mercado antes de produzir conteúdo — pilares, regras de distribuição e o feed do agente A1."
      />

      <EditorialStrategySection />
      <InsightsFeed />
    </div>
  );
}
