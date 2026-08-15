/**
 * Provedor Anthropic.
 *
 * ## Saída estruturada por tool forçada, não por instrução em texto
 *
 * A Messages API não tem modo JSON nativo. "Peça JSON no prompt e torça" é
 * exatamente o tipo de garantia que este projeto rejeita em qualquer outro
 * lugar (ver A8 em docs/05 §4: "prompt é instrução, não garantia"). O
 * mecanismo que de fato molda a saída é forçar uma *tool* cujo
 * `input_schema` é o próprio `output_schema` do prompt, com `tool_choice`
 * fixando essa tool — o modelo é obrigado a preencher argumentos que casam
 * com o schema, não a escrever prosa que por acaso parece JSON.
 *
 * A validação por `ajv` em `gateway.ts`, depois disto, é a segunda camada —
 * defesa em profundidade, não confiança cega no provedor.
 */
import { AppError } from "../../errors.ts";
import type { AIProvider, ProviderCallInput, ProviderCallResult } from "../types.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 4096;
const TOOL_NAME = "emit_result";

interface AnthropicContentBlock {
  type: string;
  text?: string;
  input?: unknown;
}

interface AnthropicResponse {
  model?: string;
  content?: AnthropicContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

export function createAnthropicProvider(apiKey: string): AIProvider {
  return {
    key: "anthropic",

    async call(input: ProviderCallInput): Promise<ProviderCallResult> {
      const model = input.modelHint ?? DEFAULT_MODEL;

      const userContent = input.validationErrorFeedback
        ? `${input.userPrompt}\n\n---\nA resposta anterior não bateu com o formato esperado: ${input.validationErrorFeedback}\nCorrija e responda de novo.`
        : input.userPrompt;

      const body: Record<string, unknown> = {
        model,
        max_tokens: MAX_TOKENS,
        system: input.systemPrompt,
        messages: [{ role: "user", content: userContent }],
        ...(input.temperature !== null ? { temperature: input.temperature } : {}),
      };

      if (input.outputSchema) {
        body.tools = [{
          name: TOOL_NAME,
          description: "Emite o resultado estruturado desta chamada.",
          input_schema: input.outputSchema,
        }];
        body.tool_choice = { type: "tool", name: TOOL_NAME };
      }

      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // 429 e 5xx valem retentativa/fallback para outro provedor; o resto
        // (ex.: 400 de payload malformado) é erro nosso, repetir não ajuda.
        const retryable = response.status === 429 || response.status >= 500;
        const text = await response.text().catch(() => "");
        throw new AppError(
          retryable ? "upstream_error" : "internal",
          `Anthropic respondeu ${response.status}`,
          { detail: { status: response.status, body: text.slice(0, 500) } },
        );
      }

      const json = await response.json() as AnthropicResponse;
      const content = json.content ?? [];

      let raw: unknown;
      if (input.outputSchema) {
        const toolUse = content.find((block) => block.type === "tool_use");
        if (!toolUse) {
          throw new AppError(
            "internal",
            "Anthropic não devolveu o bloco tool_use esperado",
          );
        }
        raw = toolUse.input;
      } else {
        const textBlock = content.find((block) => block.type === "text");
        raw = textBlock?.text ?? "";
      }

      return {
        raw,
        model: json.model ?? model,
        inputTokens: json.usage?.input_tokens ?? 0,
        outputTokens: json.usage?.output_tokens ?? 0,
      };
    },
  };
}
