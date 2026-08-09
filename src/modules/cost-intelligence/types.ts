import type { Database } from "@/integrations/supabase/types";

/** Uma linha de lançamento financeiro, como vem do banco. */
export type FinancialEntry =
  Database["public"]["Tables"]["financial_entries"]["Row"];

/** Payload de inserção de lançamento. */
export type FinancialEntryInsert =
  Database["public"]["Tables"]["financial_entries"]["Insert"];

/**
 * Os quatro identificadores de centro de custo que convivem hoje na base.
 *
 * A relação entre eles não está declarada no schema — é dívida de modelagem
 * registrada como achado M-02 na auditoria (docs/00-AUDITORIA-ESTADO-ATUAL.md)
 * e será resolvida quando o módulo ganhar tabelas de dimensão.
 */
export type CostCenterField = "cca" | "ccs" | "cod_cc";
