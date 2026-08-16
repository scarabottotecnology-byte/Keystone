import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "./useCalendarItems";
import { EmptyCalendarNotice } from "./EmptyCalendarNotice";

export function WeekView({ items, referenceDate }: { items: CalendarItem[]; referenceDate: Date }) {
  const days = eachDayOfInterval({
    start: startOfWeek(referenceDate, { weekStartsOn: 0 }),
    end: endOfWeek(referenceDate, { weekStartsOn: 0 }),
  });

  if (items.length === 0) return <EmptyCalendarNotice />;

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayItems = items.filter((item) => isSameDay(new Date(item.scheduledFor), day));
        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex min-h-32 flex-col gap-1.5 rounded-md border border-border p-2",
              isToday(day) && "border-primary",
            )}
          >
            <span className="label-caps capitalize">{format(day, "EEE d", { locale: ptBR })}</span>
            {dayItems.map((item) => (
              <span
                key={item.id}
                className="truncate rounded bg-accent px-1.5 py-0.5 text-xs capitalize"
              >
                {format(new Date(item.scheduledFor), "HH:mm")} · {item.channel}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
