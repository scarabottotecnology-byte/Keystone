import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import type { CalendarItem } from "./useCalendarItems";
import { EmptyCalendarNotice } from "./EmptyCalendarNotice";

export function ListView({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) return <EmptyCalendarNotice />;

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 py-3">
          <div className="flex items-center gap-4">
            <span className="numeric w-40 shrink-0 text-sm text-muted-foreground">
              {format(new Date(item.scheduledFor), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
            <Badge variant="outline" className="capitalize">{item.channel}</Badge>
            <Badge variant="outline" className="capitalize">{item.status}</Badge>
            {item.enqueuedAt && (
              <Badge variant="outline" className="text-positive">na fila</Badge>
            )}
            {item.notes && <span className="truncate text-sm text-muted-foreground">{item.notes}</span>}
          </div>
          {/* O motivo de não ter virado publicação aparece aqui, em vez de o
              item ficar parado sem explicação nenhuma. */}
          {item.enqueueError && (
            <p className="pl-44 text-xs text-negative">{item.enqueueError}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
