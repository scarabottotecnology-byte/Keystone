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
// ── Interop de `ajv` entre os dois runtimes deste repositório ───────────────
//
// `ajv` é CJS, e os dois runtimes que carregam este arquivo discordam sobre
// onde fica a classe:
//   - vitest (Node/Vite): `import Ajv from "ajv"` funciona; o export nomeado
//     `{ Ajv }` chega `undefined` → "Ajv is not a constructor".
//   - Deno (Edge Function): o default resolve para o namespace do módulo, não
//     para a classe → `deno check` falha com "expression is not
//     constructable".
//
// Nenhuma das duas formas isoladas serve, então a classe é resolvida em
// runtime a partir da forma que o runtime de fato entregou. Não é o
// `no-masking-fallback` que este projeto proíbe: ali o fallback esconde
// ausência de dado; aqui as três referências são o *mesmo* construtor, só
// alcançado por caminhos diferentes de interop — e se nenhuma existir, o
// erro é explícito abaixo, nunca silencioso.
//
// Ficou latente desde a FASE 4: o job de Edge Functions do CI nunca chegou a
// rodar (só dispara em PR ou push para `main`), e a sessão que escreveu o
// gateway não tinha Deno local para verificar. Confirmado em runtime nesta
// sessão que ambas as formas constroem e validam igual — o efeito era de
// tipagem e de CI, nunca um erro em produção.
import * as ajvModule from "ajv";

interface AjvValidateFn {
  (data: unknown): boolean;
  errors?: unknown;
}

interface AjvInstance {
  compile(schema: Record<string, unknown>): AjvValidateFn;
  errorsText(errors: unknown, opts?: { separator?: string }): string;
}

type AjvConstructor = new (
  options?: { allErrors?: boolean; strict?: boolean },
) => AjvInstance;

const candidates = ajvModule as unknown as {
  Ajv?: AjvConstructor;
  default?: AjvConstructor;
};

const AjvCtor: AjvConstructor | undefined = typeof candidates.Ajv === "function"
  ? candidates.Ajv
  : typeof candidates.default === "function"
  ? candidates.default
  : typeof ajvModule === "function"
  ? ajvModule as unknown as AjvConstructor
  : undefined;

if (!AjvCtor) {
  // Sem validação de schema o gateway perderia a garantia central de
  // "nenhuma saída de LLM chega ao banco sem passar por schema" — falhar na
  // carga é melhor que rodar sem a rede de proteção e ninguém notar.
  throw new Error(
    "Não foi possível resolver o construtor de `ajv` neste runtime",
  );
}

const ajv = new AjvCtor({ allErrors: true, strict: false });

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
