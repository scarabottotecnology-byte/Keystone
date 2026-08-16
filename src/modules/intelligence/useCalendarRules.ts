import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarRule {
  id: string;
  weekday: number;
  slotTime: string;
  channel: string;
  intent: string | null;
  pillarName: string | null;
  isActive: boolean;
}

/**
 * `pillar_id` referencia `content_pillars` de verdade (mesma migração) — o
 * embed do PostgREST funciona aqui, diferente do caso `memberships`/
 * `profiles` da FASE 2, que não têm FK entre si.
 */
export function useCalendarRules(): UseQueryResult<CalendarRule[]> {
  return useQuery({
    queryKey: ["content-calendar-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_calendar_rules")
        .select("id, weekday, slot_time, channel, intent, is_active, content_pillars(name)")
        .order("weekday");
      if (error) throw error;
      return data.map((r) => ({
        id: r.id,
        weekday: r.weekday,
        slotTime: r.slot_time,
        channel: r.channel,
        intent: r.intent,
        pillarName: r.content_pillars?.name ?? null,
        isActive: r.is_active,
      }));
    },
  });
}
