import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { QueryState } from "@/components/shared/QueryState";
import { useAuth } from "./AuthProvider";
import { useMembership } from "./useMembership";
import { PendingAccessScreen } from "./PendingAccessScreen";

function FullScreenSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground"
      role="status"
      aria-busy="true"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      Carregando…
    </div>
  );
}

/**
 * Fecha três portas antes de deixar entrar: sem sessão, sem vínculo ativo, ou
 * a própria consulta do vínculo falhou. As três merecem tela diferente — sem
 * sessão é redirecionamento silencioso (é o fluxo esperado), sem vínculo é
 * `PendingAccessScreen`, e falha de consulta usa o mesmo `QueryState` do
 * resto do produto em vez de inventar um terceiro jeito de mostrar erro.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const location = useLocation();
  const membership = useMembership();

  if (authLoading) return <FullScreenSpinner />;

  if (!session) {
    return <Navigate to="/entrar" replace state={{ from: location }} />;
  }

  if (membership.isLoading) return <FullScreenSpinner />;

  if (membership.isError) {
    return (
      <div className="p-6">
        <QueryState
          isLoading={false}
          isError
          error={membership.error}
          onRetry={() => membership.refetch()}
        >
          {null}
        </QueryState>
      </div>
    );
  }

  if (!membership.data) return <PendingAccessScreen />;

  return <>{children}</>;
}
