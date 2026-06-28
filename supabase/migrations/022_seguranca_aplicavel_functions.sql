-- 022_seguranca_aplicavel_functions.sql
--
-- RECONSTRUÍDA a partir do schema de produção (ver nota em 021).
-- Redefine as RPCs administrativas para lidar com a coluna
-- events.seguranca_aplicavel adicionada em 021. As assinaturas mudam
-- (nº de argumentos / colunas de retorno), por isso é necessário DROP antes
-- do CREATE — CREATE OR REPLACE criaria uma sobrecarga ambígua para o PostgREST.

-- 1. create_event: ganha o parâmetro p_seguranca_aplicavel --------------------
DROP FUNCTION IF EXISTS public.create_event(uuid, text, text, text);
CREATE FUNCTION public.create_event(
  p_admin_token uuid,
  p_nome text,
  p_fac_login text,
  p_fac_senha text,
  p_seguranca_aplicavel boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  IF NOT public.validate_admin_token(p_admin_token) THEN
    RAISE EXCEPTION 'Acesso negado: sessão administrativa inválida ou expirada.';
  END IF;

  INSERT INTO events (nome, facilitador_login, facilitador_senha_hash, seguranca_aplicavel)
  VALUES (
    p_nome,
    p_fac_login,
    crypt(p_fac_senha, gen_salt('bf', 12)),
    p_seguranca_aplicavel
  )
  RETURNING id INTO v_event_id;

  PERFORM public.seed_event_catalogs(v_event_id);

  RETURN v_event_id;
END;
$$;

-- 2. get_admin_dashboard_data: passa a retornar seguranca_aplicavel ----------
DROP FUNCTION IF EXISTS public.get_admin_dashboard_data(uuid);
CREATE FUNCTION public.get_admin_dashboard_data(p_admin_token uuid)
RETURNS TABLE(
  event_id uuid,
  event_nome text,
  facilitador_login text,
  created_at timestamptz,
  total_sessions bigint,
  total_groups bigint,
  cotacao_dolar numeric,
  seguranca_aplicavel boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.validate_admin_token(p_admin_token) THEN
    RAISE EXCEPTION 'Acesso negado: sessão administrativa inválida ou expirada.';
  END IF;

  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.nome AS event_nome,
    e.facilitador_login,
    e.created_at,
    COALESCE(count(DISTINCT s.id), 0)::bigint AS total_sessions,
    COALESCE(count(DISTINCT g.id), 0)::bigint AS total_groups,
    e.cotacao_dolar,
    e.seguranca_aplicavel
  FROM events e
  LEFT JOIN sessions s ON s.event_id = e.id
  LEFT JOIN grupos g ON g.session_id = s.id
  GROUP BY e.id, e.nome, e.facilitador_login, e.created_at, e.cotacao_dolar, e.seguranca_aplicavel
  ORDER BY e.created_at DESC;
END;
$$;

-- 3. update_event: ganha o parâmetro p_seguranca_aplicavel -------------------
DROP FUNCTION IF EXISTS public.update_event(uuid, uuid, text, text, text, numeric);
CREATE FUNCTION public.update_event(
  p_admin_token uuid,
  p_event_id uuid,
  p_nome text,
  p_fac_login text,
  p_fac_senha text,
  p_cotacao_dolar numeric,
  p_seguranca_aplicavel boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.validate_admin_token(p_admin_token) THEN
    RAISE EXCEPTION 'Acesso negado: sessão administrativa inválida ou expirada.';
  END IF;

  IF p_fac_senha IS NOT NULL AND p_fac_senha <> '' THEN
    UPDATE events
       SET nome = p_nome,
           facilitador_login = p_fac_login,
           facilitador_senha_hash = crypt(p_fac_senha, gen_salt('bf', 12)),
           cotacao_dolar = p_cotacao_dolar,
           seguranca_aplicavel = p_seguranca_aplicavel
     WHERE id = p_event_id;
  ELSE
    UPDATE events
       SET nome = p_nome,
           facilitador_login = p_fac_login,
           cotacao_dolar = p_cotacao_dolar,
           seguranca_aplicavel = p_seguranca_aplicavel
     WHERE id = p_event_id;
  END IF;
END;
$$;
