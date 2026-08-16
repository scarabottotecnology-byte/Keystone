import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarItem {
  id: string;
  scheduledFor: string;
  channel: string;
  status: string;
  notes: string | null;
}

/**
 * `content_calendar` nasce vazia nesta fase, de propósito: uma linha aqui
 * exige uma peça para agendar (`asset_id`), e `content_assets` só nasce na
 * FASE 5. As quatro visualizações são reais e a consulta é real — só não
 * há o que mostrar ainda. Ver `EmptyCalendarNotice`.
 */
export function useCalendarItems(): UseQueryResult<CalendarItem[]> {
  return useQuery({
    queryKey: ["content-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_calendar")
        .select("id, scheduled_for, channel, status, notes")
        .order("scheduled_for");
      if (error) throw error;
      return data.map((item) => ({
        id: item.id,
        scheduledFor: item.scheduled_for,
        channel: item.channel,
        status: item.status,
        notes: item.notes,
      }));
    },
  });
}
