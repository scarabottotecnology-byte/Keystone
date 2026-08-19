import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Wand2 } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { extractMessage } from "@/components/shared/QueryState";
import { supabase } from "@/integrations/supabase/client";
import { useContentFormats } from "./useContentFormats";

const schema = z.object({
  format_id: z.string().uuid("Escolha um formato"),
});

type FormValues = z.infer<typeof schema>;

async function extractFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error?.message === "string") return body.error.message;
    } catch {
      // corpo não é JSON — cai no fallback abaixo
    }
  }
  return extractMessage(error);
}

export function GeneratePieceDialog({
  ideaId,
  ideaTitle,
  trigger,
}: {
  ideaId: string;
  ideaTitle: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const formats = useContentFormats();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { format_id: "" },
  });

  const generate = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data, error } = await supabase.functions.invoke("content-factory", {
        body: { idea_id: ideaId, ...values },
      });
      if (error) throw new Error(await extractFunctionError(error));
      return data as { asset?: { headline?: string }; review?: { score?: number } };
    },
    onSuccess: (result) => {
      toast.success("Peça gerada", {
        description: result.review
          ? `Score da revisão: ${result.review.score}/100`
          : result.asset?.headline ?? "Revisão automática indisponível — reveja manualmente.",
      });
      queryClient.invalidateQueries({ queryKey: ["content-assets"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Não foi possível gerar a peça", { description: extractMessage(error) });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar peça de conteúdo</DialogTitle>
          <DialogDescription>
            A partir de <strong className="font-medium text-foreground">{ideaTitle}</strong>, o
            agente A3 executa o pipeline de seis etapas (ângulo, hook, estrutura, copy, CTA,
            briefing visual) e o A4 já revisa em seguida — escolha só o formato.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => generate.mutate(values))}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="format_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um formato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formats.data?.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          {format.channel} — {format.key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {generate.isError && (
              <p role="alert" className="text-sm text-negative">
                {extractMessage(generate.error)}
              </p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={generate.isPending}>
                {generate.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="size-4" aria-hidden="true" />
                )}
                Gerar peça
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
