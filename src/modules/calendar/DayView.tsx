import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import type { CalendarItem } from "./useCalendarItems";
import { EmptyCalendarNotice } from "./EmptyCalendarNotice";

export function DayView({ items, referenceDate }: { items: CalendarItem[]; referenceDate: Date }) {
  const dayItems = items.filter((item) => isSameDay(new Date(item.scheduledFor), referenceDate));

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold capitalize">
        {format(referenceDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </h3>
      {dayItems.length === 0 ? (
        <EmptyCalendarNotice />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {dayItems.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <span className="numeric w-16 shrink-0 text-sm text-muted-foreground">
                {format(new Date(item.scheduledFor), "HH:mm")}
              </span>
              <Badge variant="outline" className="capitalize">{item.channel}</Badge>
              <Badge variant="outline" className="capitalize">{item.status}</Badge>
              {item.notes && <span className="text-sm text-muted-foreground">{item.notes}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
