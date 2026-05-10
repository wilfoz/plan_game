-- Hash de senha dos grupos via pgcrypto (bcrypt)
-- A coluna `senha` passa a armazenar apenas o hash bcrypt.
-- Nunca mais é lida diretamente pelo frontend — a verificação ocorre via RPC.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Armazena hash bcrypt da senha (custo 10)
CREATE OR REPLACE FUNCTION set_grupo_senha(g_id UUID, plaintext TEXT)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE grupos
  SET senha = crypt(plaintext, gen_salt('bf', 10))
  WHERE id = g_id;
$$;

-- Login: verifica senha e retorna identificação do grupo
-- Retorna grupo_id, session_id e o índice 0-based dentro da sessão (por ordem)
CREATE OR REPLACE FUNCTION login_grupo(p_nome TEXT, p_senha TEXT)
RETURNS TABLE(grupo_id UUID, session_id TEXT, grupo_idx INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id                                                                       AS grupo_id,
    g.session_id,
    (ROW_NUMBER() OVER (PARTITION BY g.session_id ORDER BY g.ordem) - 1)::INT AS grupo_idx
  FROM grupos g
  WHERE upper(g.nome) = upper(p_nome)
    AND g.senha <> ''
    AND g.senha = crypt(p_senha, g.senha)
  LIMIT 1;
END;
$$;

-- Migra senhas plaintext existentes para bcrypt
-- (detecta pelo prefixo: hashes bcrypt começam com '$2')
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, senha FROM grupos WHERE senha <> '' AND senha NOT LIKE '$2%'
  LOOP
    PERFORM set_grupo_senha(rec.id, rec.senha);
  END LOOP;
END;
$$;
