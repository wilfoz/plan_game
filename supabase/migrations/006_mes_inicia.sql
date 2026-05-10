-- Mês de início por atividade
-- atividades_config: base definida pelo facilitador
ALTER TABLE atividades_config
  ADD COLUMN IF NOT EXISTS mes_inicia_base integer NOT NULL DEFAULT 0;

-- grupo_comps: override definido pelo grupo (0 = usa a base do facilitador)
ALTER TABLE grupo_comps
  ADD COLUMN IF NOT EXISTS mes_inicia integer NOT NULL DEFAULT 0;
