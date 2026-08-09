import { describe, expect, it } from "vitest";
import { extractMessage } from "@/components/shared/QueryState";

describe("extractMessage", () => {
  it("usa a mensagem de uma instância de Error", () => {
    expect(extractMessage(new Error("conexão recusada"))).toBe(
      "conexão recusada",
    );
  });

  it("aceita string crua", () => {
    expect(extractMessage("falha de rede")).toBe("falha de rede");
  });

  it("lê o formato de erro do Supabase, que não herda de Error", () => {
    // É por isto que a função existe: o cliente Supabase rejeita com objeto
    // simples. Tratar só `instanceof Error` transformava toda falha de banco
    // em "erro desconhecido".
    const supabaseError = {
      message: 'relation "public.financial_entries" does not exist',
      code: "42P01",
      details: null,
      hint: null,
    };
    expect(extractMessage(supabaseError)).toBe(
      'relation "public.financial_entries" does not exist',
    );
  });

  it("ignora message vazia ou só com espaço", () => {
    expect(extractMessage({ message: "   " })).toBe(
      "Erro sem mensagem. Verifique o console do navegador.",
    );
  });

  it("ignora message que não é string", () => {
    expect(extractMessage({ message: 42 })).toBe(
      "Erro sem mensagem. Verifique o console do navegador.",
    );
  });

  it("lida com null e undefined sem quebrar", () => {
    const fallback = "Erro sem mensagem. Verifique o console do navegador.";
    expect(extractMessage(null)).toBe(fallback);
    expect(extractMessage(undefined)).toBe(fallback);
  });
});
