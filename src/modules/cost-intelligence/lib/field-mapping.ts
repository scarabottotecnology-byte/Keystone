export const DB_FIELDS = [
  { key: "cca", label: "CCA" },
  { key: "ccs", label: "CCS" },
  { key: "cf", label: "CF" },
  { key: "grupo", label: "Grupo" },
  { key: "filial", label: "Filial" },
  { key: "valor_negativo", label: "Valor Negativo", type: "number" },
  { key: "mes", label: "Mês", type: "date" },
  { key: "competencia", label: "Competência", type: "date" },
  { key: "bu", label: "B.U." },
  { key: "numero", label: "Número" },
  { key: "vencimento", label: "Vencimento", type: "date" },
  { key: "emissao", label: "Emissão", type: "date" },
  { key: "valor_previsto", label: "Valor Previsto", type: "number" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "pagamento", label: "Pagamento" },
  { key: "valor_pago", label: "Valor Pago", type: "number" },
  { key: "lancamento", label: "Lançamento" },
  { key: "historico", label: "Histórico" },
  { key: "razao_social", label: "Razão Social" },
  { key: "cod_cc", label: "COD CC" },
  { key: "bu_projeto", label: "BU Projeto" },
  { key: "projeto", label: "Projeto" },
] as const;

export type FieldMapping = Record<string, string>; // db_field -> spreadsheet_column

export const AUTO_MAP_HINTS: Record<string, string[]> = {
  cca: ["cca"],
  ccs: ["ccs"],
  cf: ["cf"],
  grupo: ["grupo"],
  filial: ["filial"],
  valor_negativo: ["valor negativo", "valor_negativo"],
  mes: ["mês", "mes"],
  competencia: ["competencia", "competência"],
  bu: ["b.u.", "bu"],
  numero: ["número", "numero"],
  vencimento: ["vencimento"],
  emissao: ["emissão", "emissao"],
  valor_previsto: ["valor previsto", "valor_previsto"],
  fornecedor: ["fornecedor"],
  pagamento: ["pagamento"],
  valor_pago: ["valor pago", "valor_pago"],
  lancamento: ["lançamento", "lancamento"],
  historico: ["histórico", "historico"],
  razao_social: ["razão social", "razao social", "razao_social"],
  cod_cc: ["cod cc", "cod_cc"],
  bu_projeto: ["bu projeto", "bu_projeto"],
  projeto: ["projeto"],
};

/** Convert Excel serial date number to ISO date string (YYYY-MM-DD) */
export function excelSerialToDate(val: unknown): string | null {
  if (val == null || val === "") return null;
  const num = Number(val);
  if (!isNaN(num) && num > 1 && num < 200000) {
    // Excel serial date: days since 1899-12-30
    const utcDays = Math.floor(num) - 25569; // 25569 = days from 1899-12-30 to 1970-01-01
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  // Already a date string, return as-is
  return String(val);
}

export function autoMapFields(spreadsheetColumns: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  const normalized = spreadsheetColumns.map((c) => c.toLowerCase().trim());

  for (const [dbField, hints] of Object.entries(AUTO_MAP_HINTS)) {
    const idx = normalized.findIndex((col) =>
      hints.some((hint) => col === hint || col.includes(hint))
    );
    if (idx !== -1) {
      mapping[dbField] = spreadsheetColumns[idx];
    }
  }
  return mapping;
}
