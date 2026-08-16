import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContentPillar {
  id: string;
  name: string;
  slug: string;
  weight: number;
  isActive: boolean;
}

export function useContentPillars(): UseQueryResult<ContentPillar[]> {
  return useQuery({
    queryKey: ["content-pillars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_pillars")
        .select("id, name, slug, weight, is_active")
        .order("name");
      if (error) throw error;
      return data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        weight: p.weight,
        isActive: p.is_active,
      }));
    },
  });
}
