-- Migração 018: Tokens de sessão administrativa
-- Substitui o padrão inseguro de trafegar/armazenar a senha do admin em texto puro
-- (sessionStorage + parâmetro de cada RPC) por um token de sessão opaco com expiração.
--
-- Fluxo novo:
--   1. login_admin_session(senha) -> valida senha, cria sessão, retorna token (uuid)
--   2. cliente guarda apenas o token (nunca a senha)
--   3. RPCs administrativas passam a receber o token e validá-lo via validate_admin_token
--   4. logout_admin_session(token) invalida a sessão no servidor

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela de sessões administrativas
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + interval '8 hours'
);

-- RLS habilitado SEM policy = deny-all para anon. Acesso somente via SECURITY DEFINER.
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: valida um token (existe e não expirou). Retorna apenas boolean.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_admin_token(p_token uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE token = p_token
      AND expires_at > now()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Login: verifica a senha (via login_admin existente), cria sessão e retorna token.
-- Retorna NULL se a senha estiver incorreta (não vaza diferença de timing além do bcrypt).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.login_admin_session(p_senha text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token uuid;
BEGIN
  IF NOT public.login_admin(p_senha) THEN
    RETURN NULL;
  END IF;

  -- Limpeza oportunística de sessões expiradas
  DELETE FROM admin_sessions WHERE expires_at < now();

  INSERT INTO admin_sessions DEFAULT VALUES RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Logout: invalida a sessão no servidor.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.logout_admin_session(p_token uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  DELETE FROM admin_sessions WHERE token = p_token;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- Recriação das RPCs administrativas: passam a autenticar por TOKEN, não por senha.
-- (DROP necessário porque o tipo do 1º parâmetro muda de text -> uuid.)
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. Dashboard ----------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_admin_dashboard_data(text);
CREATE FUNCTION public.get_admin_dashboard_data(p_admin_token uuid)
RETURNS TABLE(
  event_id uuid,
  event_nome text,
  facilitador_login text,
  created_at timestamptz,
  total_sessions bigint,
  total_groups bigint,
  cotacao_dolar numeric
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
    e.cotacao_dolar
  FROM events e
  LEFT JOIN sessions s ON s.event_id = e.id
  LEFT JOIN grupos g ON g.session_id = s.id
  GROUP BY e.id, e.nome, e.facilitador_login, e.created_at, e.cotacao_dolar
  ORDER BY e.created_at DESC;
END;
$$;

-- 2. Criar evento -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_event(text, text, text, text);
CREATE FUNCTION public.create_event(
  p_admin_token uuid,
  p_nome text,
  p_fac_login text,
  p_fac_senha text
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

  INSERT INTO events (nome, facilitador_login, facilitador_senha_hash)
  VALUES (
    p_nome,
    p_fac_login,
    crypt(p_fac_senha, gen_salt('bf', 12))
  )
  RETURNING id INTO v_event_id;

  PERFORM public.seed_event_catalogs(v_event_id);

  RETURN v_event_id;
END;
$$;

-- 3. Excluir evento -----------------------------------------------------------
DROP FUNCTION IF EXISTS public.delete_event(text, uuid);
CREATE FUNCTION public.delete_event(
  p_admin_token uuid,
  p_event_id uuid
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

  DELETE FROM events WHERE id = p_event_id;
END;
$$;

-- 4. Atualizar evento ---------------------------------------------------------
DROP FUNCTION IF EXISTS public.update_event(text, uuid, text, text, text, numeric);
CREATE FUNCTION public.update_event(
  p_admin_token uuid,
  p_event_id uuid,
  p_nome text,
  p_fac_login text,
  p_fac_senha text,
  p_cotacao_dolar numeric
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
           cotacao_dolar = p_cotacao_dolar
     WHERE id = p_event_id;
  ELSE
    UPDATE events
       SET nome = p_nome,
           facilitador_login = p_fac_login,
           cotacao_dolar = p_cotacao_dolar
     WHERE id = p_event_id;
  END IF;
END;
$$;
