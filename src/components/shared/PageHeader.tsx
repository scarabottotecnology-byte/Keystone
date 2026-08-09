import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Rótulo pequeno acima do título — o eixo ou módulo a que a tela pertence. */
  eyebrow?: string;
  title: string;
  /** Uma frase sobre o que a tela responde. Não repita o título. */
  description?: string;
  /** Ações primárias da tela, alinhadas à direita. */
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <span className="label-caps">{eyebrow}</span>}
        {/* Três regras que separam premium de amador, e que estavam quebradas:
            serifada no display, peso 600 (nunca 700+) e tracking negativo.
            Peso alto em tamanho grande é o que fazia a tipografia parecer
            infantil — a presença vem do tamanho, não da gordura da letra. */}
        <h1 className="text-balance font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="max-w-[68ch] text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
