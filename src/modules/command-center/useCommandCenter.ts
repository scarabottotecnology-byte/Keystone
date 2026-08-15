import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Espelha o `jsonb_build_object` de `rpc_command_center()` na migração. */
export interface CommandCenterComponentBreakdown {
  content: number | null;
  leads: number | null;
  prospecting: number | null;
  pipeline: number | null;
  conversion: number | null;
  revenue: number | null;
}

export interface CommandCenterSnapshot {
  snapshot_date: string;
  total_score: number | null;
  components: Record<string, unknown>;
}

export interface CommandCenterPayload {
  organization_id: string;
  generated_at: string;
  growth_score: {
    weights: CommandCenterComponentBreakdown;
    targets: CommandCenterComponentBreakdown;
    raw: CommandCenterComponentBreakdown;
    latest_snapshot: CommandCenterSnapshot | null;
    previous_snapshot: CommandCenterSnapshot | null;
  };
  kpis: {
    pipeline_value: number | null;
    pipeline_value_previous_period: number | null;
    leads_generated: number | null;
    leads_generated_previous_period: number | null;
    revenue_closed: number | null;
    revenue_closed_previous_period: number | null;
  };
}

export interface NextBestAction {
  id: string;
  title: string;
  reason: string;
  impact?: string;
}

/**
 * Uma chamada de rede, um RPC — critério de aceite da FASE 3. A agregação
 * inteira roda no Postgres; o que este hook faz é buscar o já-agregado e
 * entregar tipado.
 */
export function useCommandCenter(): UseQueryResult<CommandCenterPayload> {
  return useQuery({
    queryKey: ["command-center"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_command_center");
      if (error) throw error;
      return data as unknown as CommandCenterPayload;
    },
  });
}

export function useNextBestActions(): UseQueryResult<NextBestAction[]> {
  return useQuery({
    queryKey: ["next-best-actions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_next_best_actions");
      if (error) throw error;
      return (data as unknown as NextBestAction[]) ?? [];
    },
  });
}
