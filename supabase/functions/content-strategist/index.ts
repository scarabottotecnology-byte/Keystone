/**
 * Agente A2 — Content Strategist (docs/05-AGENTES-DE-IA.md §4).
 *
 * Diferente de `market-intelligence`: este é disparado por um operador
 * clicando "gerar ideia a partir deste insight" (documento 12, FASE 4,
 * subtarefa 10) — há sessão de usuário real, então autentica pelo JWT do
 * chamador (`_shared/auth.ts`), igual a `invite-member`.
 *
 * A leitura do insight/pilar e a gravação final em `content_ideas` usam
 * `caller.db` — sujeito à RLS do próprio chamador, então um insight ou pilar
 * de outra organização simplesmente não aparece, e `operator_insert` decide
 * de verdade quem pode gravar. Já a chamada ao `ai-gateway` **não** passa
 * `caller.db` como dependência: o registro em `ai_invocations` é
 * responsabilidade do sistema, não do papel de quem clicou o botão — um
 * operador (não admin) não tem `INSERT` em `ai_invocations`
 * (`ai_core_and_observability`), e se o gateway usasse o cliente do
 * chamador para isso, a chamada custaria dinheiro e o registro de custo
 * seria descartado em silêncio. O gateway usa o próprio `service_role`
 * padrão para essa parte — só essa parte.
 */
import { authenticate } from "../_shared/auth.ts";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { invoke } from "../_shared/ai-gateway/gateway.ts";
import { generateIdeaSchema } from "./validate.ts";
import { z } from "zod";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-correlation-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status: number,
  correlationId: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      [CORRELATION_HEADER]: correlationId,
    },
  });
}

interface GeneratedIdea {
  title: string;
  angle: string;
  hook: string;
  rationale: string;
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "content-strategist" });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (request.method !== "POST") {
      throw new AppError("bad_request", "Método não suportado — use POST");
    }

    const caller = await authenticate(request);
    const scoped = log.child({
      organizationId: caller.organizationId,
      userId: caller.userId,
    });

    // Checagem explícita antes da chamada de IA, que custa dinheiro: a RLS
    // de `operator_insert` bloquearia de qualquer forma na gravação final,
    // mas falhar aqui evita gastar a chamada num resultado que nunca seria
    // salvo.
    const { data: membership, error: membershipError } = await caller.db
      .from("memberships")
      .select("role")
      .eq("organization_id", caller.organizationId)
      .eq("user_id", caller.userId)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) {
      throw new AppError(
        "internal",
        "Falha ao verificar papel do requisitante",
        { cause: membershipError },
      );
    }
    const role = membership?.role;
    if (!role || !["owner", "admin", "operator"].includes(role)) {
      throw new AppError(
        "forbidden",
        "Só owner, admin ou operator pode gerar ideia de conteúdo",
      );
    }

    const json = await request.json().catch(() => {
      throw new AppError(
        "bad_request",
        "Corpo da requisição não é JSON válido",
      );
    });
    const payload = generateIdeaSchema.parse(json);

    const { data: insight, error: insightError } = await caller.db
      .from("ai_insights")
      .select("title, description")
      .eq("id", payload.insight_id)
      .maybeSingle();
    if (insightError) {
      throw new AppError("internal", "Falha ao carregar insight", {
        cause: insightError,
      });
    }
    if (!insight) {
      throw new AppError("not_found", "Insight não encontrado");
    }

    const { data: pillar, error: pillarError } = await caller.db
      .from("content_pillars")
      .select("name")
      .eq("id", payload.pillar_id)
      .maybeSingle();
    if (pillarError) {
      throw new AppError("internal", "Falha ao carregar pilar", {
        cause: pillarError,
      });
    }
    if (!pillar) {
      throw new AppError("not_found", "Pilar de conteúdo não encontrado");
    }

    const result = await invoke<GeneratedIdea>({
      promptKey: "content_strategist.generate_idea",
      operation: "content_strategist",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "ai_insight", id: payload.insight_id },
      variables: {
        pillar_name: pillar.name,
        intent: payload.intent,
        insight_title: insight.title,
        insight_description: insight.description,
      },
    });

    if (!result.ok) {
      scoped.error("falha ao gerar ideia", null, {
        code: result.error.code,
        message: result.error.message,
      });
      return jsonResponse({ error: result.error }, 502, correlationId);
    }

    const { data: idea, error: insertError } = await caller.db
      .from("content_ideas")
      .insert({
        organization_id: caller.organizationId,
        pillar_id: payload.pillar_id,
        source_insight_id: payload.insight_id,
        title: result.data.title,
        angle: result.data.angle,
        hook: result.data.hook,
        rationale: result.data.rationale,
        intent: payload.intent,
        ai_generated: true,
        created_by: caller.userId,
      })
      .select()
      .single();

    if (insertError) {
      throw new AppError(
        "internal",
        "Ideia gerada, mas não foi possível gravar",
        { cause: insertError },
      );
    }

    scoped.info("ideia de conteúdo gerada", {
      ideaId: (idea as { id: string }).id,
    });
    return jsonResponse(idea, 201, correlationId);
  } catch (thrown) {
    const error = thrown instanceof z.ZodError
      ? new AppError("bad_request", "Payload inválido", {
        detail: { issues: thrown.issues },
      })
      : toAppError(thrown);
    log.error("falha ao gerar ideia de conteúdo", error);
    return jsonResponse(
      error.toResponseBody(),
      error.httpStatus,
      correlationId,
    );
  }
});
