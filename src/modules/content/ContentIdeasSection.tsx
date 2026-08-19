import { Lightbulb, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/shared/QueryState";
import { GeneratePieceDialog } from "./GeneratePieceDialog";
import { useContentIdeas } from "./useContentIdeas";

const INTENT_LABELS: Record<string, string> = {
  educacao: "Educação",
  dor: "Dor",
  case: "Case",
  insight: "Insight",
  comercial: "Comercial",
};

export function ContentIdeasSection() {
  const ideas = useContentIdeas();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Ideias</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Geradas pelo agente A2 em Intelligence, a partir de um insight ou de um pilar — cada
          uma pode virar uma peça de conteúdo real através do A3.
        </p>
      </div>

      <div className="p-6">
        <QueryState
          isLoading={ideas.isLoading}
          isError={ideas.isError}
          error={ideas.error}
          isEmpty={ideas.data?.length === 0}
          onRetry={() => ideas.refetch()}
          emptyTitle="Nenhuma ideia ainda"
          emptyDescription="Gere uma ideia a partir de um insight em Intelligence — ela aparece aqui, pronta para virar peça."
        >
          <ul className="flex flex-col gap-4">
            {ideas.data?.map((idea) => (
              <li key={idea.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {idea.pillarName && <Badge variant="outline">{idea.pillarName}</Badge>}
                      {idea.intent && (
                        <span className="text-xs text-muted-foreground">
                          {INTENT_LABELS[idea.intent] ?? idea.intent}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold">{idea.title}</h3>
                  </div>
                  <GeneratePieceDialog
                    ideaId={idea.id}
                    ideaTitle={idea.title}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Wand2 className="size-4" />
                        Gerar peça
                      </Button>
                    }
                  />
                </div>

                {idea.angle && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="label-caps">Ângulo </span>
                    {idea.angle}
                  </p>
                )}
                {idea.hook && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="label-caps">Hook </span>
                    {idea.hook}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  );
}
