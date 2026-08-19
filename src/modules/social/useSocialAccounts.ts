import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SocialAccount {
  id: string;
  provider: string;
  displayName: string | null;
  status: string;
  scopes: string[];
  /** `null` quando o provedor não informa validade — não é "nunca expira". */
  tokenExpiresAt: string | null;
  lastError: string | null;
  connectedAt: string;
}

export function useSocialAccounts(): UseQueryResult<SocialAccount[]> {
  return useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      // `token_ref` de propósito fora do select: é ponteiro, não segredo, mas
      // não há motivo para trafegá-lo até o navegador.
      const { data, error } = await supabase
        .from("social_accounts")
        .select(
          "id, provider, display_name, status, scopes, token_expires_at, last_error, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((a) => ({
        id: a.id,
        provider: a.provider,
        displayName: a.display_name,
        status: a.status,
        scopes: a.scopes ?? [],
        tokenExpiresAt: a.token_expires_at,
        lastError: a.last_error,
        connectedAt: a.created_at,
      }));
    },
  });
}
