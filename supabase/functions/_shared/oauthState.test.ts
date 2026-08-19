import { describe, expect, it } from "vitest";
import {
  createPkcePair,
  newNonce,
  signState,
  type StatePayload,
  verifyState,
} from "./oauthState.ts";

const SECRET = "segredo-de-teste";

function payload(overrides: Partial<StatePayload> = {}): StatePayload {
  return {
    nonce: newNonce(),
    organizationId: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    provider: "linkedin",
    exp: Math.floor(Date.now() / 1000) + 600,
    ...overrides,
  };
}

describe("signState / verifyState", () => {
  it("aceita de volta um state que ele mesmo assinou", async () => {
    const original = payload();
    const verified = await verifyState(
      await signState(original, SECRET),
      SECRET,
    );
    expect(verified.nonce).toBe(original.nonce);
    expect(verified.organizationId).toBe(original.organizationId);
  });

  it("recusa state assinado com outro segredo", async () => {
    const state = await signState(payload(), "outro-segredo");
    await expect(verifyState(state, SECRET)).rejects.toThrow(
      /assinatura do state inválida/i,
    );
  });

  it("recusa payload adulterado, mesmo mantendo a assinatura original", async () => {
    const state = await signState(payload(), SECRET);
    const [, signature] = state.split(".");
    const forged = btoa(
      JSON.stringify(
        payload({ organizationId: "33333333-3333-3333-3333-333333333333" }),
      ),
    ).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await expect(verifyState(`${forged}.${signature}`, SECRET)).rejects.toThrow(
      /assinatura do state inválida/i,
    );
  });

  it("recusa state expirado", async () => {
    const state = await signState(
      payload({ exp: Math.floor(Date.now() / 1000) - 1 }),
      SECRET,
    );
    await expect(verifyState(state, SECRET)).rejects.toThrow(/expirado/i);
  });

  it("recusa state malformado", async () => {
    await expect(verifyState("sem-ponto", SECRET)).rejects.toThrow(
      /malformado/i,
    );
  });
});

describe("newNonce", () => {
  it("não repete", () => {
    const nonces = new Set(Array.from({ length: 200 }, () => newNonce()));
    expect(nonces.size).toBe(200);
  });
});

describe("createPkcePair", () => {
  it("gera verifier e challenge distintos e não vazios", async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(verifier.length).toBeGreaterThan(20);
    expect(challenge.length).toBeGreaterThan(20);
    expect(challenge).not.toBe(verifier);
  });

  it("usa apenas caracteres base64url — sem +, / ou =", async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("o challenge é o SHA-256 do verifier (S256), não o verifier repetido", async () => {
    const { verifier, challenge } = await createPkcePair();
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(verifier),
    );
    let binary = "";
    for (const byte of new Uint8Array(digest)) {
      binary += String.fromCharCode(byte);
    }
    const expected = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(challenge).toBe(expected);
  });
});
