/**
 * Agentes A3 (Content Factory) + A4 (Content Reviewer) — docs/05-AGENTES-
 * DE-IA.md §4.
 *
 * Interativa (JWT de operador), disparada por "gerar peça a partir desta
 * ideia" — mesmo padrão de auth de `content-strategist`. A leitura de
 * ideia/formato/pilar/marca e a gravação final em `content_assets`/
 * `content_reviews` usam `caller.db` (sujeito à RLS); as chamadas ao
 * `ai-gateway` (`invoke`, `embed`) e a `app.match_knowledge` **não**
 * recebem `caller.db` como dependência onde a gravação é de
 * `ai_invocations` — mesmo racional já registrado em `content-strategist`:
 * um `operator` não tem `INSERT` nessa tabela, e usar o cliente do
 * chamador para essa parte descartaria o registro de custo em silêncio.
 *
 * ## Por que A4 roda dentro desta função, não numa Edge Function separada
 *
 * O documento 05 modela A3 e A4 como agentes distintos — e continuam
 * distintos ao nível que importa de verdade: prompts, `output_schema` e
 * `model_hint` diferentes (`content_factory.*` em `claude-sonnet-5`,
 * `content_reviewer.evaluate` em `claude-opus-5`), com o gateway escolhendo
 * o modelo por prompt, não por Edge Function que chama. O padrão
 * documentado (`docs/04 §1`) prevê n8n orquestrando duas chamadas HTTP via
 * um `automation-dispatch` compartilhado — que é escopo da FASE 20, ainda
 * não construído (mesma lacuna já registrada para `market-intelligence` na
 * FASE 4). Sem esse orquestrador, dividir A3/A4 em duas Edge Functions só
 * empurraria a responsabilidade de encadear as duas chamadas para o
 * frontend, sem ganho real — por isso A4 roda como a última etapa desta
 * mesma execução. Revisitar quando a FASE 20 entregar o dispatcher.
 *
 * ## Falha em qualquer etapa de A3 aborta o pipeline inteiro
 *
 * Nada é gravado em `content_assets` até as seis etapas terminarem — uma
 * peça pela metade seria pior que nenhuma peça. As chamadas de IA já feitas
 * antes da falha continuam registradas em `ai_invocations` (o custo é
 * real e visível), mesmo que o resultado final não seja gravado. Falha só
 * de A4 (depois de A3 já ter gravado a peça) não desfaz a peça — ela fica
 * com `status: 'review'` e sem `content_reviews`, visível como pendente de
 * revisão na biblioteca, nunca escondida.
 *
 * ## RAG: falha de embedding degrada para "sem contexto", não aborta
 *
 * A regra de fundamentação (docs/05 §3) já trata recuperação vazia como
 * estado válido — "não há informação na base" é uma resposta legítima, não
 * um erro. Por isso, se `embed()` falhar (ex.: `OPENAI_API_KEY` ausente),
 * o pipeline segue com `rag_context` vazio em vez de abortar a geração
 * inteira por causa de uma etapa auxiliar.
 */
import { authenticate } from "../_shared/auth.ts";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { invoke } from "../_shared/ai-gateway/gateway.ts";
import { embed } from "../_shared/ai-gateway/embeddings.ts";
import {
  collectGroundedOn,
  formatRagContext,
  formatStructureForCopy,
} from "./ragContext.ts";
import type { MatchedChunk, StructureSection } from "./ragContext.ts";
import { generatePieceSchema } from "./validate.ts";
import { z } from "zod";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-correlation-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RAG_LIMIT = 5;
const RAG_MIN_SIMILARITY = 0.7;

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

function joinOrNone(list: string[] | null | undefined): string {
  return list && list.length > 0 ? list.join(", ") : "(nenhuma)";
}

interface AngleResult {
  refined_angle: string;
  target_pain_point: string;
  differentiator_used?: string;
}
interface HookResult {
  hook: string;
  hook_rationale: string;
}
interface StructureResult {
  sections: StructureSection[];
}
interface CopyResult {
  headline: string;
  body: string;
  hashtags: string[];
}
interface CtaResult {
  cta: string;
}
interface VisualBriefResult {
  visual_brief: string;
}
interface ReviewResult {
  score: number;
  dimensions: Record<string, number>;
  issues: { severity: string; description: string }[];
  suggestions: string;
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "content-factory" });

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
        "Só owner, admin ou operator pode gerar peça de conteúdo",
      );
    }

    const json = await request.json().catch(() => {
      throw new AppError(
        "bad_request",
        "Corpo da requisição não é JSON válido",
      );
    });
    const payload = generatePieceSchema.parse(json);

    const { data: idea, error: ideaError } = await caller.db
      .from("content_ideas")
      .select("title, angle, hook, rationale, intent, pillar_id")
      .eq("id", payload.idea_id)
      .maybeSingle();
    if (ideaError) {
      throw new AppError("internal", "Falha ao carregar ideia", {
        cause: ideaError,
      });
    }
    if (!idea) {
      throw new AppError("not_found", "Ideia de conteúdo não encontrada");
    }

    const { data: format, error: formatError } = await caller.db
      .from("content_formats")
      .select("key, channel, spec")
      .eq("id", payload.format_id)
      .maybeSingle();
    if (formatError) {
      throw new AppError("internal", "Falha ao carregar formato", {
        cause: formatError,
      });
    }
    if (!format) {
      throw new AppError("not_found", "Formato de conteúdo não encontrado");
    }

    let pillarName = "Geral";
    if (idea.pillar_id) {
      const { data: pillar, error: pillarError } = await caller.db
        .from("content_pillars")
        .select("name")
        .eq("id", idea.pillar_id)
        .maybeSingle();
      if (pillarError) {
        throw new AppError("internal", "Falha ao carregar pilar", {
          cause: pillarError,
        });
      }
      if (pillar) pillarName = pillar.name;
    }

    const { data: brand, error: brandError } = await caller.db
      .from("brand_profiles")
      .select(
        "tone, audience, differentiators, forbidden_words, preferred_words",
      )
      .eq("organization_id", caller.organizationId)
      .eq("is_active", true)
      .maybeSingle();
    if (brandError) {
      throw new AppError("internal", "Falha ao carregar perfil de marca", {
        cause: brandError,
      });
    }
    if (!brand) {
      throw new AppError(
        "misconfigured",
        "Nenhum perfil de marca ativo configurado para esta organização",
      );
    }

    const formatSpec = JSON.stringify(format.spec ?? {});
    const brandTone = brand.tone ?? "(não definido)";
    const brandAudience = brand.audience ?? "(não definido)";
    const brandDifferentiators = joinOrNone(brand.differentiators);
    const forbiddenWords = joinOrNone(brand.forbidden_words);
    const preferredWords = joinOrNone(brand.preferred_words);

    // ── Etapa 1: ângulo ──────────────────────────────────────────────────────
    const angleResult = await invoke<AngleResult>({
      promptKey: "content_factory.angle",
      operation: "content_factory",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "content_idea", id: payload.idea_id },
      variables: {
        idea_title: idea.title,
        idea_angle: idea.angle ?? "(não definido)",
        idea_hook: idea.hook ?? "(não definido)",
        idea_rationale: idea.rationale ?? "(não definido)",
        intent: idea.intent ?? "(não definido)",
        pillar_name: pillarName,
        format_key: format.key,
        format_spec: formatSpec,
        brand_tone: brandTone,
        brand_audience: brandAudience,
        brand_differentiators: brandDifferentiators,
      },
    });
    if (!angleResult.ok) {
      scoped.error("falha na etapa 'ângulo'", null, {
        code: angleResult.error.code,
        message: angleResult.error.message,
      });
      return jsonResponse(
        { error: angleResult.error, step: "angle" },
        502,
        correlationId,
      );
    }

    // ── Etapa 2: hook ────────────────────────────────────────────────────────
    const hookResult = await invoke<HookResult>({
      promptKey: "content_factory.hook",
      operation: "content_factory",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "content_idea", id: payload.idea_id },
      variables: {
        refined_angle: angleResult.data.refined_angle,
        target_pain_point: angleResult.data.target_pain_point,
        intent: idea.intent ?? "(não definido)",
        pillar_name: pillarName,
        format_key: format.key,
        brand_tone: brandTone,
        preferred_words: preferredWords,
        forbidden_words: forbiddenWords,
      },
    });
    if (!hookResult.ok) {
      scoped.error("falha na etapa 'hook'", null, {
        code: hookResult.error.code,
        message: hookResult.error.message,
      });
      return jsonResponse(
        { error: hookResult.error, step: "hook" },
        502,
        correlationId,
      );
    }

    // ── RAG: embedding + busca vetorial, degrada para "sem contexto" ─────────
    const ragQuery =
      `${angleResult.data.refined_angle}\n${hookResult.data.hook}\n${idea.title}`;
    let matchedChunks: MatchedChunk[] = [];
    const embedResult = await embed(
      {
        organizationId: caller.organizationId,
        text: ragQuery,
        operation: "content_factory_rag",
        correlationId,
        subject: { type: "content_idea", id: payload.idea_id },
      },
      { log: scoped },
    );
    if (embedResult.ok) {
      const { data: matches, error: matchError } = await caller.db.rpc(
        "match_knowledge",
        {
          p_organization_id: caller.organizationId,
          p_query_embedding: embedResult.embedding,
          p_limit: RAG_LIMIT,
          p_min_similarity: RAG_MIN_SIMILARITY,
        },
      );
      if (matchError) {
        scoped.warn(
          "falha ao buscar contexto de conhecimento — seguindo sem contexto",
          {
            error: matchError.message,
          },
        );
      } else {
        matchedChunks = (matches ?? []) as MatchedChunk[];
      }
    } else {
      scoped.warn(
        "falha ao gerar embedding da consulta — seguindo sem contexto de conhecimento",
        {
          code: embedResult.error.code,
        },
      );
    }
    const ragContext = formatRagContext(matchedChunks);

    // ── Etapa 3: estrutura ───────────────────────────────────────────────────
    const structureResult = await invoke<StructureResult>({
      promptKey: "content_factory.structure",
      operation: "content_factory",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "content_idea", id: payload.idea_id },
      variables: {
        refined_angle: angleResult.data.refined_angle,
        hook: hookResult.data.hook,
        intent: idea.intent ?? "(não definido)",
        pillar_name: pillarName,
        format_key: format.key,
        format_spec: formatSpec,
        rag_context: ragContext,
      },
    });
    if (!structureResult.ok) {
      scoped.error("falha na etapa 'estrutura'", null, {
        code: structureResult.error.code,
        message: structureResult.error.message,
      });
      return jsonResponse(
        { error: structureResult.error, step: "structure" },
        502,
        correlationId,
      );
    }
    const groundedOn = collectGroundedOn(
      structureResult.data.sections,
      matchedChunks,
    );
    const structureText = formatStructureForCopy(structureResult.data.sections);

    // ── Etapa 4: copy ────────────────────────────────────────────────────────
    const copyResult = await invoke<CopyResult>({
      promptKey: "content_factory.copy",
      operation: "content_factory",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "content_idea", id: payload.idea_id },
      variables: {
        hook: hookResult.data.hook,
        structure: structureText,
        format_key: format.key,
        format_spec: formatSpec,
        brand_tone: brandTone,
        forbidden_words: forbiddenWords,
        preferred_words: preferredWords,
      },
    });
    if (!copyResult.ok) {
      scoped.error("falha na etapa 'copy'", null, {
        code: copyResult.error.code,
        message: copyResult.error.message,
      });
      return jsonResponse(
        { error: copyResult.error, step: "copy" },
        502,
        correlationId,
      );
    }

    // ── Etapa 5: CTA ─────────────────────────────────────────────────────────
    const ctaResult = await invoke<CtaResult>({
      promptKey: "content_factory.cta",
      operation: "content_factory",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "content_idea", id: payload.idea_id },
      variables: {
        body: copyResult.data.body,
        intent: idea.intent ?? "(não definido)",
        pillar_name: pillarName,
      },
    });
    if (!ctaResult.ok) {
      scoped.error("falha na etapa 'CTA'", null, {
        code: ctaResult.error.code,
        message: ctaResult.error.message,
      });
      return jsonResponse(
        { error: ctaResult.error, step: "cta" },
        502,
        correlationId,
      );
    }

    // ── Etapa 6: briefing visual ─────────────────────────────────────────────
    const visualResult = await invoke<VisualBriefResult>({
      promptKey: "content_factory.visual_brief",
      operation: "content_factory",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "content_idea", id: payload.idea_id },
      variables: {
        headline: copyResult.data.headline,
        body: copyResult.data.body,
        format_key: format.key,
        format_spec: formatSpec,
      },
    });
    if (!visualResult.ok) {
      scoped.error("falha na etapa 'briefing visual'", null, {
        code: visualResult.error.code,
        message: visualResult.error.message,
      });
      return jsonResponse(
        { error: visualResult.error, step: "visual_brief" },
        502,
        correlationId,
      );
    }

    // ── Grava a peça (A3 concluído) ──────────────────────────────────────────
    const { data: asset, error: assetError } = await caller.db
      .from("content_assets")
      .insert({
        organization_id: caller.organizationId,
        idea_id: payload.idea_id,
        format_id: payload.format_id,
        channel: format.channel,
        headline: copyResult.data.headline,
        hook: hookResult.data.hook,
        body: copyResult.data.body,
        cta: ctaResult.data.cta,
        hashtags: copyResult.data.hashtags ?? [],
        visual_brief: visualResult.data.visual_brief,
        grounded_on: groundedOn,
        ai_generated: true,
        model: copyResult.model,
        status: "review",
      })
      .select()
      .single();
    if (assetError) {
      throw new AppError(
        "internal",
        "Peça gerada, mas não foi possível gravar",
        { cause: assetError },
      );
    }
    const assetId = (asset as { id: string }).id;
    scoped.info("peça de conteúdo gerada", {
      assetId,
      chunksUsados: groundedOn.length,
    });

    // ── Etapa A4: revisão, não bloqueia a resposta se falhar ─────────────────
    const reviewResult = await invoke<ReviewResult>({
      promptKey: "content_reviewer.evaluate",
      operation: "content_reviewer",
      organizationId: caller.organizationId,
      correlationId,
      subject: { type: "content_asset", id: assetId },
      variables: {
        headline: copyResult.data.headline,
        hook: hookResult.data.hook,
        body: copyResult.data.body,
        cta: ctaResult.data.cta,
        hashtags: joinOrNone(copyResult.data.hashtags),
        visual_brief: visualResult.data.visual_brief,
        grounded_on: JSON.stringify(groundedOn),
        pillar_name: pillarName,
        intent: idea.intent ?? "(não definido)",
        brand_tone: brandTone,
        forbidden_words: forbiddenWords,
        preferred_words: preferredWords,
      },
    });

    let review: ReviewResult | null = null;
    if (reviewResult.ok) {
      const { error: reviewInsertError } = await caller.db.from(
        "content_reviews",
      ).insert({
        organization_id: caller.organizationId,
        asset_id: assetId,
        score: reviewResult.data.score,
        dimensions: reviewResult.data.dimensions,
        issues: reviewResult.data.issues,
        suggestions: reviewResult.data.suggestions,
        reviewer_type: "ai",
        model: reviewResult.model,
      });
      if (reviewInsertError) {
        scoped.warn("revisão gerada, mas falhou ao gravar", {
          error: reviewInsertError.message,
        });
      } else {
        review = reviewResult.data;
      }
    } else {
      scoped.warn(
        "falha ao gerar revisão automática — peça fica pendente de revisão",
        {
          code: reviewResult.error.code,
        },
      );
    }

    return jsonResponse({ asset, review }, 201, correlationId);
  } catch (thrown) {
    const error = thrown instanceof z.ZodError
      ? new AppError("bad_request", "Payload inválido", {
        detail: { issues: thrown.issues },
      })
      : toAppError(thrown);
    log.error("falha ao gerar peça de conteúdo", error);
    return jsonResponse(
      error.toResponseBody(),
      error.httpStatus,
      correlationId,
    );
  }
});
