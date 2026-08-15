/**
 * Valida a saída do provedor contra o `output_schema` do prompt.
 *
 * "Nenhuma saída de LLM chega ao banco sem passar por schema" (docs/05 §1) —
 * é a garantia central do gateway, então merece o mesmo tratamento de módulo
 * isolado e testado que `template.ts` e `pricing.ts`, em vez de viver inline
 * dentro da orquestração do `gateway.ts`.
 *
 * A tool forçada em `providers/anthropic.ts` já molda a saída pela forma do
 * schema — isto aqui é a segunda camada, defesa em profundidade, não
 * confiança cega no provedor.
 */
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

export type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export function validateOutput(
  schema: Record<string, unknown>,
  data: unknown,
): ValidationResult {
  const validate = ajv.compile(schema);
  if (validate(data)) return { valid: true };
  const message = ajv.errorsText(validate.errors, { separator: "; " });
  return { valid: false, message };
}
