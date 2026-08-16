import { useState } from "react";
import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { useCalendarItems } from "./useCalendarItems";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { ListView } from "./ListView";

type ViewKey = "month" | "week" | "day" | "list";

const STEP: Record<Exclude<ViewKey, "list">, (date: Date, direction: 1 | -1) => Date> = {
  month: (date, dir) => (dir === 1 ? addMonths(date, 1) : subMonths(date, 1)),
  week: (date, dir) => (dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1)),
  day: (date, dir) => (dir === 1 ? addDays(date, 1) : subDays(date, 1)),
};

export function CalendarPage() {
  const [view, setView] = useState<ViewKey>("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const items = useCalendarItems();

  const canStep = view !== "list";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Calendar"
        description="Distribuir a pauta ao longo da semana, por canal e formato."
        actions={
          canStep ? (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setReferenceDate((d) => STEP[view as Exclude<ViewKey, "list">](d, -1))}
                aria-label="Período anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setReferenceDate(new Date())}>
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setReferenceDate((d) => STEP[view as Exclude<ViewKey, "list">](d, 1))}
                aria-label="Próximo período"
              >
                <ChevronRight className="size-4" />
              </Button>
              <span className="ml-2 text-sm font-medium capitalize">
                {format(referenceDate, view === "day" ? "d 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}
              </span>
            </div>
          ) : undefined
        }
      />

      <Tabs value={view} onValueChange={(v) => setView(v as ViewKey)}>
        <TabsList>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="day">Dia</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <QueryState
            isLoading={items.isLoading}
            isError={items.isError}
            error={items.error}
            onRetry={() => items.refetch()}
          >
            <TabsContent value="month" className="mt-0">
              <MonthView items={items.data ?? []} referenceDate={referenceDate} />
            </TabsContent>
            <TabsContent value="week" className="mt-0">
              <WeekView items={items.data ?? []} referenceDate={referenceDate} />
            </TabsContent>
            <TabsContent value="day" className="mt-0">
              <DayView items={items.data ?? []} referenceDate={referenceDate} />
            </TabsContent>
            <TabsContent value="list" className="mt-0">
              <ListView items={items.data ?? []} />
            </TabsContent>
          </QueryState>
        </div>
      </Tabs>
    </div>
  );
}
