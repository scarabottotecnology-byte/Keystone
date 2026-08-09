-- Create financial_entries table
CREATE TABLE public.financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cca TEXT,
  ccs TEXT,
  cf TEXT,
  grupo TEXT,
  filial TEXT,
  valor_negativo NUMERIC,
  mes TEXT,
  competencia TEXT,
  bu TEXT,
  numero TEXT,
  vencimento DATE,
  emissao DATE,
  valor_previsto NUMERIC,
  fornecedor TEXT,
  pagamento TEXT,
  valor_pago NUMERIC,
  lancamento TEXT,
  historico TEXT,
  razao_social TEXT,
  cod_cc TEXT,
  bu_projeto TEXT,
  projeto TEXT,
  import_batch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read financial entries" ON public.financial_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert financial entries" ON public.financial_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can delete financial entries" ON public.financial_entries FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can read financial entries" ON public.financial_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert financial entries" ON public.financial_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can delete financial entries" ON public.financial_entries FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_financial_entries_cca ON public.financial_entries(cca);
CREATE INDEX idx_financial_entries_ccs ON public.financial_entries(ccs);
CREATE INDEX idx_financial_entries_cod_cc ON public.financial_entries(cod_cc);
CREATE INDEX idx_financial_entries_competencia ON public.financial_entries(competencia);
CREATE INDEX idx_financial_entries_grupo ON public.financial_entries(grupo);
CREATE INDEX idx_financial_entries_filial ON public.financial_entries(filial);
CREATE INDEX idx_financial_entries_bu ON public.financial_entries(bu);
CREATE INDEX idx_financial_entries_batch ON public.financial_entries(import_batch_id);