-- Migração 019: Rate limiting server-side nas RPCs de login
-- O controle existente vivia só no cliente (localStorage), trivialmente contornável
-- (curl direto à RPC, aba anônima, storage limpo). Aqui ele passa a ser aplicado no
-- banco, dentro das próprias funções de login, com bloqueio temporário por identidade.
--
-- Parâmetros (espelham o cliente): 10 tentativas falhas -> bloqueio de 15 minutos.
-- Identidade por chave lógica: 'admin', 'fac:<login>', 'grp:<nome>'.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela de tentativas de login
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.login_attempts (
  identity      TEXT PRIMARY KEY,
  fail_count    INTEGER NOT NULL DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS habilitado SEM policy = deny-all para anon. Acesso só via SECURITY DEFINER.
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers (SECURITY DEFINER). NÃO devem ser chamáveis pelo cliente — caso contrário
-- um atacante poderia chamar clear_login_attempts('admin') e anular o bloqueio.
-- As funções de login (também DEFINER, owner postgres) as chamam internamente; a
-- checagem de EXECUTE nessas chamadas internas é feita contra o owner, não contra anon.
-- ─────────────────────────────────────────────────────────────────────────────

-- Retorna os segundos restantes de bloqueio (0 se não estiver bloqueado).
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identity text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_locked_until timestamptz;
BEGIN
  SELECT locked_until INTO v_locked_until
    FROM login_attempts WHERE identity = p_identity;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN ceil(extract(epoch FROM (v_locked_until - now())))::int;
  END IF;
  RETURN 0;
END;
$$;

-- Registra uma falha; ao atingir o limite, aplica o bloqueio e zera o contador.
CREATE OR REPLACE FUNCTION public.register_login_fail(p_identity text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO login_attempts (identity, fail_count, updated_at)
  VALUES (p_identity, 1, now())
  ON CONFLICT (identity) DO UPDATE
    SET fail_count = CASE
                       -- bloqueio anterior já expirou -> recomeça a janela
                       WHEN login_attempts.locked_until IS NOT NULL
                            AND login_attempts.locked_until < now() THEN 1
                       ELSE login_attempts.fail_count + 1
                     END,
        locked_until = CASE
                         WHEN login_attempts.locked_until IS NOT NULL
                              AND login_attempts.locked_until < now() THEN NULL
                         ELSE login_attempts.locked_until
                       END,
        updated_at = now()
  RETURNING fail_count INTO v_count;

  IF v_count >= 10 THEN
    UPDATE login_attempts
       SET locked_until = now() + interval '15 minutes',
           fail_count   = 0,
           updated_at   = now()
     WHERE identity = p_identity;
  END IF;
END;
$$;

-- Limpa as tentativas após login bem-sucedido.
CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_identity text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  DELETE FROM login_attempts WHERE identity = p_identity;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text)       FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.register_login_fail(text)    FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(text)   FROM anon, authenticated, public;

-- ═════════════════════════════════════════════════════════════════════════════
-- Login functions: aplicam o rate limit. Em bloqueio, levantam 'rate_limited:<seg>'.
-- (Assinaturas/retornos inalterados -> CREATE OR REPLACE.)
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. Admin ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.login_admin_session(p_senha text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token  uuid;
  v_locked integer;
BEGIN
  v_locked := public.check_rate_limit('admin');
  IF v_locked > 0 THEN
    RAISE EXCEPTION 'rate_limited:%', v_locked;
  END IF;

  IF NOT public.login_admin(p_senha) THEN
    PERFORM public.register_login_fail('admin');
    RETURN NULL;
  END IF;

  PERFORM public.clear_login_attempts('admin');

  DELETE FROM admin_sessions WHERE expires_at < now();
  INSERT INTO admin_sessions DEFAULT VALUES RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

-- 2. Facilitador de evento -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.login_event_facilitador(p_login text, p_senha text)
RETURNS TABLE(event_id uuid, event_nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_identity text := 'fac:' || lower(p_login);
  v_locked   integer;
  v_count    integer;
BEGIN
  v_locked := public.check_rate_limit(v_identity);
  IF v_locked > 0 THEN
    RAISE EXCEPTION 'rate_limited:%', v_locked;
  END IF;

  RETURN QUERY
  SELECT
    id AS event_id,
    nome AS event_nome
  FROM events
  WHERE lower(facilitador_login) = lower(p_login)
    AND facilitador_senha_hash = crypt(p_senha, facilitador_senha_hash);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    PERFORM public.clear_login_attempts(v_identity);
  ELSE
    PERFORM public.register_login_fail(v_identity);
  END IF;
END;
$$;

-- 3. Grupo ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.login_grupo(p_nome text, p_senha text)
RETURNS TABLE(grupo_id uuid, session_id text, grupo_idx integer, session_nome text, event_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_identity text := 'grp:' || upper(p_nome);
  v_locked   integer;
  v_count    integer;
BEGIN
  v_locked := public.check_rate_limit(v_identity);
  IF v_locked > 0 THEN
    RAISE EXCEPTION 'rate_limited:%', v_locked;
  END IF;

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
    s.nome         AS session_nome,
    s.event_id
  FROM ordered o
  JOIN sessions s ON s.id = o.session_id
  WHERE upper(o.nome) = upper(p_nome)
    AND o.senha <> ''
    AND o.senha = crypt(p_senha, o.senha)
  ORDER BY s.created_at DESC;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    PERFORM public.clear_login_attempts(v_identity);
  ELSE
    PERFORM public.register_login_fail(v_identity);
  END IF;
END;
$$;
