import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "./useCalendarItems";
import { EmptyCalendarNotice } from "./EmptyCalendarNotice";

const WEEKDAY_HEADERS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function MonthView({ items, referenceDate }: { items: CalendarItem[]; referenceDate: Date }) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(referenceDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(referenceDate), { weekStartsOn: 0 }),
  });

  if (items.length === 0) return <EmptyCalendarNotice />;

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAY_HEADERS.map((label) => (
        <span key={label} className="label-caps px-1 pb-1">{label}</span>
      ))}
      {days.map((day) => {
        const dayItems = items.filter((item) => isSameDay(new Date(item.scheduledFor), day));
        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex min-h-20 flex-col gap-1 rounded-md border border-border p-1.5",
              !isSameMonth(day, referenceDate) && "opacity-40",
              isToday(day) && "border-primary",
            )}
          >
            <span className="numeric text-xs text-muted-foreground">{format(day, "d")}</span>
            {dayItems.slice(0, 2).map((item) => (
              <span
                key={item.id}
                className="truncate rounded bg-accent px-1 py-0.5 text-[0.65rem] capitalize"
              >
                {item.channel}
              </span>
            ))}
            {dayItems.length > 2 && (
              <span className="text-[0.65rem] text-muted-foreground">+{dayItems.length - 2}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
