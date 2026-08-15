import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { extractMessage } from "@/components/shared/QueryState";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  role: z.enum(["admin", "operator", "analyst", "viewer"]),
});

type FormValues = z.infer<typeof schema>;

const ROLE_LABELS: Record<FormValues["role"], string> = {
  admin: "Admin — gerencia equipe e organização",
  operator: "Operador — opera os módulos do dia a dia",
  analyst: "Analista — lê e analisa, não publica nem envia",
  viewer: "Visualizador — só leitura",
};

/**
 * Lê o corpo de erro da Edge Function quando existe. `invite-member` sempre
 * responde `{ error: { code, message } }` (ver `_shared/errors.ts`) — sem
 * isto, todo erro apareceria como "Edge Function returned a non-2xx status
 * code", que não diz o que de fato falhou.
 */
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

export function InviteMemberDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "viewer" },
  });

  const invite = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data, error } = await supabase.functions.invoke<{ userId: string }>(
        "invite-member",
        { body: values },
      );
      if (error) throw new Error(await extractFunctionError(error));
      return data;
    },
    onSuccess: () => {
      toast.success("Convite enviado");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Não foi possível convidar", { description: extractMessage(error) });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            Envia um e-mail de convite. A pessoa define a própria senha ao
            aceitar e ganha acesso à Keystone com o papel escolhido abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => invite.mutate(values))}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as FormValues["role"][]).map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {invite.isError && (
              <p role="alert" className="flex items-start gap-2 text-sm text-negative">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {extractMessage(invite.error)}
              </p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
