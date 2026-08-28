import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarItem {
  id: string;
  scheduledFor: string;
  channel: string;
  status: string;
  notes: string | null;
  /** Quando virou job de publicação. Nulo = ainda não entrou na fila. */
  enqueuedAt: string | null;
  /**
   * Por que ainda não virou job.
   *
   * O worker varre o calendário a cada 15 minutos; quando não consegue
   * enfileirar um item — peça não aprovada, nenhuma conta conectada no
   * canal, mais de uma conta no mesmo canal — ele grava o motivo aqui em
   * vez de descartar em silêncio. É o que faz a tela conseguir dizer
   * "não saiu, e foi por isto".
   */
  enqueueError: string | null;
}

/**
 * Itens do calendário editorial.
 *
 * Uma linha aqui nasce de `schedule_asset_publication` (agendamento manual,
 * pelo botão da biblioteca de conteúdo) e é consumida pelo worker, que a
 * transforma em `publishing_jobs` quando o horário chega.
 */
export function useCalendarItems(): UseQueryResult<CalendarItem[]> {
  return useQuery({
    queryKey: ["content-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_calendar")
        .select(
          "id, scheduled_for, channel, status, notes, enqueued_at, enqueue_error",
        )
        .order("scheduled_for");
      if (error) throw error;
      return data.map((item) => ({
        id: item.id,
        scheduledFor: item.scheduled_for,
        channel: item.channel,
        status: item.status,
        notes: item.notes,
        enqueuedAt: item.enqueued_at,
        enqueueError: item.enqueue_error,
      }));
    },
  });
}
