/**
 * Contrato do `ai-gateway` (docs/05-AGENTES-DE-IA.md §1).
 *
 * Resultado como união discriminada, não exceção: falha de IA é evento
 * esperado (rate limit, provedor fora, saída fora do schema), e
 * `try/catch` espalhado pelo código de domínio esconde tratamento. O
 * discriminated union obriga quem chama a lidar com o erro no compilador.
 */

export interface AIInvokeInput {
  /** Chave do prompt em `ai_prompts`. */
  promptKey: string;
  /** Omitida = versão ativa mais recente (própria da organização, senão global). */
  promptVersion?: number;
  variables: Record<string, unknown>;
  organizationId: string;
  /** Operação de negócio (ex.: `market_intelligence`), grafada em `ai_invocations.operation`. */
  operation: string;
  correlationId?: string;
  subject?: { type: string; id: string };
  /** `critical` atravessa o teto de orçamento diário; `normal` é recusado quando estourado. */
  priority?: "critical" | "normal";
}

export type AIErrorCode =
  | "prompt_not_found"
  | "budget_exceeded"
  | "schema_validation_failed"
  | "all_providers_failed"
  | "misconfigured";

export interface AIInvokeSuccess<T> {
  ok: true;
  data: T;
  invocationId: string;
  provider: string;
  model: string;
  /** `null` quando o preço do modelo não está configurado — nunca `0` fabricado. */
  costUsd: number | null;
}

export interface AIInvokeFailure {
  ok: false;
  error: { code: AIErrorCode; message: string };
  /** `null` quando a falha aconteceu antes de haver o que registrar (ex.: prompt inexistente). */
  invocationId: string | null;
}

export type AIInvokeResult<T> = AIInvokeSuccess<T> | AIInvokeFailure;

export interface ProviderCallInput {
  systemPrompt: string;
  userPrompt: string;
  /** JSON Schema. `null` = resposta em texto livre, sem validação estrutural. */
  outputSchema: Record<string, unknown> | null;
  modelHint: string | null;
  temperature: number | null;
  /** Anexado quando esta é uma retentativa após falha de validação de schema. */
  validationErrorFeedback?: string;
}

export interface ProviderCallResult {
  raw: unknown;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AIProvider {
  key: string;
  call(input: ProviderCallInput): Promise<ProviderCallResult>;
}
