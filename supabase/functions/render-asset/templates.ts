/**
 * Especificação dos templates de arte.
 *
 * Este módulo é **puro**: sem Deno, sem rede, sem fonte. Existe separado do
 * compositor para que as regras — zonas, limites, o que precisa de lastro —
 * possam ser testadas sem rasterizar nada.
 *
 * O documento 14 prevê que os templates vivam em `content_templates.spec`
 * (jsonb), para que adicionar um formato não exija deploy. As `zones` abaixo
 * são exatamente o formato daquele jsonb, e a validação já roda contra elas.
 *
 * ⚠️ O **layout** ainda é código (ver `compose.ts`), não dado. Adicionar um
 * template hoje exige deploy. Tornar o layout declarativo é trabalho da FASE 5;
 * até lá o `spec` governa as restrições, não o desenho.
 */

export interface Zone {
  /** Chave da zona no payload. */
  key: string;
  /** Rótulo legível, usado em mensagem de erro. */
  label: string;
  /**
   * Limite de caracteres. Texto que estoura é **rejeitado**, nunca cortado com
   * reticências: reticências numa peça de consultoria leem como descuido, e o
   * agente que gerou o texto consegue reescrever mais curto se souber o limite.
   */
  maxChars: number;
  required: boolean;
  /**
   * Zona cujos números precisam existir na copy da peça.
   *
   * Falso para rodapé e fonte, onde aparecem ano e tamanho de amostra que não
   * são afirmação do post. Verdadeiro em tudo que faz afirmação numérica.
   */
  grounded: boolean;
}

export interface TemplateSpec {
  key: string;
  name: string;
  width: number;
  height: number;
  zones: Zone[];
}

export const TEMPLATES: Record<string, TemplateSpec> = {
  dado: {
    key: "dado",
    name: "Dado — número grande com contexto",
    width: 1080,
    height: 1080,
    zones: [
      { key: "eyebrow", label: "Sobretítulo", maxChars: 42, required: true, grounded: false },
      { key: "valor", label: "Número", maxChars: 8, required: true, grounded: true },
      { key: "afirmacao", label: "Afirmação", maxChars: 170, required: true, grounded: true },
      { key: "fonte", label: "Fonte", maxChars: 76, required: true, grounded: false },
    ],
  },
  afirmacao: {
    key: "afirmacao",
    name: "Afirmação — tese em serifada",
    width: 1080,
    height: 1080,
    zones: [
      { key: "eyebrow", label: "Sobretítulo", maxChars: 42, required: true, grounded: false },
      { key: "tese", label: "Tese", maxChars: 190, required: true, grounded: true },
      { key: "apoio", label: "Apoio", maxChars: 150, required: false, grounded: true },
      { key: "fonte", label: "Fonte", maxChars: 76, required: true, grounded: false },
    ],
  },
};

export type Payload = Record<string, string | undefined>;

export interface ZoneViolation {
  zone: string;
  label: string;
  kind: "missing" | "overflow";
  /** Presente em `overflow`: quantos caracteres precisam sair. */
  excess?: number;
}

/**
 * Valida um payload contra o spec do template.
 *
 * Devolve a lista de violações em vez de lançar: o agente A10 precisa das
 * violações **todas de uma vez** para reescrever numa passada só, em vez de
 * descobrir uma por tentativa.
 */
export function validatePayload(
  spec: TemplateSpec,
  payload: Payload,
): ZoneViolation[] {
  const violations: ZoneViolation[] = [];

  for (const zone of spec.zones) {
    const value = payload[zone.key]?.trim();

    if (!value) {
      if (zone.required) {
        violations.push({ zone: zone.key, label: zone.label, kind: "missing" });
      }
      continue;
    }

    if (value.length > zone.maxChars) {
      violations.push({
        zone: zone.key,
        label: zone.label,
        kind: "overflow",
        excess: value.length - zone.maxChars,
      });
    }
  }

  return violations;
}

export function describeViolations(violations: ZoneViolation[]): string {
  return violations
    .map((v) =>
      v.kind === "missing"
        ? `${v.label}: obrigatório e ausente`
        : `${v.label}: ${v.excess} caractere(s) além do limite`
    )
    .join("; ");
}
