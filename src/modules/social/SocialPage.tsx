import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, History, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { ConnectAccountButton } from "./ConnectAccountButton";
import { useSocialAccounts } from "./useSocialAccounts";
import { usePublishingJobs, useSocialPosts } from "./usePublishing";

const ACCOUNT_STATUS: Record<string, { label: string; tone: string }> = {
  connected: { label: "Conectada", tone: "text-positive" },
  expiring: { label: "Token vencendo", tone: "text-warning" },
  expired: { label: "Token vencido", tone: "text-negative" },
  revoked: { label: "Revogada", tone: "text-negative" },
  error: { label: "Com erro", tone: "text-negative" },
};

const JOB_STATUS: Record<string, string> = {
  pending: "Na fila",
  locked: "Em execução",
  running: "Em execução",
  succeeded: "Publicado",
  failed: "Falhou",
  cancelled: "Cancelado",
  skipped: "Pulado",
};

function whenLabel(iso: string): string {
  return format(new Date(iso), "d 'de' MMM, HH:mm", { locale: ptBR });
}

/**
 * Traduz o retorno do `oauth-callback`, que chega como query string porque o
 * callback vem do LinkedIn por redirect, não por XHR — não há como devolver
 * um toast direto de lá.
 */
function useOAuthResultToast() {
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const result = params.get("social");
    if (!result) return;

    if (result === "ok") {
      toast.success("Conta do LinkedIn conectada");
    } else {
      toast.error("A conexão não foi concluída", {
        description: params.get("motivo") ?? undefined,
      });
    }

    // Limpa a query para o toast não repetir a cada re-render ou refresh.
    params.delete("social");
    params.delete("motivo");
    setParams(params, { replace: true });
  }, [params, setParams]);
}

function AccountsSection() {
  const accounts = useSocialAccounts();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Share2 className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Contas conectadas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            O token vive fora do alcance do navegador, num schema que a API não
            expõe — aqui aparece só a saúde da conexão.
          </p>
        </div>
        <ConnectAccountButton />
      </div>

      <div className="p-6">
        <QueryState
          isLoading={accounts.isLoading}
          isError={accounts.isError}
          error={accounts.error}
          isEmpty={accounts.data?.length === 0}
          onRetry={() => accounts.refetch()}
          emptyTitle="Nenhuma conta conectada"
          emptyDescription="Conecte a página da empresa no LinkedIn para que as peças aprovadas possam ser publicadas automaticamente."
        >
          <ul className="flex flex-col gap-3">
            {accounts.data?.map((account) => {
              const status = ACCOUNT_STATUS[account.status] ??
                { label: account.status, tone: "text-muted-foreground" };
              return (
                <li
                  key={account.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {account.displayName ?? account.provider}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {account.tokenExpiresAt
                        ? `Token válido até ${whenLabel(account.tokenExpiresAt)}`
                        : "O provedor não informou validade para este token"}
                    </span>
                    {account.lastError && (
                      <span className="text-xs text-negative">{account.lastError}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${status.tone}`}>
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </QueryState>
      </div>
    </div>
  );
}

function QueueSection() {
  const jobs = usePublishingJobs();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Fila de publicação</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          O WF-002 percorre esta fila a cada 15 minutos e publica o que já
          venceu — um job que falha volta sozinho na execução seguinte.
        </p>
      </div>

      <div className="p-6">
        <QueryState
          isLoading={jobs.isLoading}
          isError={jobs.isError}
          error={jobs.error}
          isEmpty={jobs.data?.length === 0}
          onRetry={() => jobs.refetch()}
          emptyTitle="Fila vazia"
          emptyDescription="Nenhuma peça agendada para publicação. Agende uma peça aprovada no calendário para que ela entre aqui."
        >
          <ul className="flex flex-col gap-3">
            {jobs.data?.map((job) => (
              <li key={job.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {job.assetHeadline ?? "(peça sem headline)"}
                  </span>
                  <Badge variant="outline">
                    {JOB_STATUS[job.status] ?? job.status}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{whenLabel(job.runAt)}</span>
                  <span className="numeric">
                    Tentativa {job.attempt}/{job.maxAttempts}
                  </span>
                  {job.lockedBy && <span>Em execução por {job.lockedBy}</span>}
                </div>
                {job.lastError && (
                  <p className="mt-2 text-xs text-negative">{job.lastError}</p>
                )}
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  );
}

function HistorySection() {
  const posts = useSocialPosts();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border p-6">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Histórico</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Toda publicação com o identificador que a plataforma devolveu — é o
          que liga a peça ao resultado que a FASE 8 vai medir.
        </p>
      </div>

      <div className="p-6">
        <QueryState
          isLoading={posts.isLoading}
          isError={posts.isError}
          error={posts.error}
          isEmpty={posts.data?.length === 0}
          onRetry={() => posts.refetch()}
          emptyTitle="Nada publicado ainda"
          emptyDescription="Quando a primeira peça for publicada, ela aparece aqui com o link direto para o post."
        >
          <ul className="flex flex-col gap-3">
            {posts.data?.map((post) => (
              <li key={post.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {post.assetHeadline ?? "(peça sem headline)"}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {post.channel}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {post.publishedAt
                      ? whenLabel(post.publishedAt)
                      : "ainda não publicado"}
                  </span>
                  {post.permalink && (
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      ver no LinkedIn
                    </a>
                  )}
                </div>
                {post.error && (
                  <p className="mt-2 text-xs text-negative">{post.error}</p>
                )}
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </div>
  );
}

export function SocialPage() {
  useOAuthResultToast();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Social"
        description="Publicar no LinkedIn sem duplicar e sem falhar em silêncio — contas conectadas, fila e histórico."
      />
      <AccountsSection />
      <QueueSection />
      <HistorySection />
    </div>
  );
}
