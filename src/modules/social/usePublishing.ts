import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublishingJob {
  id: string;
  runAt: string;
  status: string;
  attempt: number;
  maxAttempts: number;
  lastError: string | null;
  lockedBy: string | null;
  assetHeadline: string | null;
}

export function usePublishingJobs(): UseQueryResult<PublishingJob[]> {
  return useQuery({
    queryKey: ["publishing-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishing_jobs")
        .select(
          "id, run_at, status, attempt, max_attempts, last_error, locked_by, content_assets(headline)",
        )
        .order("run_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data.map((j) => ({
        id: j.id,
        runAt: j.run_at,
        status: j.status,
        attempt: j.attempt,
        maxAttempts: j.max_attempts,
        lastError: j.last_error,
        lockedBy: j.locked_by,
        assetHeadline: j.content_assets?.headline ?? null,
      }));
    },
  });
}

export interface SocialPost {
  id: string;
  channel: string;
  status: string;
  externalPostId: string | null;
  permalink: string | null;
  publishedAt: string | null;
  error: string | null;
  assetHeadline: string | null;
}

export function useSocialPosts(): UseQueryResult<SocialPost[]> {
  return useQuery({
    queryKey: ["social-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select(
          "id, channel, status, external_post_id, permalink, published_at, error, content_assets(headline)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((p) => ({
        id: p.id,
        channel: p.channel,
        status: p.status,
        externalPostId: p.external_post_id,
        permalink: p.permalink,
        publishedAt: p.published_at,
        error: p.error,
        assetHeadline: p.content_assets?.headline ?? null,
      }));
    },
  });
}
