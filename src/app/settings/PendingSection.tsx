/**
 * Seção de Configurações que ainda não existe.
 *
 * Mesmo princípio do `ModulePlaceholder`, em escala de seção: a tela é real
 * — a Equipe funciona de verdade —, mas nem toda seção prometida em
 * `navigation.ts` está pronta. Melhor dizer isso explicitamente do que
 * esconder a seção ou fingir que ela existe.
 */
export function PendingSection({
  title,
  phase,
  description,
}: {
  title: string;
  phase: number;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
          <span className="rounded border border-border px-1.5 py-px font-mono text-[0.62rem] tabular-nums text-muted-foreground">
            fase {phase}
          </span>
        </div>
        <p className="max-w-[62ch] text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
