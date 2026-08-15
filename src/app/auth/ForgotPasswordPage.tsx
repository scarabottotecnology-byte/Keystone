import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
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
import { AuthLayout } from "./AuthLayout";

const schema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: FormValues) => {
    setSubmitError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) {
      setSubmitError(error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Verifique seu e-mail">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center">
          <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Se houver uma conta com esse e-mail, enviamos um link para
            redefinir a senha. Ele expira em pouco tempo — se não chegar em
            alguns minutos, verifique o spam antes de pedir de novo.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/entrar">Voltar para o login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Esqueci minha senha"
      description="Informe o e-mail da sua conta e enviamos um link de redefinição."
      footer={
        <Link to="/entrar" className="underline underline-offset-4 hover:text-foreground">
          Voltar para o login
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
            Enviar link
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
