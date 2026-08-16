import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
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
import { useContentPillars } from "./useContentPillars";

const INTENT_LABELS: Record<string, string> = {
  educacao: "Educação — ensina um conceito",
  dor: "Dor — nomeia uma dor real",
  case: "Case — ilustra um resultado",
  insight: "Insight — opinião executiva",
  comercial: "Comercial — aproxima do próximo passo",
};

const schema = z.object({
  pillar_id: z.string().uuid("Escolha um pilar"),
  intent: z.enum(["educacao", "dor", "case", "insight", "comercial"]),
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

export function GenerateIdeaDialog({
  insightId,
  insightTitle,
  trigger,
}: {
  insightId: string;
  insightTitle: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pillars = useContentPillars();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pillar_id: "", intent: "educacao" },
  });

  const generate = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data, error } = await supabase.functions.invoke("content-strategist", {
        body: { insight_id: insightId, ...values },
      });
      if (error) throw new Error(await extractFunctionError(error));
      return data;
    },
    onSuccess: (idea: { title?: string }) => {
      toast.success("Ideia gerada", { description: idea?.title });
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Não foi possível gerar a ideia", { description: extractMessage(error) });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar ideia de conteúdo</DialogTitle>
          <DialogDescription>
            A partir de <strong className="font-medium text-foreground">{insightTitle}</strong>,
            o agente A2 propõe título, ângulo, hook e racional — você escolhe o pilar e a
            intenção editorial.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => generate.mutate(values))}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="pillar_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilar</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um pilar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pillars.data?.map((pillar) => (
                        <SelectItem key={pillar.id} value={pillar.id}>
                          {pillar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intenção editorial</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(INTENT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                Gerar ideia
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
