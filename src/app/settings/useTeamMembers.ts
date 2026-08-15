import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

export interface TeamMember {
  id: string;
  userId: string;
  role: Enums<"org_role">;
  status: Enums<"membership_status">;
  createdAt: string;
  /** `null` é estado real, não erro: convite ainda não teve o primeiro acesso. */
  fullName: string | null;
}

/**
 * `memberships` e `profiles` não têm chave estrangeira entre si — ambas
 * apontam para `auth.users`, mas não uma para a outra —, então o PostgREST
 * não consegue fazer o embed automático. Daqui vêm duas consultas e um merge
 * no cliente, em vez de um único `select` aninhado.
 */
export function useTeamMembers(): UseQueryResult<TeamMember[]> {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from("memberships")
        .select("id, user_id, role, status, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = memberships.map((m) => m.user_id);
      const { data: profiles, error: profilesError } = userIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] as { id: string; full_name: string | null }[], error: null };
      if (profilesError) throw profilesError;

      const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));

      return memberships.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        status: m.status,
        createdAt: m.created_at,
        fullName: nameById.get(m.user_id) ?? null,
      }));
    },
  });
}
