/**
 * Cálculo do Growth Score — FASE 3, subtarefa 3.
 *
 * `GROWTH SCORE = Σ (peso_i × normalizado_i)` (docs/06-FLUXO-DE-DADOS.md §5).
 *
 * ## Por que este cálculo é TypeScript puro e não SQL
 *
 * `rpc_command_center()` já faz a agregação real no Postgres — a soma, a
 * contagem, a busca do valor bruto por componente. O que sobra aqui é
 * aritmética sobre seis números já agregados: aplicar peso e normalizar
 * contra meta. Isso não é a agregação que o critério de aceite da fase proíbe
 * no cliente ("nenhuma agregação feita no cliente" é sobre somar linha crua,
 * não sobre multiplicar seis escalares que o servidor já devolveu).
 *
 * E vale a pena isolar exatamente porque é fórmula, não porque é barato: uma
 * ponderação errada não lança exceção, produz um número plausível e errado —
 * a mesma classe de risco que motivou testar `deriveIdempotencyKey` à parte
 * na FASE 1. Módulo puro, testável sem banco.
 *
 * ## Por que o total fica `null` com um componente faltando
 *
 * Um score parcial (5 de 6 componentes) pareceria uma nota real, só que
 * calculada sobre uma base diferente a cada fase que adiciona uma origem de
 * dado — o número subiria ou desceria por causa da cobertura, não do
 * desempenho. Até FASE 17 (a última a alimentar um componente), o total fica
 * indisponível de propósito. Componentes individuais que já têm dado
 * aparecem normalmente — só o composto espera todos.
 */

export interface GrowthScoreComponentInput {
  key: string;
  /** Peso configurado em `growth_score_config`. */
  weight: number;
  /** Valor bruto agregado pelo servidor. `null` = sem tabela de origem ainda. */
  raw: number | null;
  /** Meta ou média móvel contra a qual `raw` é normalizado. */
  baseline: number | null;
}

export interface GrowthScoreComponentResult {
  key: string;
  weight: number;
  /** 0–100. `null` quando `raw` ou `baseline` não existem. */
  normalized: number | null;
  available: boolean;
}

export interface GrowthScoreResult {
  components: GrowthScoreComponentResult[];
  /** Média ponderada 0–100. `null` a menos que todo componente esteja disponível. */
  totalScore: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normaliza um componente contra a própria base (meta ou média móvel).
 *
 * `baseline <= 0` é tratado como indisponível, não como divisão por zero
 * disfarçada de resultado — uma meta zerada não significa "qualquer valor é
 * infinitamente bom".
 */
function normalizeComponent(input: GrowthScoreComponentInput): GrowthScoreComponentResult {
  const { key, weight, raw, baseline } = input;

  if (raw === null || baseline === null || baseline <= 0) {
    return { key, weight, normalized: null, available: false };
  }

  const normalized = clamp((raw / baseline) * 100, 0, 100);
  return { key, weight, normalized, available: true };
}

export function computeGrowthScore(
  inputs: GrowthScoreComponentInput[],
): GrowthScoreResult {
  const components = inputs.map(normalizeComponent);

  const allAvailable = components.length > 0 && components.every((c) => c.available);
  if (!allAvailable) {
    return { components, totalScore: null };
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) {
    return { components, totalScore: null };
  }

  const weightedSum = components.reduce(
    (sum, c) => sum + c.weight * (c.normalized as number),
    0,
  );

  return { components, totalScore: weightedSum / totalWeight };
}
