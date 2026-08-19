/**
 * Convida um novo membro para a Keystone — subtarefa 9 da FASE 2, com escopo
 * reduzido pelo ADR-014: sem tela de "criar organização", sem seletor. O que
 * resta do fluxo original é só isto — um admin trazendo alguém para dentro da
 * organização única.
 *
 * ## Onde o service_role entra, e onde ele não entra
 *
 * Criar um usuário de autenticação exige privilégio que a RLS não concede a
 * ninguém — é o único motivo para tocar `service_role` aqui. A gravação que
 * de fato importa, a `membership`, usa `caller.db`, o cliente do próprio
 * chamador: quem decide se o convite pode acontecer é a política
 * `admin_insert`, não este código. Usar `service_role` para os dois passos
 * seria a mesma classe de falha do achado C-01, só que numa Edge Function em
 * vez de numa migração.
 */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authenticate } from "../_shared/auth.ts";
import { AppError, toAppError } from "../_shared/errors.ts";
import {
  CORRELATION_HEADER,
  correlationIdFrom,
} from "../_shared/correlation.ts";
import { createLogger } from "../_shared/log.ts";
import { invitePayloadSchema } from "./validate.ts";

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

Deno.serve(async (request) => {
  const correlationId = correlationIdFrom(request);
  const log = createLogger({ correlationId, fn: "invite-member" });

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

    const json = await request.json().catch(() => {
      throw new AppError(
        "bad_request",
        "Corpo da requisição não é JSON válido",
      );
    });
    const payload = invitePayloadSchema.parse(json);

    // Checagem explícita antes de gastar a chamada de convite: a RLS de
    // `admin_insert` bloquearia de qualquer forma na gravação da membership,
    // mas falhar aqui evita criar um usuário órfão sem vínculo nenhum.
    const { data: callerMembership, error: roleError } = await caller.db
      .from("memberships")
      .select("role")
      .eq("organization_id", caller.organizationId)
      .eq("user_id", caller.userId)
      .eq("status", "active")
      .maybeSingle();

    if (roleError) {
      throw new AppError(
        "internal",
        "Falha ao verificar papel do requisitante",
        {
          cause: roleError,
        },
      );
    }
    if (
      !callerMembership ||
      (callerMembership.role !== "owner" && callerMembership.role !== "admin")
    ) {
      throw new AppError("forbidden", "Só owner ou admin pode convidar membro");
    }

    const admin = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let newUserId: string;
    const { data: invited, error: inviteError } = await admin.auth.admin
      .inviteUserByEmail(payload.email);

    if (inviteError) {
      const alreadyRegistered = /already.*(registered|exists)/i.test(
        inviteError.message,
      );
      if (!alreadyRegistered) {
        throw new AppError("upstream_error", "Falha ao convidar por e-mail", {
          cause: inviteError,
        });
      }

      // A pessoa já tem conta Keystone. A API admin não tem um
      // `getUserByEmail` direto; listar é a única saída, e perPage cobre a
      // escala real de uma ferramenta interna de uma organização só
      // (ADR-014) — não a de um produto com milhares de contas.
      const { data: page, error: listError } = await admin.auth.admin.listUsers(
        {
          page: 1,
          perPage: 200,
        },
      );
      if (listError) {
        throw new AppError("internal", "Falha ao localizar usuário existente", {
          cause: listError,
        });
      }
      const existing = page.users.find(
        (u) => u.email?.toLowerCase() === payload.email.toLowerCase(),
      );
      if (!existing) {
        throw new AppError(
          "upstream_error",
          "E-mail já registrado, mas não encontrado",
          {
            cause: inviteError,
          },
        );
      }
      newUserId = existing.id;
    } else {
      newUserId = invited.user.id;
    }

    const { error: membershipError } = await caller.db.from("memberships")
      .insert({
        organization_id: caller.organizationId,
        user_id: newUserId,
        role: payload.role,
        status: "active",
        invited_by: caller.userId,
      });

    if (membershipError) {
      if (membershipError.code === "23505") {
        throw new AppError(
          "conflict",
          "Este e-mail já é membro da organização",
        );
      }
      throw new AppError(
        "internal",
        "Usuário convidado, mas o vínculo não foi criado",
        {
          cause: membershipError,
        },
      );
    }

    scoped.info("membro convidado", {
      invitedUserId: newUserId,
      role: payload.role,
    });

    return jsonResponse({ userId: newUserId }, 201, correlationId);
  } catch (thrown) {
    const error = thrown instanceof z.ZodError
      ? new AppError("bad_request", "Payload inválido", {
        detail: { issues: thrown.issues },
      })
      : toAppError(thrown);

    log.error("falha ao convidar membro", error);
    return jsonResponse(
      error.toResponseBody(),
      error.httpStatus,
      correlationId,
    );
  }
});
