import { NavLink } from "@/components/NavLink";
import { NAVIGATION } from "@/app/navigation";
import { Logo, LogoMark } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Sidebar orientada pelo registro em `src/app/navigation.ts`.
 *
 * Não há lista de destinos codificada aqui — adicionar um módulo é adicionar
 * uma entrada no registro. Preparada para filtrar item por papel do usuário
 * quando o RBAC entrar na fase 2.
 */
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      {/* Fora do SidebarContent de propósito: o conteúdo rola quando a lista de
          módulos passa da altura da tela, e a marca não pode rolar junto. */}
      <SidebarHeader
        className={cn(
          "h-14 shrink-0 flex-row items-center border-b border-sidebar-border px-4 py-0",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? (
          <LogoMark className="size-6 text-sidebar-accent-foreground" plain />
        ) : (
          <Logo className="text-sidebar-accent-foreground [&_.fill-primary]:fill-sidebar-primary [&_span.text-primary]:text-sidebar-primary" />
        )}
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <div className="flex flex-col gap-1 py-2">
          {NAVIGATION.map((group) => (
            <SidebarGroup key={group.label} className="py-1">
              {!collapsed && (
                <SidebarGroupLabel className="px-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          title={
                            item.status === "planned"
                              ? `${item.label} — entra na fase ${item.phase}`
                              : item.label
                          }
                          className={cn(
                            "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon
                            className={cn(
                              "size-4 shrink-0",
                              item.status === "planned" && "opacity-55",
                            )}
                            aria-hidden="true"
                          />
                          {!collapsed && (
                            <>
                              <span
                                className={cn(
                                  "flex-1 truncate",
                                  item.status === "planned" && "opacity-70",
                                )}
                              >
                                {item.label}
                              </span>
                              {item.status === "planned" && (
                                <span
                                  className="shrink-0 rounded border border-sidebar-border px-1 py-px font-mono text-[0.6rem] tabular-nums text-sidebar-foreground/50"
                                  title={`Entregue na fase ${item.phase}`}
                                >
                                  F{item.phase}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
