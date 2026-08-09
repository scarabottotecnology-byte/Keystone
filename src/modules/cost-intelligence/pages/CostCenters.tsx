import { useMemo, useState } from "react";
import { useFinancialData } from "@/modules/cost-intelligence/hooks/useFinancialData";
import type { CostCenterField } from "@/modules/cost-intelligence/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";

export default function CostCenters() {
  const { data: entries = [], isLoading, isError, error, refetch } = useFinancialData();
  const [ccType, setCcType] = useState<CostCenterField>("cca");
  const [selectedCC, setSelectedCC] = useState<string>("all");

  const ccOptions = useMemo(() => {
    return [...new Set(entries.map((e) => e[ccType]).filter(Boolean))] as string[];
  }, [entries, ccType]);

  const filtered = useMemo(() => {
    if (selectedCC === "all") return entries;
    return entries.filter((e) => e[ccType] === selectedCC);
  }, [entries, selectedCC, ccType]);

  const summary = useMemo(() => {
    const totalPrevisto = filtered.reduce((s, e) => s + (e.valor_previsto || Math.abs(e.valor_negativo || 0)), 0);
    const totalPago = filtered.reduce((s, e) => s + (e.valor_pago || Math.abs(e.valor_negativo || 0)), 0);
    return { totalPrevisto, totalPago, count: filtered.length };
  }, [filtered]);

  const byFornecedor = useMemo(() => {
    const map = new Map<string, { previsto: number; pago: number }>();
    filtered.forEach((e) => {
      const f = e.fornecedor || e.razao_social || "Sem Fornecedor";
      const cur = map.get(f) || { previsto: 0, pago: 0 };
      cur.previsto += e.valor_previsto || Math.abs(e.valor_negativo || 0);
      cur.pago += e.valor_pago || Math.abs(e.valor_negativo || 0);
      map.set(f, cur);
    });
    return Array.from(map, ([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.pago - a.pago)
      .slice(0, 15);
  }, [filtered]);

  const ccComparison = useMemo(() => {
    const map = new Map<string, { previsto: number; pago: number }>();
    entries.forEach((e) => {
      const cc = e[ccType] || "N/A";
      const cur = map.get(cc) || { previsto: 0, pago: 0 };
      cur.previsto += e.valor_previsto || Math.abs(e.valor_negativo || 0);
      cur.pago += e.valor_pago || Math.abs(e.valor_negativo || 0);
      map.set(cc, cur);
    });
    return Array.from(map, ([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.pago - a.pago)
      .slice(0, 20);
  }, [entries, ccType]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Controladoria"
        title="Análise por centro de custo"
        description="Detalhamento de um centro específico, com comparativo e totalização por fornecedor."
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={entries.length === 0}
        onRetry={() => refetch()}
        emptyTitle="Nenhum lançamento importado ainda"
        emptyDescription="Importe uma planilha para analisar os centros de custo."
      >
      <div className="space-y-6">

      <div className="flex flex-wrap gap-3">
        <Select value={ccType} onValueChange={(v) => { setCcType(v as CostCenterField); setSelectedCC("all"); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cca">CCA</SelectItem>
            <SelectItem value="ccs">CCS</SelectItem>
            <SelectItem value="cod_cc">COD CC</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCC} onValueChange={setSelectedCC}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Centro de Custos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ccOptions.map((cc) => <SelectItem key={cc} value={cc}>{cc}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Previsto</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(summary.totalPrevisto)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pago</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(summary.totalPago)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lançamentos</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{summary.count}</p></CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Comparativo por {ccType.toUpperCase()}</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ccComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="pago" name="Pago" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* By Fornecedor */}
      {selectedCC !== "all" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Detalhamento por Fornecedor</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Previsto</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byFornecedor.map((f) => (
                  <TableRow key={f.name}>
                    <TableCell className="text-sm">{f.name}</TableCell>
                    <TableCell className="text-sm text-right">{fmt(f.previsto)}</TableCell>
                    <TableCell className="text-sm text-right">{fmt(f.pago)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      </div>
      </QueryState>
    </div>
  );
}
