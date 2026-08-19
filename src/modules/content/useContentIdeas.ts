import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContentIdea {
  id: string;
  title: string;
  angle: string | null;
  hook: string | null;
  rationale: string | null;
  intent: string | null;
  status: string;
  pillarName: string | null;
}

export function useContentIdeas(): UseQueryResult<ContentIdea[]> {
  return useQuery({
    queryKey: ["content-ideas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_ideas")
        .select("id, title, angle, hook, rationale, intent, status, content_pillars(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((idea) => ({
        id: idea.id,
        title: idea.title,
        angle: idea.angle,
        hook: idea.hook,
        rationale: idea.rationale,
        intent: idea.intent,
        status: idea.status,
        pillarName: idea.content_pillars?.name ?? null,
      }));
    },
  });
}
