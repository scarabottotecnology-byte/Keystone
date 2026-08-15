import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "./AuthProvider";
import { AuthLayout } from "./AuthLayout";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/**
 * Destino do link de recuperação/convite por e-mail.
 *
 * O cliente Supabase já detecta o token na URL e cria a sessão sozinho
 * (`detectSessionInUrl`, ligado por padrão) — não há token para ler ou trocar
 * aqui. Esta tela só espera esse processo terminar e então troca a senha na
 * sessão resultante.
 */
export function ResetPasswordPage() {
  const { session, loading: authLoading } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (done) return <Navigate to="/" replace />;

  if (authLoading) {
    return (
      <AuthLayout title="Redefinir senha">
        <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Validando o link…
        </span>
      </AuthLayout>
    );
  }

  if (!session) {
    return (
      <AuthLayout title="Link inválido ou expirado">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-negative/40 bg-negative/5 p-6 text-center">
          <AlertTriangle className="size-8 text-negative" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Este link de redefinição não é mais válido. Peça um novo.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/esqueci-senha">Pedir novo link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async ({ password }: FormValues) => {
    setSubmitError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitError(error);
      return;
    }
    setDone(true);
  };

  return (
    <AuthLayout title="Defina sua nova senha">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirme a nova senha</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError !== null && (
            <p role="alert" className="flex items-start gap-2 text-sm text-negative">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {extractMessage(submitError)}
            </p>
          )}

          <Button type="submit" disabled={form.formState.isSubmitting} className="mt-2">
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Salvar nova senha
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
