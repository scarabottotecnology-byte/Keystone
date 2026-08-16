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
        <li key={item.id} className="flex items-center gap-4 py-3">
          <span className="numeric w-40 shrink-0 text-sm text-muted-foreground">
            {format(new Date(item.scheduledFor), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
          <Badge variant="outline" className="capitalize">{item.channel}</Badge>
          <Badge variant="outline" className="capitalize">{item.status}</Badge>
          {item.notes && <span className="truncate text-sm text-muted-foreground">{item.notes}</span>}
        </li>
      ))}
    </ul>
  );
}
