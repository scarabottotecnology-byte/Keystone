import { describe, expect, it } from "vitest";
import { extractNumbers, verifyNumbersGrounded } from "./guardrails";
import { describeViolations, TEMPLATES, validatePayload } from "./templates";

describe("extractNumbers", () => {
  it("lê inteiro simples e percentual", () => {
    expect(extractNumbers("43% do overhead")).toEqual([43]);
  });

  it("trata ponto como separador de milhar em pt-BR", () => {
    expect(extractNumbers("R$ 1.250")).toEqual([1250]);
    expect(extractNumbers("1.250.000 reais")).toEqual([1250000]);
  });

  it("trata vírgula como decimal em pt-BR", () => {
    expect(extractNumbers("margem de 9,5 p.p.")).toEqual([9.5]);
    expect(extractNumbers("R$ 1.250,50")).toEqual([1250.5]);
  });

  it("aceita ponto decimal na notação estrangeira", () => {
    expect(extractNumbers("ratio of 1.5")).toEqual([1.5]);
  });

  it("ignora pontuação de fim de frase colada no número", () => {
    // "43." no fim da frase é quarenta e três, não 43 dividido por nada.
    expect(extractNumbers("chegou a 43.")).toEqual([43]);
  });

  it("acha vários números na mesma frase", () => {
    expect(extractNumbers("de 34% para 43%, em 12 meses")).toEqual([
      34,
      43,
      12,
    ]);
  });

  it("devolve vazio em texto sem número", () => {
    expect(extractNumbers("rateio sem base defensável")).toEqual([]);
  });
});

describe("verifyNumbersGrounded", () => {
  it("aprova quando todo número da arte está na copy", () => {
    const r = verifyNumbersGrounded(
      "43% do overhead industrial",
      "Levantamento nosso: 43% do overhead industrial não tem base de rateio.",
    );
    expect(r.ok).toBe(true);
    expect(r.ungrounded).toEqual([]);
  });

  it("barra número que a arte inventou", () => {
    // O caso que motiva o guardrail: arte e copy divergindo em um dígito.
    // Isoladamente as duas são plausíveis; juntas, destroem a credibilidade.
    const r = verifyNumbersGrounded(
      "43% do overhead",
      "34% do overhead industrial não tem base de rateio.",
    );
    expect(r.ok).toBe(false);
    expect(r.ungrounded).toEqual([43]);
  });

  it("reconhece o mesmo valor escrito em formatos diferentes", () => {
    const r = verifyNumbersGrounded("R$ 1.250,00", "economia de 1250 reais");
    expect(r.ok).toBe(true);
  });

  it("não repete o mesmo número sem lastro na lista de erro", () => {
    const r = verifyNumbersGrounded("43% e 43% de novo", "sem números aqui");
    expect(r.ungrounded).toEqual([43]);
  });

  it("aprova arte sem número nenhum", () => {
    const r = verifyNumbersGrounded("rateio sem base", "qualquer copy");
    expect(r.ok).toBe(true);
  });
});

describe("validatePayload", () => {
  const dado = TEMPLATES.dado;

  it("aceita payload dentro dos limites", () => {
    expect(
      validatePayload(dado, {
        eyebrow: "Controladoria · Custos",
        valor: "43%",
        afirmacao: "do overhead industrial não é rateado por base defensável.",
        fonte: "Keystone · amostra de 34 indústrias, 2026",
      }),
    ).toEqual([]);
  });

  it("acusa zona obrigatória ausente", () => {
    const v = validatePayload(dado, { valor: "43%" });
    expect(v.map((x) => x.zone).sort()).toEqual([
      "afirmacao",
      "eyebrow",
      "fonte",
    ]);
    expect(v.every((x) => x.kind === "missing")).toBe(true);
  });

  it("acusa estouro dizendo quantos caracteres sobram", () => {
    const v = validatePayload(dado, {
      eyebrow: "Controladoria",
      valor: "43%",
      afirmacao: "x".repeat(180),
      fonte: "Keystone",
    });
    expect(v).toEqual([
      { zone: "afirmacao", label: "Afirmação", kind: "overflow", excess: 10 },
    ]);
  });

  it("trata espaço em branco como ausência", () => {
    const v = validatePayload(dado, {
      eyebrow: "   ",
      valor: "43%",
      afirmacao: "ok",
      fonte: "Keystone",
    });
    expect(v).toEqual([
      { zone: "eyebrow", label: "Sobretítulo", kind: "missing" },
    ]);
  });

  it("reporta todas as violações de uma vez", () => {
    // O A10 precisa reescrever numa passada só, não descobrir uma por tentativa.
    const v = validatePayload(dado, { valor: "x".repeat(20) });
    expect(v.length).toBe(4);
  });

  it("descreve violações em texto acionável", () => {
    const texto = describeViolations(validatePayload(dado, { valor: "43%" }));
    expect(texto).toContain("obrigatório e ausente");
  });
});
