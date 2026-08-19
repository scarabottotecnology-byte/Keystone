import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContentReview {
  score: number;
  dimensions: Record<string, number>;
  issues: { severity: string; description: string }[];
  suggestions: string | null;
  createdAt: string;
}

export interface GroundedReference {
  chunk_id: string;
  document_id: string | null;
  document_title: string | null;
}

export interface ContentAsset {
  id: string;
  headline: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string[];
  visualBrief: string | null;
  channel: string;
  status: string;
  aiGenerated: boolean;
  groundedOn: GroundedReference[];
  createdAt: string;
  /** A revisão mais recente (A4 pode rodar mais de uma vez por peça). `null` quando A4 falhou ou ainda não rodou. */
  review: ContentReview | null;
}

interface RawReview {
  score: number;
  dimensions: Record<string, number> | null;
  issues: { severity: string; description: string }[] | null;
  suggestions: string | null;
  created_at: string;
}

export function useContentAssets(): UseQueryResult<ContentAsset[]> {
  return useQuery({
    queryKey: ["content-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_assets")
        .select(
          "id, headline, hook, body, cta, hashtags, visual_brief, channel, status, ai_generated, grounded_on, created_at, content_reviews(score, dimensions, issues, suggestions, created_at)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((asset) => {
        const reviews = (asset.content_reviews ?? []) as RawReview[];
        const latest = reviews.length > 0
          ? [...reviews].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
          : null;
        return {
          id: asset.id,
          headline: asset.headline,
          hook: asset.hook,
          body: asset.body,
          cta: asset.cta,
          hashtags: asset.hashtags ?? [],
          visualBrief: asset.visual_brief,
          channel: asset.channel,
          status: asset.status,
          aiGenerated: asset.ai_generated,
          groundedOn: (asset.grounded_on as unknown as GroundedReference[]) ?? [],
          createdAt: asset.created_at,
          review: latest
            ? {
              score: latest.score,
              dimensions: latest.dimensions ?? {},
              issues: latest.issues ?? [],
              suggestions: latest.suggestions,
              createdAt: latest.created_at,
            }
            : null,
        };
      });
    },
  });
}
