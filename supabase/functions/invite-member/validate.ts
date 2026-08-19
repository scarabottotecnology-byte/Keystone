/**
 * Contrato do payload de `invite-member`.
 *
 * Módulo puro — sem Deno, sem rede — para que o esquema seja testável no
 * mesmo vitest do frontend, como os demais módulos de `_shared/`.
 *
 * `owner` fica fora do enum de propósito: é concedido só pelo bootstrap do
 * primeiro usuário (`app.handle_new_user`, na migração `platform_identity`),
 * nunca por convite. Um admin convidando outro owner não é o que esta rota
 * existe para fazer.
 */
import { z } from "zod";

export const invitePayloadSchema = z.object({
  email: z.string().trim().min(1, "E-mail obrigatório").max(320).email(
    "E-mail inválido",
  ),
  role: z.enum(["admin", "operator", "analyst", "viewer"]),
});

export type InvitePayload = z.infer<typeof invitePayloadSchema>;
