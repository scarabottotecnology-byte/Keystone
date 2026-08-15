import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { supabase } from "@/integrations/supabase/client";

/**
 * Conta autenticada, sem vínculo ativo com a Keystone.
 *
 * Não há convite por e-mail nem seletor de organização (ADR-014) — o único
 * jeito de ganhar acesso é um owner/admin existente inserir a `membership`.
 * Esta tela existe para esse intervalo não virar um erro genérico: a conta é
 * válida, só falta alguém conceder o vínculo.
 */
export function PendingAccessScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Logo />
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-display text-xl font-semibold tracking-[-0.01em]">
          Sua conta existe, mas ainda sem acesso
        </h1>
        <p className="text-sm text-muted-foreground">
          Ninguém concedeu vínculo com a Keystone para este e-mail ainda. Peça
          a um administrador para adicioná-lo em Configurações → Equipe.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => supabase.auth.signOut()}
      >
        <LogOut className="size-4" />
        Sair
      </Button>
    </div>
  );
}
