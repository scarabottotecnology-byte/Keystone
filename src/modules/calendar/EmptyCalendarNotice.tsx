import { CalendarX2 } from "lucide-react";

/**
 * Reaparece nas quatro visualizações enquanto `content_calendar` estiver
 * vazia. Não é "carregando" nem "erro" — é o estado real até a FASE 5 dar
 * à peça gerada algo para agendar.
 */
export function EmptyCalendarNotice() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-10 text-center">
      <CalendarX2 className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">Nenhuma peça agendada ainda</p>
      <p className="max-w-[46ch] text-sm text-muted-foreground">
        Agendar depende de ter uma peça gerada — a Content Factory chega na
        FASE 5. Esta visualização já lê `content_calendar` de verdade; vai
        preencher assim que houver o que agendar.
      </p>
    </div>
  );
}
