import { cn } from "@/lib/utils";

/**
 * Marca da Keystone.
 *
 * O símbolo é a pedra de fecho — a cunha no topo do arco que trava todas as
 * outras pedras. O topo em arco é o que a distingue de um trapézio genérico:
 * sem ele, a forma lê como recipiente, não como pedra.
 *
 * O SVG é inline, não `<img>`, por três razões: as cores acompanham os tokens
 * do tema, não há requisição de rede, e o símbolo herda `currentColor` na
 * variante monocromática.
 *
 * Os arquivos para uso fora do produto — proposta, contrato, onboarding —
 * estão em `public/brand/`.
 */

const WEDGE = "M9 16 Q32 6 55 16 L47 52 H17 Z";
const BAND = "M9 16 Q32 6 55 16 L53.8 21.5 Q32 11.5 10.2 21.5 Z";

interface LogoMarkProps {
  className?: string;
  /**
   * Sem a faixa de acento.
   *
   * Obrigatório abaixo de ~30px: nesse tamanho a faixa clara no topo deixa de
   * ler como a linha de carga do arco e passa a ler como líquido dentro de um
   * recipiente. A silhueta sozinha não tem essa ambiguidade.
   */
  plain?: boolean;
}

export function LogoMark({ className, plain = false }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-6", className)}
      role="img"
      aria-label="Keystone"
    >
      <path d={WEDGE} fill="currentColor" />
      {!plain && <path d={BAND} className="fill-primary" />}
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Só o símbolo, sem o logotipo. */
  markOnly?: boolean;
}

export function Logo({ className, markOnly = false }: LogoProps) {
  if (markOnly) {
    return <LogoMark className={cn("size-7", className)} plain />;
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-7 shrink-0" plain />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-semibold tracking-[0.08em]">
          KEYSTONE
        </span>
        <span className="mt-1 font-sans text-[0.5rem] font-medium uppercase tracking-[0.26em] text-primary">
          Controladoria
        </span>
      </span>
    </div>
  );
}
