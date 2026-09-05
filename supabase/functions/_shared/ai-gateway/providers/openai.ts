/**
 * Provedor OpenAI (Chat Completions).
 *
 * ## Por que este arquivo existe
 *
 * `ai_providers` já semeava a linha `openai` desde
 * `20260819101000_content_factory_seed.sql`, e `OPENAI_API_KEY` já era um
 * Edge Function secret usado por `embeddings.ts`. Faltava a fábrica: sem
 * entrada em `PROVIDER_FACTORIES`, `gateway.ts` resolvia `openai` para
 * `null` e **descartava a linha em silêncio**. O banco anunciava uma cadeia
 * de dois provedores e o código chamava um só — a rigor, o fallback do
 * docs/05 §1 nunca poderia disparar, porque nunca havia um segundo elo.
 *
 * ## Saída estruturada por tool forçada, não por instrução em texto
 *
 * Mesmo mecanismo do provedor Anthropic, pelo mesmo motivo: o que molda a
 * saída é forçar uma *function* cujos `parameters` são o próprio
 * `output_schema` do prompt, com `tool_choice` fixando essa function. Pedir
 * JSON em prosa e torcer é a garantia que este projeto rejeita em todo o
 * resto (A8 em docs/05 §4).
 *
 * `strict: true` não é usado de propósito: ele exige um subconjunto do JSON
 * Schema (todo objeto com `additionalProperties: false` e todas as chaves em
 * `required`) que os `output_schema` já gravados em `ai_prompts` não
 * respeitam. Ativá-lo faria a OpenAI recusar o payload com 400 — um erro
 * *não* retentável, que derrubaria a chamada em vez de dar fallback. A
 * validação por `ajv` em `gateway.ts` continua sendo a camada que de fato
 * garante o formato, aqui como lá.
 */
import { AppError } from "../../errors.ts";
import type {
  AIProvider,
  ProviderCallInput,
  ProviderCallResult,
} from "../types.ts";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o";
const MAX_TOKENS = 4096;
const TOOL_NAME = "emit_result";

interface OpenAIToolCall {
  function?: { name?: string; arguments?: string };
}

interface OpenAIChoice {
  message?: { content?: string | null; tool_calls?: OpenAIToolCall[] };
}

interface OpenAIResponse {
  model?: string;
  choices?: OpenAIChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function createOpenAIProvider(apiKey: string): AIProvider {
  return {
    key: "openai",

    async call(input: ProviderCallInput): Promise<ProviderCallResult> {
      // `model_hint` é gravado por prompt e pensado para o provedor de
      // prioridade 1. Um hint da Anthropic (`claude-…`) enviado à OpenAI
      // volta 404 — erro não retentável, que mataria justamente a chamada de
      // fallback que este provedor existe para atender. Fora do seu
      // namespace, o hint é ignorado em favor do modelo padrão.
      const hint = input.modelHint;
      const model = hint && isOpenAIModel(hint) ? hint : DEFAULT_MODEL;

      const userContent = input.validationErrorFeedback
        ? `${input.userPrompt}\n\n---\nA resposta anterior não bateu com o formato esperado: ${input.validationErrorFeedback}\nCorrija e responda de novo.`
        : input.userPrompt;

      const body: Record<string, unknown> = {
        model,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: userContent },
        ],
        ...(input.temperature !== null
          ? { temperature: input.temperature }
          : {}),
      };

      if (input.outputSchema) {
        body.tools = [{
          type: "function",
          function: {
            name: TOOL_NAME,
            description: "Emite o resultado estruturado desta chamada.",
            parameters: input.outputSchema,
          },
        }];
        body.tool_choice = {
          type: "function",
          function: { name: TOOL_NAME },
        };
      }

      const response = await fetch(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Mesmo critério do provedor Anthropic: 429 e 5xx valem
        // retentativa/fallback; o resto é erro nosso e repetir não ajuda.
        const retryable = response.status === 429 || response.status >= 500;
        const text = await response.text().catch(() => "");
        throw new AppError(
          retryable ? "upstream_error" : "internal",
          `OpenAI respondeu ${response.status}`,
          { detail: { status: response.status, body: text.slice(0, 500) } },
        );
      }

      const json = await response.json() as OpenAIResponse;
      const message = json.choices?.[0]?.message;

      let raw: unknown;
      if (input.outputSchema) {
        const args = message?.tool_calls?.find(
          (call) => call.function?.name === TOOL_NAME,
        )?.function?.arguments;
        if (typeof args !== "string") {
          throw new AppError(
            "internal",
            "OpenAI não devolveu a tool call esperada",
          );
        }
        // `arguments` vem como string JSON, não objeto. Parse malformado é
        // falha do provedor, não saída fora do schema: propagado como erro
        // para dar fallback, em vez de virar retentativa de prompt.
        try {
          raw = JSON.parse(args);
        } catch {
          throw new AppError(
            "upstream_error",
            "OpenAI devolveu argumentos de tool call que não são JSON válido",
          );
        }
      } else {
        raw = message?.content ?? "";
      }

      return {
        raw,
        model: json.model ?? model,
        inputTokens: json.usage?.prompt_tokens ?? 0,
        outputTokens: json.usage?.completion_tokens ?? 0,
      };
    },
  };
}

/** Prefixos de modelo que a Chat Completions da OpenAI aceita. */
function isOpenAIModel(model: string): boolean {
  return /^(gpt-|o[1-4](-|$)|chatgpt-)/.test(model);
}
