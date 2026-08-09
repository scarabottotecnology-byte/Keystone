import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FinancialEntry } from "@/modules/cost-intelligence/types";

/**
 * Carrega os lançamentos financeiros da organização.
 *
 * ATENÇÃO — dívida conhecida (achado H-02 da auditoria).
 * Este hook baixa a tabela inteira para o navegador e todos os KPIs e gráficos
 * são calculados no cliente. Com dezenas de milhares de lançamentos isso
 * significa payload de vários MB, travamento de aba e custo de egress.
 *
 * A correção está planejada para a FASE 2: agregação vira RPC no Postgres
 * (`rpc_cost_center_summary`) e a listagem passa a paginar no servidor.
 * Enquanto isso, o laço abaixo tem um teto explícito para que o problema
 * degrade de forma visível em vez de travar a aplicação em silêncio.
 */
const PAGE_SIZE = 1000;
const MAX_PAGES = 50; // teto de segurança: 50 mil linhas

export function useFinancialData() {
  return useQuery({
    queryKey: ["financial-entries"],
    queryFn: async (): Promise<FinancialEntry[]> => {
      const all: FinancialEntry[] = [];

      for (let page = 0; page < MAX_PAGES; page++) {
        const from = page * PAGE_SIZE;
        const { data, error } = await supabase
          .from("financial_entries")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        const batch = data ?? [];
        all.push(...batch);

        if (batch.length < PAGE_SIZE) return all;
      }

      console.warn(
        `[cost-intelligence] Limite de ${MAX_PAGES * PAGE_SIZE} lançamentos ` +
          `atingido. Os dados exibidos estão incompletos — a agregação no ` +
          `servidor entra na fase 2.`,
      );
      return all;
    },
  });
}
