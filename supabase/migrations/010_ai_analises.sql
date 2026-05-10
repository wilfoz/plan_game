CREATE TABLE ai_analises (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  grupo_id   uuid        NOT NULL REFERENCES grupos(id)   ON DELETE CASCADE,
  graficos   jsonb       NOT NULL DEFAULT '[]',
  texto      text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, grupo_id)
);

CREATE INDEX ON ai_analises (session_id);

ALTER TABLE ai_analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON ai_analises FOR ALL TO anon USING (true) WITH CHECK (true);
