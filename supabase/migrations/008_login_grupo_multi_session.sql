DROP FUNCTION IF EXISTS public.login_grupo(text, text);

CREATE FUNCTION public.login_grupo(p_nome text, p_senha text)
RETURNS TABLE(grupo_id uuid, session_id text, grupo_idx integer, session_nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH ordered AS (
    SELECT
      g.id,
      g.session_id,
      g.senha,
      g.nome,
      (ROW_NUMBER() OVER (PARTITION BY g.session_id ORDER BY g.ordem) - 1)::INT AS idx
    FROM grupos g
  )
  SELECT
    o.id           AS grupo_id,
    o.session_id,
    o.idx          AS grupo_idx,
    s.nome         AS session_nome
  FROM ordered o
  JOIN sessions s ON s.id = o.session_id
  WHERE upper(o.nome) = upper(p_nome)
    AND o.senha <> ''
    AND o.senha = crypt(p_senha, o.senha)
  ORDER BY s.created_at DESC;
END;
$$;
