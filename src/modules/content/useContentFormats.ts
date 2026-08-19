import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContentFormat {
  id: string;
  key: string;
  channel: string;
}

export function useContentFormats(): UseQueryResult<ContentFormat[]> {
  return useQuery({
    queryKey: ["content-formats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_formats")
        .select("id, key, channel")
        .eq("is_active", true)
        .order("channel")
        .order("key");
      if (error) throw error;
      return data;
    },
  });
}
