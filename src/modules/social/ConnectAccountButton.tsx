import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Loader2 } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { extractMessage } from "@/components/shared/QueryState";
import { supabase } from "@/integrations/supabase/client";

async function extractFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error?.message === "string") return body.error.message;
    } catch {
      // corpo não é JSON — cai no fallback abaixo
    }
  }
  return extractMessage(error);
}

/**
 * Inicia o OAuth do LinkedIn.
 *
 * `oauth-start` devolve a URL em JSON e a navegação acontece aqui, com
 * `window.location.assign`. Um 302 do lado da função seria seguido pelo
 * `fetch` interno do `functions.invoke` — o navegador buscaria a página de
 * consentimento por XHR em vez de navegar até ela, e o usuário ficaria
 * olhando para uma tela parada.
 */
export function ConnectAccountButton() {
  const connect = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("oauth-start", {
        body: { provider: "linkedin" },
      });
      if (error) throw new Error(await extractFunctionError(error));
      const url = (data as { authorize_url?: string })?.authorize_url;
      if (!url) throw new Error("Resposta sem URL de autorização");
      return url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (error) => {
      toast.error("Não foi possível iniciar a conexão", {
        description: extractMessage(error),
      });
    },
  });

  return (
    <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
      {connect.isPending
        ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        : <Link2 className="size-4" aria-hidden="true" />}
      Conectar LinkedIn
    </Button>
  );
}
