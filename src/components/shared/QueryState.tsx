import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Extrai uma mensagem legível de um erro.
 *
 * Não basta checar `instanceof Error`: o cliente Supabase rejeita com objetos
 * simples no formato `{ message, code, details }`, que não herdam de Error.
 * Tratar só o caso `Error` faz toda falha de banco aparecer como
 * "erro desconhecido", que é a pior mensagem possível — some com a única
 * informação útil para diagnosticar.
 */
export function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const { message } = error as { message: unknown };
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  return "Erro sem mensagem. Verifique o console do navegador.";
}

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  /** Verdadeiro quando a consulta teve sucesso mas não trouxe linha nenhuma. */
  isEmpty?: boolean;
  onRetry?: () => void;
  /** Texto do estado vazio. Deve dizer o que fazer, não pedir desculpas. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
}

/**
 * Envelopa uma tela que depende de consulta ao servidor e garante os três
 * estados obrigatórios: carregando, erro e vazio.
 *
 * Existe porque o módulo de custos exibia "Carregando..." indefinidamente
 * quando o banco não respondia — o usuário não tinha como distinguir consulta
 * lenta de falha de conexão, e não havia caminho de recuperação.
 */
export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty = false,
  onRetry,
  emptyTitle = "Nenhum dado ainda",
  emptyDescription,
  emptyAction,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Carregando dados…
        </span>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-md" />
      </div>
    );
  }

  if (isError) {
    const message = extractMessage(error);
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-md border border-negative/40 bg-negative/5 p-6"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-negative">
          <AlertTriangle className="size-4" aria-hidden="true" />
          Não foi possível carregar os dados
        </span>
        <p className="max-w-[64ch] text-sm text-muted-foreground">
          A consulta ao banco falhou. Verifique a conexão e tente novamente. Se
          persistir, o problema está no servidor, não nos seus dados — nada foi
          alterado.
        </p>
        <code className="max-w-full overflow-x-auto rounded border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          {message}
        </code>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border p-8">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Inbox className="size-4 text-muted-foreground" aria-hidden="true" />
          {emptyTitle}
        </span>
        {emptyDescription && (
          <p className="max-w-[64ch] text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        )}
        {emptyAction}
      </div>
    );
  }

  return <>{children}</>;
}
