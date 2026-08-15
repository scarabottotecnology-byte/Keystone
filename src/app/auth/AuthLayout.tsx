import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Casco compartilhado das três telas de autenticação.
 *
 * Deliberadamente sem `<AppLayout>` — sem sidebar, sem tema de organização
 * logada, porque ninguém está logado ainda quando esta tela aparece.
 */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo />
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-xl font-semibold tracking-[-0.01em]">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {children}
        {footer && (
          <div className="text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
