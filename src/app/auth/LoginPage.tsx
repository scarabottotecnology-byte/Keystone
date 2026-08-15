import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation } from "react-router-dom";
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

const schema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

type FormValues = z.infer<typeof schema>;

/**
 * Login por e-mail e senha. Sem link de "criar conta": ferramenta interna,
 * sem cadastro público (ADR-014) — a conta nasce quando um admin convida
 * alguém em Configurações → Equipe.
 */
export function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (!authLoading && session) {
    const state = location.state as { from?: { pathname?: string } } | null;
    const from = state?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) setSubmitError(error);
  };

  return (
    <AuthLayout
      title="Entrar"
      description="Acesso interno da Keystone Controladoria."
      footer={
        <Link to="/esqueci-senha" className="underline underline-offset-4 hover:text-foreground">
          Esqueci minha senha
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
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
            Entrar
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
