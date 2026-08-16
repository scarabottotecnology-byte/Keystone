import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  observedAt: string;
  relevance: number | null;
  category: string | null;
  commercialPotential: number | null;
  recommendation: string | null;
  status: string;
}

export function useInsights(): UseQueryResult<Insight[]> {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_insights")
        .select(
          "id, type, title, description, source, source_url, observed_at, relevance, category, commercial_potential, recommendation, status",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        source: i.source,
        sourceUrl: i.source_url,
        observedAt: i.observed_at,
        relevance: i.relevance,
        category: i.category,
        commercialPotential: i.commercial_potential,
        recommendation: i.recommendation,
        status: i.status,
      }));
    },
  });
}
