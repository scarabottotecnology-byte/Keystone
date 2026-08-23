-- Social media publication calendar (LinkedIn) — read-only panel inside
-- the authenticated /ferramentas area. Real publishing happens via Buffer;
-- this table only mirrors the editorial calendar for visibility.

CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_numero INTEGER NOT NULL,
  data_publicacao DATE NOT NULL,
  dia_semana TEXT NOT NULL,
  pilar TEXT NOT NULL,
  imagem TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'publicado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view social posts" ON public.social_posts FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_social_posts_data ON public.social_posts(data_publicacao);
CREATE UNIQUE INDEX idx_social_posts_numero ON public.social_posts(post_numero);

-- Seed: imported from "postagens linkedin/calendario-publicacao.csv" (50 posts).
INSERT INTO public.social_posts (post_numero, data_publicacao, dia_semana, pilar, imagem, status) VALUES
  (1, '2026-08-24', 'Segunda', 'Margem e Lucratividade', 'imagens/post-01.png', 'pendente'),
  (6, '2026-08-26', 'Quarta', 'Fluxo de Caixa e Capital de Giro', 'imagens/post-06.png', 'pendente'),
  (11, '2026-08-28', 'Sexta', 'Custos, Rateio e Custeio', 'imagens/post-11.png', 'pendente'),
  (16, '2026-08-31', 'Segunda', 'Precificacao', 'imagens/post-16.png', 'pendente'),
  (21, '2026-09-02', 'Quarta', 'Orcamento e Budget x Realizado', 'imagens/post-21.png', 'pendente'),
  (26, '2026-09-04', 'Sexta', 'Indicadores e KPIs Financeiros', 'imagens/post-26.png', 'pendente'),
  (31, '2026-09-07', 'Segunda', 'M&A, Valuation e Due Diligence', 'imagens/post-31.png', 'pendente'),
  (36, '2026-09-09', 'Quarta', 'Fechamento e Controladoria', 'imagens/post-36.png', 'pendente'),
  (41, '2026-09-11', 'Sexta', 'Tributario e Regime Tributario', 'imagens/post-41.png', 'pendente'),
  (46, '2026-09-14', 'Segunda', 'Decisao de Capital e Estrategia', 'imagens/post-46.png', 'pendente'),
  (2, '2026-09-16', 'Quarta', 'Margem e Lucratividade', 'imagens/post-02.png', 'pendente'),
  (7, '2026-09-18', 'Sexta', 'Fluxo de Caixa e Capital de Giro', 'imagens/post-07.png', 'pendente'),
  (12, '2026-09-21', 'Segunda', 'Custos, Rateio e Custeio', 'imagens/post-12.png', 'pendente'),
  (17, '2026-09-23', 'Quarta', 'Precificacao', 'imagens/post-17.png', 'pendente'),
  (22, '2026-09-25', 'Sexta', 'Orcamento e Budget x Realizado', 'imagens/post-22.png', 'pendente'),
  (27, '2026-09-28', 'Segunda', 'Indicadores e KPIs Financeiros', 'imagens/post-27.png', 'pendente'),
  (32, '2026-09-30', 'Quarta', 'M&A, Valuation e Due Diligence', 'imagens/post-32.png', 'pendente'),
  (37, '2026-10-02', 'Sexta', 'Fechamento e Controladoria', 'imagens/post-37.png', 'pendente'),
  (42, '2026-10-05', 'Segunda', 'Tributario e Regime Tributario', 'imagens/post-42.png', 'pendente'),
  (47, '2026-10-07', 'Quarta', 'Decisao de Capital e Estrategia', 'imagens/post-47.png', 'pendente'),
  (3, '2026-10-09', 'Sexta', 'Margem e Lucratividade', 'imagens/post-03.png', 'pendente'),
  (8, '2026-10-12', 'Segunda', 'Fluxo de Caixa e Capital de Giro', 'imagens/post-08.png', 'pendente'),
  (13, '2026-10-14', 'Quarta', 'Custos, Rateio e Custeio', 'imagens/post-13.png', 'pendente'),
  (18, '2026-10-16', 'Sexta', 'Precificacao', 'imagens/post-18.png', 'pendente'),
  (23, '2026-10-19', 'Segunda', 'Orcamento e Budget x Realizado', 'imagens/post-23.png', 'pendente'),
  (28, '2026-10-21', 'Quarta', 'Indicadores e KPIs Financeiros', 'imagens/post-28.png', 'pendente'),
  (33, '2026-10-23', 'Sexta', 'M&A, Valuation e Due Diligence', 'imagens/post-33.png', 'pendente'),
  (38, '2026-10-26', 'Segunda', 'Fechamento e Controladoria', 'imagens/post-38.png', 'pendente'),
  (43, '2026-10-28', 'Quarta', 'Tributario e Regime Tributario', 'imagens/post-43.png', 'pendente'),
  (48, '2026-10-30', 'Sexta', 'Decisao de Capital e Estrategia', 'imagens/post-48.png', 'pendente'),
  (4, '2026-11-02', 'Segunda', 'Margem e Lucratividade', 'imagens/post-04.png', 'pendente'),
  (9, '2026-11-04', 'Quarta', 'Fluxo de Caixa e Capital de Giro', 'imagens/post-09.png', 'pendente'),
  (14, '2026-11-06', 'Sexta', 'Custos, Rateio e Custeio', 'imagens/post-14.png', 'pendente'),
  (19, '2026-11-09', 'Segunda', 'Precificacao', 'imagens/post-19.png', 'pendente'),
  (24, '2026-11-11', 'Quarta', 'Orcamento e Budget x Realizado', 'imagens/post-24.png', 'pendente'),
  (29, '2026-11-13', 'Sexta', 'Indicadores e KPIs Financeiros', 'imagens/post-29.png', 'pendente'),
  (34, '2026-11-16', 'Segunda', 'M&A, Valuation e Due Diligence', 'imagens/post-34.png', 'pendente'),
  (39, '2026-11-18', 'Quarta', 'Fechamento e Controladoria', 'imagens/post-39.png', 'pendente'),
  (44, '2026-11-20', 'Sexta', 'Tributario e Regime Tributario', 'imagens/post-44.png', 'pendente'),
  (49, '2026-11-23', 'Segunda', 'Decisao de Capital e Estrategia', 'imagens/post-49.png', 'pendente'),
  (5, '2026-11-25', 'Quarta', 'Margem e Lucratividade', 'imagens/post-05.png', 'pendente'),
  (10, '2026-11-27', 'Sexta', 'Fluxo de Caixa e Capital de Giro', 'imagens/post-10.png', 'pendente'),
  (15, '2026-11-30', 'Segunda', 'Custos, Rateio e Custeio', 'imagens/post-15.png', 'pendente'),
  (20, '2026-12-02', 'Quarta', 'Precificacao', 'imagens/post-20.png', 'pendente'),
  (25, '2026-12-04', 'Sexta', 'Orcamento e Budget x Realizado', 'imagens/post-25.png', 'pendente'),
  (30, '2026-12-07', 'Segunda', 'Indicadores e KPIs Financeiros', 'imagens/post-30.png', 'pendente'),
  (35, '2026-12-09', 'Quarta', 'M&A, Valuation e Due Diligence', 'imagens/post-35.png', 'pendente'),
  (40, '2026-12-11', 'Sexta', 'Fechamento e Controladoria', 'imagens/post-40.png', 'pendente'),
  (45, '2026-12-14', 'Segunda', 'Tributario e Regime Tributario', 'imagens/post-45.png', 'pendente'),
  (50, '2026-12-16', 'Quarta', 'Decisao de Capital e Estrategia', 'imagens/post-50.png', 'pendente');
