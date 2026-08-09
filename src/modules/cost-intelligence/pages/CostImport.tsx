import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { DB_FIELDS, autoMapFields, type FieldMapping, excelSerialToDate } from "@/modules/cost-intelligence/lib/field-mapping";
import type { FinancialEntryInsert } from "@/modules/cost-intelligence/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      if (json.length === 0) {
        toast.error("Planilha vazia");
        return;
      }
      const cols = Object.keys(json[0]);
      setColumns(cols);
      setRows(json);
      setMapping(autoMapFields(cols));
      toast.success(`${json.length} linhas encontradas`);
    };
    reader.readAsBinaryString(f);
  }, []);

  const updateMapping = (dbField: string, colValue: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (colValue === "__none__") {
        delete next[dbField];
      } else {
        next[dbField] = colValue;
      }
      return next;
    });
  };

  const handleImport = async () => {
    const mappedFields = Object.keys(mapping);
    if (mappedFields.length === 0) {
      toast.error("Mapeie pelo menos um campo");
      return;
    }

    setImporting(true);
    const batchId = crypto.randomUUID();

    try {
      const CHUNK = 500;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map((row) => {
          const entry: FinancialEntryInsert = { import_batch_id: batchId };
          for (const [dbField, col] of Object.entries(mapping)) {
            const val = row[col];
            const fieldDef = DB_FIELDS.find((f) => f.key === dbField);
            const key = dbField as keyof FinancialEntryInsert;
            if (fieldDef && "type" in fieldDef && fieldDef.type === "number") {
              Object.assign(entry, {
                [key]: val != null ? Number(val) || 0 : null,
              });
            } else if (fieldDef && "type" in fieldDef && fieldDef.type === "date") {
              Object.assign(entry, {
                [key]: val != null ? excelSerialToDate(val) : null,
              });
            } else {
              Object.assign(entry, {
                [key]: val != null ? String(val) : null,
              });
            }
          }
          return entry;
        });

        const { error } = await supabase.from("financial_entries").insert(chunk);
        if (error) throw error;
      }

      toast.success(`${rows.length} registros importados com sucesso!`);
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Erro na importação: " + message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Controladoria"
        title="Importar planilha"
        description="Envie um .xlsx ou .csv, confira o mapeamento de colunas e revise o preview antes de gravar."
      />

      {/* Upload */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Selecione o arquivo</CardTitle></CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Clique para selecionar .xlsx ou .csv"}
            </span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </label>
        </CardContent>
      </Card>

      {/* Mapping */}
      {columns.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">2. Mapeamento de Campos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DB_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <span className="text-sm w-32 shrink-0 font-medium">{field.label}</span>
                  <Select
                    value={mapping[field.key] || "__none__"}
                    onValueChange={(v) => updateMapping(field.key, v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Não mapear —</SelectItem>
                      {columns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Preview ({Math.min(5, rows.length)} de {rows.length} linhas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.entries(mapping).map(([dbField, col]) => (
                      <TableHead key={dbField}>
                        {DB_FIELDS.find((f) => f.key === dbField)?.label || dbField}
                        <span className="block text-xs text-muted-foreground font-normal">← {col}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {Object.entries(mapping).map(([dbField, col]) => (
                        <TableCell key={dbField} className="text-xs">
                          {row[col] != null ? String(row[col]) : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex gap-3">
              <Button onClick={handleImport} disabled={importing || done}>
                {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {done && <CheckCircle className="h-4 w-4 mr-2" />}
                {done ? "Importado!" : importing ? "Importando..." : `Importar ${rows.length} registros`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
