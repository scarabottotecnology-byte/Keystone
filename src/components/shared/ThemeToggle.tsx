import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  // O tema só é conhecido depois da montagem, porque depende de localStorage e
  // de prefers-color-scheme. Renderizar o ícone antes disso faria a lua piscar
  // virando sol no primeiro frame.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const CurrentIcon = resolvedTheme === "light" ? Sun : Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Alternar tema"
        >
          {mounted ? (
            <CurrentIcon className="size-4" aria-hidden="true" />
          ) : (
            <span className="size-4" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = mounted && theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="gap-2"
            >
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1">{option.label}</span>
              <Check
                className={cn(
                  "size-3.5 text-primary",
                  !isSelected && "invisible",
                )}
                aria-hidden="true"
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
