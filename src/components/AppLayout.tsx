import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { findNavItem } from "@/app/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserMenu } from "@/components/shared/UserMenu";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const current = findNavItem(pathname);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SidebarTrigger />
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm font-medium">
                {current?.label ?? "Keystone Growth OS"}
              </span>
              {current?.status === "planned" && (
                <span className="shrink-0 rounded border border-border px-1.5 py-px font-mono text-[0.62rem] tabular-nums text-muted-foreground">
                  fase {current.phase}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
