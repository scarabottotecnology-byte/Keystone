import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/app/navigation";

/**
 * Tela de módulo ainda não implementado.
 *
 * Existe por uma razão de princípio: o produto não exibe interface bonita
 * simulando funcionalidade inexistente. Em vez de gráficos com dado falso,
 * esta tela diz exatamente o que o módulo vai fazer e em que fase ele chega.
 *
 * É degradação explícita, não maquete.
 */
export function ModulePlaceholder({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`Fase ${item.phase} do roadmap`}
        title={item.label}
        description={item.purpose}
      />

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-start gap-4 border-b border-border p-6">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary"
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">
              Este módulo ainda não foi construído
            </h2>
            <p className="max-w-[62ch] text-sm text-muted-foreground">
              Ele entra na <strong className="font-medium text-foreground">fase {item.phase}</strong>.
              Nada aqui é exibido com dado de exemplo — quando esta tela tiver
              números, eles serão reais.
            </p>
          </div>
        </div>

        {item.delivers && item.delivers.length > 0 && (
          <div className="flex flex-col gap-4 p-6">
            <span className="label-caps">O que existirá aqui</span>
            <ul className="flex flex-col gap-2.5">
              {item.delivers.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/cost-intelligence">
            Ir para o que já está no ar
            <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          O módulo de Centro de Custos é a parte do sistema já em operação.
        </span>
      </div>
    </div>
  );
}
