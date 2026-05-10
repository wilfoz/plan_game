CREATE OR REPLACE FUNCTION public.login_grupo(p_nome text, p_senha text)
RETURNS TABLE(grupo_id uuid, session_id text, grupo_idx integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH ordered AS (
    SELECT
      id,
      session_id,
      senha,
      nome,
      (ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY ordem) - 1)::INT AS idx
    FROM grupos
  )
  SELECT
    o.id         AS grupo_id,
    o.session_id,
    o.idx        AS grupo_idx
  FROM ordered o
  WHERE upper(o.nome) = upper(p_nome)
    AND o.senha <> ''
    AND o.senha = crypt(p_senha, o.senha)
  LIMIT 1;
END;
$$;
