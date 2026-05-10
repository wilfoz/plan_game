-- Habilita Realtime e RLS na tabela grupo_comps
-- grupo_comps foi criada sem RLS em 003 — corrigindo para consistência com as demais tabelas.

ALTER TABLE grupo_comps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON grupo_comps
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Adiciona grupo_comps à publicação do Supabase Realtime.
-- Necessário para que postgres_changes sejam transmitidos via WebSocket.
ALTER PUBLICATION supabase_realtime ADD TABLE grupo_comps;
