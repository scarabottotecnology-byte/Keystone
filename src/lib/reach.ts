import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Envia o lead do formulário para a lista de contatos do Hostinger Reach
 * (e-mail marketing). Roda só no servidor: o token da API da Hostinger fica
 * na variável de ambiente HOSTINGER_API_TOKEN, cadastrada no hPanel, e nunca
 * chega ao navegador.
 *
 * Sem o token configurado, a função não faz nada — o lead continua sendo
 * gravado no Supabase normalmente.
 */

const REACH_API_BASE = "https://developers.hostinger.com";

/** Perfil "Keystone Contabilidade & Controladoria" no Reach. Não é segredo. */
const DEFAULT_REACH_PROFILE_UUID = "b79b638a-1c32-4fee-8a13-a5b2eab39105";

const reachLeadSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254),
  telefone: z.string().trim().max(40).optional(),
  origem: z.string().trim().max(200),
});

export type ReachLeadInput = z.infer<typeof reachLeadSchema>;

/** O Reach só aceita telefone no formato E.164 (+5511987654321). */
export function toE164(telefone: string | undefined): string | undefined {
  if (!telefone) return undefined;
  const digits = telefone.replace(/\D/g, "");
  if (telefone.trim().startsWith("+") && digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }
  // Número brasileiro digitado sem o +55: DDD + 8 ou 9 dígitos.
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  // Já veio com o 55 na frente, sem o +.
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13))
    return `+${digits}`;
  return undefined;
}

export function splitName(nome: string): { name: string; surname?: string } {
  const parts = nome.trim().split(/\s+/);
  const [first, ...rest] = parts;
  return rest.length > 0 ? { name: first, surname: rest.join(" ") } : { name: first };
}

export const subscribeLeadToReach = createServerFn({ method: "POST" })
  .validator((input: unknown) => reachLeadSchema.parse(input))
  .handler(async ({ data }) => {
    const token = process.env.HOSTINGER_API_TOKEN;
    if (!token) {
      console.warn("HOSTINGER_API_TOKEN não configurado: lead não enviado ao Reach.");
      return { ok: false as const, skipped: true as const };
    }
    const profileUuid = process.env.REACH_PROFILE_UUID || DEFAULT_REACH_PROFILE_UUID;

    const phone = toE164(data.telefone);
    const body = {
      email: data.email,
      ...splitName(data.nome),
      ...(phone ? { phone } : {}),
      note: `Lead do site: ${data.origem}`,
    };

    try {
      const response = await fetch(
        `${REACH_API_BASE}/api/reach/v1/profiles/${encodeURIComponent(profileUuid)}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error(`Reach recusou o contato (HTTP ${response.status}): ${detail.slice(0, 500)}`);
        return { ok: false as const, skipped: false as const };
      }
      return { ok: true as const, skipped: false as const };
    } catch (err) {
      console.error("Falha ao enviar lead ao Reach:", err);
      return { ok: false as const, skipped: false as const };
    }
  });
