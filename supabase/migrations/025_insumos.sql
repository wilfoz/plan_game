-- 025_insumos.sql
-- Recurso "Ferramental/Insumo": catálogo por evento (como event_eq_cat) + coluna
-- de seleção nas composições dos grupos. Insumo é CUSTO ÚNICO (fixo) — não entra
-- nos coeficientes/KPI nem é multiplicado pela duração da atividade.

-- 1. Catálogo de insumos por evento -------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_insumo_cat (
  id          TEXT NOT NULL,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  nome_pt     TEXT NOT NULL,
  nome_es     TEXT NOT NULL,
  custo       NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (id, event_id)
);
ALTER TABLE public.event_insumo_cat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON public.event_insumo_cat FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_event_insumo_cat_event ON public.event_insumo_cat(event_id);

-- 2. Seleção de insumos por grupo/atividade (custo-only) ----------------------
ALTER TABLE public.grupo_comps
  ADD COLUMN IF NOT EXISTS insumo_rows JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Insumos padrão (para eventos já existentes, permitindo uso imediato) ------
-- Espelha o padrão de seed dos demais catálogos; o upload via Excel pode
-- substituir/expandir esta lista por evento.
INSERT INTO public.event_insumo_cat (id, event_id, nome_pt, nome_es, custo)
SELECT v.id, e.id, v.nome_pt, v.nome_es, v.custo
FROM public.events e
CROSS JOIN (VALUES
  ('ins1', 'CABO CONDUTOR (BOBINA)', 'CABLE CONDUCTOR (BOBINA)', 50000),
  ('ins2', 'CABO OPGW (BOBINA)',     'CABLE OPGW (BOBINA)',      35000),
  ('ins3', 'CADEIA DE ISOLADORES',   'CADENA DE AISLADORES',     1800),
  ('ins4', 'GRAMPO DE ANCORAGEM',    'GRAPA DE ANCLAJE',         450),
  ('ins5', 'EMENDA PREFORMADA',      'EMPALME PREFORMADO',       900)
) AS v(id, nome_pt, nome_es, custo)
ON CONFLICT (id, event_id) DO NOTHING;
