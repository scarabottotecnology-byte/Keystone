/**
 * `social-publish` — o worker de publicação (FASE 6, subtarefas 5 a 8).
 *
 * Disparado pelo WF-002 a cada 15 minutos, sem usuário logado: autentica por
 * segredo compartilhado (`x-automation-secret`), igual a
 * `market-intelligence`. Não é o atalho do achado C-01 — não há sessão para
 * contornar, e o escopo por organização é resolvido explicitamente.
 *
 * ## As três camadas contra publicação duplicada
 *
 * Publicar duas vezes na página de uma consultoria é dano de marca, então
 * nenhuma camada sozinha é considerada suficiente (docs/08, invariante I-4):
 *
 *   1. **Lock pessimista** — `claim_publishing_job()` com `for update skip
 *      locked`. Dois workers concorrentes: um recebe o job, o outro recebe
 *      lista vazia.
 *   2. **Chave determinística gravada ANTES da chamada externa** —
 *      `sha256(asset : conta : run_at)` vira uma linha `social_posts` com
 *      status `scheduled`. Se o processo morrer entre a chamada e o registro
 *      do resultado, a linha já existe e a próxima tentativa a encontra.
 *   3. **Restrição de unicidade** — `unique (organization_id,
 *      idempotency_key)` no banco, como rede final: mesmo que as duas
 *      primeiras falhem, o INSERT colide em vez de duplicar.
 *
 * ## Timeout não é falha comum
 *
 * `upstream_error` significa "não publicou". `timeout` significa "não sei" —
 * a publicação pode ter acontecido do outro lado. Republicar cegamente aí é
 * exatamente o erro que a subtarefa 7 proíbe. O tratamento consulta a
 * plataforma; se encontrar o post, registra como sucesso; se não encontrar,
 * libera para nova tentativa; se não conseguir nem verificar, o job vai para
 * revisão humana (`failed` com `max_attempts` zerado no lugar de retentar).
 */
import { createClient } from "@supabase/supabase-js";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger, type Logger } from "../_shared/log.ts";
import { deriveIdempotencyKey } from "../_shared/idempotency.ts";
import {
  findRecentPostByCommentary,
  publishTextPost,
} from "../_shared/linkedin.ts";
import { composeCommentary } from "./commentary.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "content-type, x-automation-secret, x-correlation-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Quantos jobs um disparo do WF-002 processa. */
const BATCH_SIZE = 5;
/** Marca a conta como `expiring` quando falta menos que isto (subtarefa 8). */
const EXPIRY_WARNING_DAYS = 7;

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new AppError(
      "misconfigured",
      `Variável de ambiente ausente: ${name}`,
    );
  }
  return value;
}

// Dois construtores em vez de um com parâmetro: `createClient` codifica o
// schema no tipo, então uma função só devolveria a união
// `SupabaseClient<..., "public" | "private">`, que o `deno check` recusa
// atribuir ao `SupabaseClient` padrão.
function publicClient() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function privateClient() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "private" },
    },
  );
}

type PublicDb = ReturnType<typeof publicClient>;
type PrivateDb = ReturnType<typeof privateClient>;

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

function verifyAutomationSecret(request: Request): void {
  const expected = requiredEnv("AUTOMATION_WEBHOOK_SECRET");
  const provided = request.headers.get("x-automation-secret");
  if (!provided || provided !== expected) {
    throw new AppError(
      "unauthorized",
      "Segredo de automação ausente ou inválido",
    );
  }
}

interface Job {
  id: string;
  organization_id: string;
  asset_id: string;
  social_account_id: string;
  run_at: string;
  attempt: number;
  max_attempts: number;
}

interface JobOutcome {
  jobId: string;
  result:
    | "published"
    | "already_published"
    | "skipped_token"
    | "needs_human_review"
    | "retry_scheduled"
    | "failed";
  detail?: string;
}

/**
 * Marca a conta conforme a validade do token e devolve se ela pode publicar.
 *
 * Pausar o job (`skipped`) em vez de tentar e falhar é o que a subtarefa 8
 * pede: uma conta com token vencido geraria uma fila de falhas idênticas até
 * estourar `max_attempts`, escondendo o problema real atrás de ruído.
 */
async function assertAccountUsable(
  publicDb: PublicDb,
  account: { id: string; status: string; token_expires_at: string | null },
  log: Logger,
): Promise<boolean> {
  if (["expired", "revoked"].includes(account.status)) return false;

  if (!account.token_expires_at) return true;

  const expiresAt = new Date(account.token_expires_at).getTime();
  const now = Date.now();

  if (expiresAt <= now) {
    await publicDb.from("social_accounts")
      .update({ status: "expired", last_error: "Token vencido" })
      .eq("id", account.id);
    log.warn("token vencido — conta pausada", { accountId: account.id });
    return false;
  }

  const daysLeft = (expiresAt - now) / 86_400_000;
  if (daysLeft <= EXPIRY_WARNING_DAYS && account.status !== "expiring") {
    await publicDb.from("social_accounts")
      .update({ status: "expiring" })
      .eq("id", account.id);
    log.warn("token perto de vencer", {
      accountId: account.id,
      daysLeft: Math.floor(daysLeft),
    });
  }
  return true;
}

async function processJob(
  job: Job,
  deps: {
    publicDb: PublicDb;
    privateDb: PrivateDb;
    log: Logger;
    correlationId: string;
  },
): Promise<JobOutcome> {
  const { publicDb, privateDb, log } = deps;

  const { data: account, error: accountError } = await publicDb
    .from("social_accounts")
    .select(
      "id, provider, external_account_id, token_ref, status, token_expires_at",
    )
    .eq("id", job.social_account_id)
    .maybeSingle();
  if (accountError || !account) {
    throw new AppError("internal", "Conta social do job não encontrada", {
      cause: accountError,
    });
  }

  if (!await assertAccountUsable(publicDb, account, log)) {
    // `pending` de novo, não `failed`: o job não deu errado, a conta é que
    // não pode publicar agora. Volta para a fila sem consumir tentativa.
    await publicDb.from("publishing_jobs").update({
      status: "pending",
      attempt: job.attempt - 1,
      locked_at: null,
      locked_by: null,
      last_error: "Conta com token vencido ou revogado — reconecte a conta",
    }).eq("id", job.id);
    return { jobId: job.id, result: "skipped_token" };
  }

  const { data: asset, error: assetError } = await publicDb
    .from("content_assets")
    .select("headline, hook, body, cta, hashtags, status")
    .eq("id", job.asset_id)
    .maybeSingle();
  if (assetError || !asset) {
    throw new AppError("internal", "Peça do job não encontrada", {
      cause: assetError,
    });
  }
  if (asset.status !== "approved") {
    await publicDb.from("publishing_jobs").update({
      status: "cancelled",
      last_error:
        `Peça em status '${asset.status}' — só peça aprovada é publicada`,
    }).eq("id", job.id);
    return {
      jobId: job.id,
      result: "failed",
      detail: "peça não aprovada",
    };
  }

  const commentary = composeCommentary(asset);

  // ── Camada 2: chave gravada ANTES de qualquer chamada externa ────────────
  const idempotencyKey = await deriveIdempotencyKey([
    job.asset_id,
    job.social_account_id,
    job.run_at,
  ]);

  const { data: existing } = await publicDb
    .from("social_posts")
    .select("id, external_post_id, status")
    .eq("organization_id", job.organization_id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing?.external_post_id) {
    // Já publicado numa tentativa anterior que morreu antes de fechar o job.
    await publicDb.from("publishing_jobs").update({
      status: "succeeded",
      locked_at: null,
      locked_by: null,
    }).eq("id", job.id);
    log.info("job já tinha publicação registrada — nada a fazer", {
      jobId: job.id,
    });
    return { jobId: job.id, result: "already_published" };
  }

  let postId = existing?.id ?? null;
  if (!postId) {
    const { data: created, error: createError } = await publicDb
      .from("social_posts")
      .insert({
        organization_id: job.organization_id,
        asset_id: job.asset_id,
        social_account_id: job.social_account_id,
        channel: account.provider,
        status: "scheduled",
        idempotency_key: idempotencyKey,
      })
      .select("id")
      .single();
    // Camada 3: se outro worker inseriu no intervalo, a constraint pega.
    if (createError) {
      throw new AppError(
        "conflict",
        "Registro de publicação já existia para esta chave — outra execução está cuidando",
        { cause: createError },
      );
    }
    postId = (created as { id: string }).id;
  }

  const { data: tokenRow, error: tokenError } = await privateDb
    .from("oauth_tokens")
    .select("access_token")
    .eq("ref", account.token_ref)
    .maybeSingle();
  if (tokenError || !tokenRow) {
    throw new AppError("misconfigured", "Token da conta não encontrado", {
      cause: tokenError,
    });
  }

  try {
    const published = await publishTextPost({
      accessToken: tokenRow.access_token as string,
      authorUrn: account.external_account_id as string,
      commentary,
    });

    await publicDb.from("social_posts").update({
      external_post_id: published.externalPostId,
      permalink: published.permalink,
      published_at: new Date().toISOString(),
      status: "published",
      error: null,
    }).eq("id", postId);

    await publicDb.from("publishing_jobs").update({
      status: "succeeded",
      locked_at: null,
      locked_by: null,
      last_error: null,
    }).eq("id", job.id);

    log.info("publicado", { jobId: job.id, urn: published.externalPostId });
    return { jobId: job.id, result: "published" };
  } catch (thrown) {
    const error = toAppError(thrown);

    // ── Subtarefa 7: timeout não republica cegamente ──────────────────────
    if (error.code === "timeout") {
      log.warn("timeout na publicação — verificando na plataforma", {
        jobId: job.id,
      });
      try {
        const found = await findRecentPostByCommentary({
          accessToken: tokenRow.access_token as string,
          authorUrn: account.external_account_id as string,
          commentary,
        });

        if (found) {
          await publicDb.from("social_posts").update({
            external_post_id: found.externalPostId,
            permalink: found.permalink,
            published_at: new Date().toISOString(),
            status: "published",
            error: null,
          }).eq("id", postId);
          await publicDb.from("publishing_jobs").update({
            status: "succeeded",
            locked_at: null,
            locked_by: null,
            last_error:
              "Timeout, mas a publicação foi confirmada na plataforma",
          }).eq("id", job.id);
          return { jobId: job.id, result: "already_published" };
        }

        // Verificou e não achou: publicar de novo é seguro.
        await publicDb.from("publishing_jobs").update({
          status: "pending",
          locked_at: null,
          locked_by: null,
          last_error: "Timeout; verificado que não publicou — reenfileirado",
        }).eq("id", job.id);
        return { jobId: job.id, result: "retry_scheduled" };
      } catch (verifyThrown) {
        // Não deu para verificar. Retentar às cegas pode duplicar; parar
        // silenciosamente esconderia o problema. Vai para revisão humana:
        // `attempt` no teto impede que o cron pegue de novo sozinho.
        const verifyError = toAppError(verifyThrown);
        await publicDb.from("publishing_jobs").update({
          status: "failed",
          attempt: job.max_attempts,
          locked_at: null,
          locked_by: null,
          last_error:
            `Timeout e não foi possível verificar na plataforma (${verifyError.message}). ` +
            `Confira a página no LinkedIn antes de reenfileirar — pode ter publicado.`,
        }).eq("id", job.id);
        await publicDb.from("social_posts").update({
          status: "failed",
          error: "Timeout sem verificação possível — conferir manualmente",
        }).eq("id", postId);
        log.error(
          "timeout sem verificação — job em revisão humana",
          verifyError,
          {
            jobId: job.id,
          },
        );
        return {
          jobId: job.id,
          result: "needs_human_review",
          detail: verifyError.message,
        };
      }
    }

    const exhausted = job.attempt >= job.max_attempts;
    await publicDb.from("publishing_jobs").update({
      status: "failed",
      locked_at: null,
      locked_by: null,
      last_error: error.message,
    }).eq("id", job.id);
    await publicDb.from("social_posts").update({
      status: "failed",
      error: error.message,
    }).eq("id", postId);

    log.error("falha ao publicar", error, { jobId: job.id, exhausted });
    return { jobId: job.id, result: "failed", detail: error.message };
  }
}

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "social-publish" });

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const publicDb = publicClient();
  let runId: string | null = null;

  try {
    if (request.method !== "POST") {
      throw new AppError("bad_request", "Método não suportado — use POST");
    }
    verifyAutomationSecret(request);

    const { data: org, error: orgError } = await publicDb
      .from("organizations")
      .select("id")
      .eq("slug", "keystone")
      .single();
    if (orgError || !org) {
      throw new AppError("internal", "Organização Keystone não encontrada", {
        cause: orgError,
      });
    }
    const organizationId = (org as { id: string }).id;

    const { data: run } = await publicDb.from("automation_runs").insert({
      organization_id: organizationId,
      definition_key: "WF-002-daily-publishing",
      correlation_id: correlationId,
      trigger_type: "schedule",
    }).select("id").single();
    runId = (run as { id: string } | null)?.id ?? null;

    // ── Camada 1: lock pessimista ────────────────────────────────────────
    const worker = `social-publish:${correlationId}`;
    const { data: jobs, error: claimError } = await publicDb.rpc(
      "claim_publishing_job",
      {
        p_organization_id: organizationId,
        p_worker: worker,
        p_limit: BATCH_SIZE,
      },
    );
    if (claimError) {
      throw new AppError("internal", "Falha ao reivindicar jobs", {
        cause: claimError,
      });
    }

    const claimed = (jobs ?? []) as Job[];
    if (claimed.length === 0) {
      if (runId) {
        await publicDb.from("automation_runs").update({
          status: "succeeded",
          finished_at: new Date().toISOString(),
          items_processed: 0,
        }).eq("id", runId);
      }
      return jsonResponse({ claimed: 0, results: [] }, 200, correlationId);
    }

    const privateDb = privateClient();
    const results: JobOutcome[] = [];

    for (const job of claimed) {
      const scoped = log.child({ organizationId, jobId: job.id });
      try {
        results.push(
          await processJob(job, {
            publicDb,
            privateDb,
            log: scoped,
            correlationId,
          }),
        );
      } catch (thrown) {
        // Um job com problema não pode impedir os outros da leva de rodar.
        const error = toAppError(thrown);
        scoped.error("job abortado", error);
        await publicDb.from("publishing_jobs").update({
          status: "failed",
          locked_at: null,
          locked_by: null,
          last_error: error.message,
        }).eq("id", job.id);
        results.push({
          jobId: job.id,
          result: "failed",
          detail: error.message,
        });
      }
    }

    const succeeded = results.filter((r) =>
      r.result === "published" || r.result === "already_published"
    ).length;

    if (runId) {
      await publicDb.from("automation_runs").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        items_processed: results.length,
        items_succeeded: succeeded,
        items_failed: results.length - succeeded,
      }).eq("id", runId);
    }

    log.info("leva concluída", { claimed: claimed.length, succeeded });
    return jsonResponse(
      { claimed: claimed.length, results },
      200,
      correlationId,
    );
  } catch (thrown) {
    const error = toAppError(thrown);
    log.error("falha na execução de social-publish", error);
    if (runId) {
      try {
        await publicDb.from("automation_runs").update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_summary: error.message,
        }).eq("id", runId);
      } catch {
        // Melhor esforço: a run fica "running" e aparece como travada em
        // qualquer painel, em vez de sumir — mas não derruba a resposta.
      }
    }
    return jsonResponse(
      error.toResponseBody(),
      error.httpStatus,
      correlationId,
    );
  }
});
