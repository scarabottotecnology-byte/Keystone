import { describe, expect, it } from "vitest";
import {
  ALL_NAV_ITEMS,
  NAVIGATION,
  PLANNED_ITEMS,
  findNavItem,
} from "@/app/navigation";

describe("registro de navegação", () => {
  it("não repete rota entre módulos", () => {
    // Rota duplicada faz o roteador casar a primeira e a segunda vira
    // inalcançável — falha silenciosa e difícil de perceber.
    const routes = ALL_NAV_ITEMS.map((i) => i.to);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("toda rota começa com barra", () => {
    for (const item of ALL_NAV_ITEMS) {
      expect(item.to.startsWith("/")).toBe(true);
    }
  });

  it("toda fase está dentro do roadmap de 24 fases", () => {
    for (const item of ALL_NAV_ITEMS) {
      expect(item.phase).toBeGreaterThanOrEqual(1);
      expect(item.phase).toBeLessThanOrEqual(24);
    }
  });

  it("todo módulo declara o que responde", () => {
    for (const item of ALL_NAV_ITEMS) {
      expect(item.purpose.trim().length).toBeGreaterThan(0);
    }
  });

  it("módulo planejado explica o que existirá nele", () => {
    // A tela de módulo não construído se sustenta nesta lista. Sem ela, o
    // usuário vê apenas "ainda não foi feito", que não informa nada.
    for (const item of PLANNED_ITEMS) {
      expect(item.delivers, `${item.label} sem 'delivers'`).toBeDefined();
      expect(item.delivers!.length).toBeGreaterThan(0);
    }
  });

  it("todo item 'active' tem rota própria registrada em App.tsx", () => {
    // O App só monta rota automática para PLANNED_ITEMS — um item 'active'
    // precisa da própria <Route> escrita à mão, com a tela real. Esta lista
    // é a prova de que ninguém esqueceu: marcar um módulo como pronto sem
    // registrar a rota dele aqui (e em App.tsx) cai no NotFound, e a sidebar
    // prometeria algo que não abre.
    const active = ALL_NAV_ITEMS.filter((i) => i.status === "active");
    expect(active.map((i) => i.to)).toEqual(["/", "/settings"]);
  });

  it("nenhum grupo fica vazio", () => {
    for (const group of NAVIGATION) {
      expect(group.items.length, `grupo ${group.label} vazio`).toBeGreaterThan(0);
    }
  });

  it("findNavItem resolve rota conhecida e devolve undefined para desconhecida", () => {
    expect(findNavItem("/content")?.label).toBe("Content");
    expect(findNavItem("/")?.label).toBe("Command Center");
    expect(findNavItem("/rota-que-nao-existe")).toBeUndefined();
  });
});
