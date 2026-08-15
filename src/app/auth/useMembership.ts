import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { useAuth } from "./AuthProvider";

export interface Membership {
  organizationId: string;
  role: Enums<"org_role">;
}

/**
 * O vínculo ativo do usuário logado com a organização.
 *
 * A política `tenant_select` de `memberships` mostra todo mundo da mesma
 * organização — é o que a tela de equipe precisa —, então esta consulta
 * filtra por `user_id` explicitamente para achar só a própria linha, em vez
 * de depender da RLS para isso.
 *
 * `null` de volta (sem erro) é o estado real de quem tem conta mas nenhum
 * admin ainda concedeu vínculo — ver `PendingAccessScreen`. Não é falha, é
 * um estado do sistema que a tela precisa distinguir de "carregando" e de
 * "erro de rede".
 */
export function useMembership(): UseQueryResult<Membership | null> {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["membership", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("organization_id, role")
        .eq("user_id", userId as string)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return { organizationId: data.organization_id, role: data.role };
    },
    enabled: !!userId,
  });
}
