/**
 * knowledge-ingest — pipeline de ingestão da base de conhecimento (docs/05
 * §3; docs/12, FASE 5, subtarefa 3).
 *
 * Interativa (JWT de operador) — quem sobe um documento ou cola uma URL é
 * um humano de verdade clicando um botão, não um cron. Mesmo padrão de
 * auth de `content-strategist`.
 *
 * ## Escopo desta implementação: `manual` e `url` completos; `pdf`/`pptx`/
 * `docx` recusados com erro explícito
 *
 * Extrair texto de PDF/PPTX/DOCX em runtime Deno exige uma biblioteca de
 * parsing binário que este projeto ainda não avaliou. Indexar um texto mal
 * extraído seria pior que recusar — a base de conhecimento existe
 * justamente para nunca inventar, e um chunk ilegível vira uma afirmação
 * errada em algum `content_assets.grounded_on` mais adiante. Os dois
 * caminhos que não dependem de parsing binário (`manual`: texto colado
 * direto; `url`: busca + limpeza HTML, reaproveitando `_shared/
 * sourceContent.ts`, a mesma limpeza que A1 já usa) são entregues agora —
 * os outros três `source_type` continuam no vocabulário aceito pelo
 * schema (é o valor real da coluna, docs/02 §4.2), mas o handler devolve
 * `bad_request` com mensagem clara em vez de tentar e produzir lixo.
 *
 * ## Por que `caller.db` grava `knowledge_documents` mas não `knowledge_chunks`
 *
 * `knowledge_documents` tem `operator_insert`/`operator_update` — o
 * operador que sobe o documento é o autor de verdade da linha, então o
 * cliente RLS-escopado do chamador grava e atualiza normalmente.
 * `knowledge_chunks` não tem política de escrita para `authenticated` por
 * desenho (nenhum humano grava embedding à mão, migração
 * `brand_and_knowledge_base.sql`) — por isso os chunks são gravados com um
 * cliente `service_role` próprio desta função, o mesmo racional já
 * registrado para `ai_invocations` em `content-strategist`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authenticate } from "../_shared/auth.ts";
import { AppError, toAppError } from "../_shared/errors.ts";
import { CORRELATION_HEADER, correlationIdFrom } from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { extractPlainText, truncate } from "../_shared/sourceContent.ts";
import { embed } from "../_shared/ai-gateway/embeddings.ts";
import { chunkText } from "./chunk.ts";
import { ingestSchema } from "./validate.ts";
import { z } from "zod";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-correlation-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FETCH_TIMEOUT_MS = 15_000;
// Bem maior que o limite de A1 (6000 caracteres): lá o texto vira parte de
// um único prompt de análise; aqui o texto inteiro é fatiado em chunks, não
// resumido — truncar em silêncio apagaria parte real do documento. Um
// documento maior que isto é erro explícito, nunca corte silencioso.
const MAX_INGEST_CHARS = 200_000;
const UNSUPPORTED_SOURCE_TYPES = new Set(["pdf", "pptx", "docx"]);

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new AppError("misconfigured", `Variável de ambiente ausente: ${name}`);
  return value;
}

function serviceRoleClient(): SupabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function jsonResponse(body: unknown, status: number, correlationId: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json", [CORRELATION_HEADER]: correlationId },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchAndClean(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new AppError("bad_request", `Falha ao buscar URL: HTTP ${response.status}`);
    const raw = await response.text();
    return extractPlainText(raw);
  } catch (thrown) {
    if (thrown instanceof AppError) throw thrown;
    throw new AppError("bad_request", "Falha ao buscar ou ler a URL informada", { cause: thrown });
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "knowledge-ingest" });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (request.method !== "POST") {
      throw new AppError("bad_request", "Método não suportado — use POST");
    }

    const caller = await authenticate(request);
    const scoped = log.child({ organizationId: caller.organizationId, userId: caller.userId });

    // Mesma checagem explícita de `content-strategist`: falhar aqui evita
    // gastar uma chamada de embedding com um resultado que nunca seria
    // salvo (a RLS de `operator_insert` bloquearia de qualquer forma).
    const { data: membership, error: membershipError } = await caller.db
      .from("memberships")
      .select("role")
      .eq("organization_id", caller.organizationId)
      .eq("user_id", caller.userId)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) {
      throw new AppError("internal", "Falha ao verificar papel do requisitante", { cause: membershipError });
    }
    const role = membership?.role;
    if (!role || !["owner", "admin", "operator"].includes(role)) {
      throw new AppError("forbidden", "Só owner, admin ou operator pode indexar conhecimento");
    }

    const json = await request.json().catch(() => {
      throw new AppError("bad_request", "Corpo da requisição não é JSON válido");
    });
    const payload = ingestSchema.parse(json);

    if (UNSUPPORTED_SOURCE_TYPES.has(payload.source_type)) {
      throw new AppError(
        "bad_request",
        `Extração de '${payload.source_type}' ainda não implementada — use 'manual' (colar o texto) ou 'url'.`,
      );
    }

    const content = payload.source_type === "manual"
      ? payload.content!.trim()
      : await fetchAndClean(payload.source_url!);

    if (content.length === 0) {
      throw new AppError("bad_request", "Conteúdo vazio após extração — nada para indexar");
    }
    if (content.length > MAX_INGEST_CHARS) {
      throw new AppError(
        "bad_request",
        `Documento com ${content.length} caracteres, acima do limite de ${MAX_INGEST_CHARS} — divida em partes menores antes de enviar.`,
      );
    }

    const checksum = await sha256Hex(content);

    const { data: doc, error: docError } = await caller.db
      .from("knowledge_documents")
      .insert({
        organization_id: caller.organizationId,
        title: payload.title,
        source_type: payload.source_type,
        source_url: payload.source_type === "url" ? payload.source_url : null,
        checksum,
        status: "processing",
        created_by: caller.userId,
      })
      .select("id")
      .single();

    if (docError) {
      // 23505 = unique_violation em (organization_id, checksum): mesmo
      // conteúdo já indexado antes — resposta clara, não erro genérico.
      if ((docError as { code?: string }).code === "23505") {
        throw new AppError("conflict", "Um documento com este mesmo conteúdo já foi indexado nesta organização");
      }
      throw new AppError("internal", "Falha ao registrar documento", { cause: docError });
    }
    const documentId = (doc as { id: string }).id;

    const chunks = chunkText(content);
    if (chunks.length === 0) {
      await caller.db.from("knowledge_documents")
        .update({ status: "failed", error: "Nenhum chunk gerado a partir do conteúdo" })
        .eq("id", documentId);
      throw new AppError("bad_request", "Conteúdo não gerou nenhum chunk indexável");
    }

    const chunksDb = serviceRoleClient();
    let indexed = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedResult = await embed(
        {
          organizationId: caller.organizationId,
          text: chunk,
          operation: "knowledge_ingest",
          correlationId,
          subject: { type: "knowledge_document", id: documentId },
        },
        { log: scoped },
      );

      if (!embedResult.ok) {
        scoped.warn("falha ao gerar embedding de um chunk — os demais seguem", {
          chunkIndex: i,
          code: embedResult.error.code,
        });
        continue;
      }

      const { error: chunkError } = await chunksDb.from("knowledge_chunks").insert({
        organization_id: caller.organizationId,
        document_id: documentId,
        chunk_index: i,
        content: chunk,
        token_count: Math.ceil(chunk.length / 4),
        embedding: embedResult.embedding,
      });

      if (chunkError) {
        scoped.warn("falha ao gravar um chunk — os demais seguem", { chunkIndex: i, error: chunkError.message });
        continue;
      }
      indexed++;
    }

    if (indexed === 0) {
      await caller.db.from("knowledge_documents")
        .update({ status: "failed", error: "Falha ao gerar ou gravar embedding de todos os chunks" })
        .eq("id", documentId);
      throw new AppError("upstream_error", "Nenhum chunk foi indexado — falha ao gerar embeddings");
    }

    await caller.db.from("knowledge_documents")
      .update({ status: "indexed", indexed_at: new Date().toISOString() })
      .eq("id", documentId);

    scoped.info("documento indexado", { documentId, chunksTotal: chunks.length, chunksIndexed: indexed });

    return jsonResponse(
      { document_id: documentId, status: "indexed", chunks_total: chunks.length, chunks_indexed: indexed },
      201,
      correlationId,
    );
  } catch (thrown) {
    const error = thrown instanceof z.ZodError
      ? new AppError("bad_request", "Payload inválido", { detail: { issues: thrown.issues } })
      : toAppError(thrown);
    log.error("falha na ingestão de conhecimento", error);
    return jsonResponse(error.toResponseBody(), error.httpStatus, correlationId);
  }
});
