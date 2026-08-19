import { describe, expect, it } from "vitest";
import { invitePayloadSchema } from "./validate.ts";

describe("invitePayloadSchema", () => {
  it("aceita e-mail e papel válidos", () => {
    const result = invitePayloadSchema.safeParse({
      email: "pessoa@keystone.com.br",
      role: "operator",
    });
    expect(result.success).toBe(true);
  });

  it("apara espaço do e-mail", () => {
    const result = invitePayloadSchema.parse({
      email: "  pessoa@keystone.com.br  ",
      role: "viewer",
    });
    expect(result.email).toBe("pessoa@keystone.com.br");
  });

  it("rejeita e-mail malformado", () => {
    const result = invitePayloadSchema.safeParse({
      email: "não é e-mail",
      role: "viewer",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail vazio", () => {
    const result = invitePayloadSchema.safeParse({ email: "", role: "viewer" });
    expect(result.success).toBe(false);
  });

  it("rejeita papel fora do enum", () => {
    const result = invitePayloadSchema.safeParse({
      email: "pessoa@keystone.com.br",
      role: "gerente",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita 'owner' — só o bootstrap concede esse papel", () => {
    const result = invitePayloadSchema.safeParse({
      email: "pessoa@keystone.com.br",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita campo ausente", () => {
    expect(
      invitePayloadSchema.safeParse({ email: "pessoa@keystone.com.br" })
        .success,
    ).toBe(false);
    expect(invitePayloadSchema.safeParse({ role: "viewer" }).success).toBe(
      false,
    );
  });
});
