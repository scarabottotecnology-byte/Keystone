import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryState, extractMessage } from "@/components/shared/QueryState";
import { useAuth } from "@/app/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useContentAssets, type ContentAsset } from "./useContentAssets";
import { ScheduleButton } from "./ScheduleButton";

/**
 * Padrão: "abaixo do limiar configurado (padrão: 70)" (docs/05 §4). Ainda
 * não há tela de configuração para este número — fica fixo aqui até
 * existir, mesmo racional de `slot_time`/`channel` na seed da FASE 4.
 */
const APPROVAL_THRESHOLD = 70;

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  approved: "Aprovada",
  scheduled: "Agendada",
  published: "Publicada",
  failed: "Falhou",
  cancelled: "Cancelada",
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="text-xs text-muted-foreground">
        Revisão: <span className="italic">indisponível</span>
      </span>
    );
  }
  return (
    <span className="numeric text-xs text-muted-foreground">
      Score: <span className="font-medium text-foreground">{score}</span>/100
    </span>
  );
}

function ApproveButton({ asset }: { asset: ContentAsset }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const approve = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("content_assets")
        .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() })
        .eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Peça aprovada");
      queryClient.invalidateQueries({ queryKey: ["content-assets"] });
    },
    onError: (error) => {
      toast.error("Não foi possível aprovar", { description: extractMessage(error) });
    },
  });

  if (asset.status !== "review") return null;

  const blockedByScore = asset.review !== null && asset.review.score < APPROVAL_THRESHOLD;
  const blockedByMissingReview = asset.review === null;

  if (blockedByScore) {
    return (
      <p className="text-xs text-negative">
        Score abaixo de {APPROVAL_THRESHOLD} — aprovação bloqueada.{" "}
        {asset.review?.suggestions && <span className="text-muted-foreground">{asset.review.suggestions}</span>}
      </p>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={approve.isPending || blockedByMissingReview}
      onClick={() => approve.mutate()}
      title={blockedByMissingReview ? "Sem revisão automática — aprovação manual pendente" : undefined}
    >
      <CheckCircle2 className="size-4" />
      Aprovar
    </Button>
  );
}

export function ContentLibrary() {
  const assets = useContentAssets();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border p-6">
        <div className="flex items-center gap-2">
          <Library className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Biblioteca de conteúdo</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Peças geradas pelo A3, com a revisão do A4 — score abaixo de {APPROVAL_THRESHOLD}
          {" "}bloqueia aprovação e mostra a sugestão.
        </p>
      </div>

      <div className="p-6">
        <QueryState
          isLoading={assets.isLoading}
          isError={assets.isError}
          error={assets.error}
          isEmpty={assets.data?.length === 0}
          onRetry={() => assets.refetch()}
          emptyTitle="Nenhuma peça ainda"
          emptyDescription="Gere uma peça a partir de uma ideia acima — ela aparece aqui com o score do A4."
        >
          <ul className="flex flex-col gap-4">
            {assets.data?.map((asset) => (
              <li key={asset.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{asset.channel}</Badge>
                      <Badge>{STATUS_LABELS[asset.status] ?? asset.status}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold">{asset.headline ?? "(sem headline)"}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApproveButton asset={asset} />
                    <ScheduleButton asset={asset} />
                  </div>
                </div>

                {asset.hook && <p className="mt-2 text-sm font-medium">{asset.hook}</p>}
                {asset.body && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{asset.body}</p>}
                {asset.cta && (
                  <p className="mt-2 text-sm">
                    <span className="label-caps">CTA </span>
                    {asset.cta}
                  </p>
                )}
                {asset.visualBrief && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="label-caps">Briefing visual </span>
                    {asset.visualBrief}
                  </p>
                )}

                {asset.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {asset.hashtags.map((tag) => (
                      <span key={tag} className="text-xs text-primary">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <ScoreBadge score={asset.review?.score ?? null} />
                  <span className="text-xs text-muted-foreground">
                    Fundamentação: {asset.groundedOn.length > 0
                      ? `${asset.groundedOn.length} trecho(s) da base de conhecimento`
                      : "nenhuma (sem contexto disponível na geração)"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  );
}
