import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractMessage } from "@/components/shared/QueryState";
import { supabase } from "@/integrations/supabase/client";
import type { ContentAsset } from "./useContentAssets";

/**
 * Agenda uma peça aprovada.
 *
 * Chama `schedule_asset_publication` em vez de inserir direto em
 * `content_calendar`: a função valida que a peça está aprovada e tira
 * organização e canal da própria peça, de modo que a tela não consegue
 * agendar uma peça no calendário de outra organização nem por engano.
 *
 * A partir daí é o worker que age — a cada 15 minutos ele varre o
 * calendário, transforma em job o que já venceu e publica. Esta tela não
 * publica nada.
 */

/** Sugere o próximo horário redondo, pelo menos uma hora à frente. */
function defaultSlot(): string {
  const when = new Date(Date.now() + 60 * 60 * 1000);
  when.setMinutes(0, 0, 0);
  // `datetime-local` espera horário local sem fuso, e `toISOString` devolve
  // UTC — usar o segundo aqui deslocaria o valor exibido em três horas.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${
    pad(when.getDate())
  }T${pad(when.getHours())}:${pad(when.getMinutes())}`;
}

export function ScheduleButton({ asset }: { asset: ContentAsset }) {
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState(defaultSlot);
  const queryClient = useQueryClient();

  const schedule = useMutation({
    mutationFn: async () => {
      const when = new Date(slot);
      if (Number.isNaN(when.getTime())) {
        throw new Error("Data inválida");
      }
      const { error } = await supabase.rpc("schedule_asset_publication", {
        p_asset_id: asset.id,
        p_scheduled_for: when.toISOString(),
      });
      if (error) throw error;
      return when;
    },
    onSuccess: (when) => {
      toast.success("Peça agendada", {
        description: `Publica em ${
          format(when, "d 'de' MMMM, HH:mm", { locale: ptBR })
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ["content-assets"] });
      queryClient.invalidateQueries({ queryKey: ["content-calendar"] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Não foi possível agendar", {
        description: extractMessage(error),
      });
    },
  });

  if (asset.status !== "approved") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarPlus className="size-4" />
          Agendar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar publicação</DialogTitle>
          <DialogDescription>
            A peça entra no calendário no canal em que foi criada
            ({asset.channel}). O robô publica sozinho quando o horário
            chegar — ele varre o calendário a cada 15 minutos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slot">Data e hora</Label>
          <Input
            id="slot"
            type="datetime-local"
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Precisa estar no futuro. Se não houver conta conectada neste
            canal — ou houver mais de uma —, o item fica no calendário
            dizendo o motivo, em vez de sumir.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={() => schedule.mutate()}
            disabled={schedule.isPending}
          >
            {schedule.isPending ? "Agendando…" : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
