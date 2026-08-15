/**
 * Custo estimado de uma invocação, a partir do preço configurado do modelo.
 *
 * `null`, nunca `0`, quando o preço não está configurado — custo desconhecido
 * não é o mesmo que "não custou nada". Fabricar um zero aqui seria exatamente
 * o padrão que `keystone-data/no-masking-fallback` proíbe no frontend
 * (`eslint-rules/no-masking-fallback.js`); no backend a mesma regra vale por
 * disciplina, já que a Edge Function roda fora do alcance do ESLint do
 * frontend.
 *
 * O preço não é hardcoded neste módulo de propósito: preço de provedor muda
 * sem aviso, e fixar um número aqui seria arriscar publicar um custo errado
 * com aparência de precisão. Vem de `ai_providers.config.pricing`,
 * configurado por quem de fato acompanha a tabela de preço do provedor.
 *
 * Módulo puro: sem Deno, sem rede.
 */

export interface ModelPricing {
  input_per_million: number;
  output_per_million: number;
}

export function estimateCostUsd(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing | undefined | null,
): number | null {
  if (!pricing) return null;

  const cost = (inputTokens / 1_000_000) * pricing.input_per_million +
    (outputTokens / 1_000_000) * pricing.output_per_million;

  // Mesma precisão da coluna `estimated_cost_usd numeric(12,6)`.
  return Math.round(cost * 1_000_000) / 1_000_000;
}
