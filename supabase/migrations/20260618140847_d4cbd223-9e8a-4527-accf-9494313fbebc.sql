
-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Enums
CREATE TYPE public.lead_status AS ENUM ('novo', 'qualificando', 'qualificado', 'proposta', 'ganho', 'perdido', 'descartado');
CREATE TYPE public.lead_track AS ENUM ('orbita', 'mfi', 'custos', 'prisma', 'geral');
CREATE TYPE public.deal_stage AS ENUM ('descoberta', 'diagnostico', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido');
CREATE TYPE public.activity_type AS ENUM ('ligacao', 'email', 'reuniao', 'whatsapp', 'nota', 'tarefa');

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  telefone TEXT,
  cargo TEXT,
  origem TEXT,
  track public.lead_track DEFAULT 'geral',
  interesse TEXT,
  mensagem TEXT,
  status public.lead_status NOT NULL DEFAULT 'novo',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notas TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- DEALS
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  valor NUMERIC(14,2) DEFAULT 0,
  estagio public.deal_stage NOT NULL DEFAULT 'descoberta',
  probabilidade INTEGER DEFAULT 20 CHECK (probabilidade BETWEEN 0 AND 100),
  fechamento_previsto DATE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access deals" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_deals_estagio ON public.deals(estagio);
CREATE INDEX idx_deals_lead_id ON public.deals(lead_id);

-- ACTIVITIES
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  tipo public.activity_type NOT NULL DEFAULT 'nota',
  titulo TEXT NOT NULL,
  descricao TEXT,
  agendada_para TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access activities" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX idx_activities_deal_id ON public.activities(deal_id);

-- DOWNLOADS
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  recurso TEXT NOT NULL,
  arquivo TEXT NOT NULL,
  email TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.downloads TO authenticated;
GRANT INSERT ON public.downloads TO anon;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can register a download" ON public.downloads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view downloads" ON public.downloads FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_downloads_lead_id ON public.downloads(lead_id);
CREATE INDEX idx_downloads_recurso ON public.downloads(recurso);
