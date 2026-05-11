-- Adiciona flag trava_equipes à lt_config para sincronizar o travamento
-- de equipes entre facilitador e grupos via Supabase Realtime.
ALTER TABLE lt_config ADD COLUMN IF NOT EXISTS trava_equipes boolean default false;

-- Habilita Realtime para lt_config (necessário para grupos verem mudanças imediatamente)
ALTER PUBLICATION supabase_realtime ADD TABLE lt_config;
