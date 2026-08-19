/**
 * Substitui `{{variavel}}` no template do prompt pelo valor correspondente.
 *
 * Variável sem valor correspondente lança erro em vez de deixar o literal
 * `{{variavel}}` passar para o provedor — isso produziria uma saída plausível
 * e completamente errada, o pior tipo de falha porque ninguém percebe sem
 * ler o prompt renderizado.
 *
 * Módulo puro: sem Deno, sem rede. Roda igual na Edge Function e no vitest.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    if (!(name in variables)) {
      throw new Error(`Variável ausente no template do prompt: ${name}`);
    }
    const value = variables[name];
    return typeof value === "string" ? value : JSON.stringify(value);
  });
}
