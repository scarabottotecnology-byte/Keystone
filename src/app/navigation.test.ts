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

  it("nenhum módulo se declara pronto sem rota no roteador", () => {
    // O App só monta rota para PLANNED_ITEMS. Um item marcado 'active' sem
    // rota correspondente cai no NotFound — a sidebar prometeria algo que não
    // abre. Este teste falha de propósito quando o primeiro módulo for marcado
    // como pronto, para lembrar de ligar a rota dele no App.
    const active = ALL_NAV_ITEMS.filter((i) => i.status === "active");
    expect(
      active.map((i) => i.to),
      "item 'active' encontrado: registre a rota em App.tsx e ajuste este teste",
    ).toEqual([]);
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
