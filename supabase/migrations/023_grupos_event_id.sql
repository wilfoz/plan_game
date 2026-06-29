-- 023_grupos_event_id.sql
-- Vincula cada grupo diretamente ao evento (jornada) ao qual pertence.
--
-- Modelo: JORNADA (evento) > SESSÃO > GRUPO.
--   - O mesmo nome de grupo pode ser cadastrado em VÁRIAS sessões do MESMO evento
--     (e o grupo acessa todas elas).
--   - O grupo NÃO acessa sessões de OUTRO evento, mesmo que exista um grupo de mesmo
--     nome lá. O event_id torna essa posse explícita.

-- 1. Coluna event_id (posse explícita do grupo pelo evento) -------------------
ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- 2. Backfill a partir do evento da sessão do grupo ---------------------------
UPDATE public.grupos g
   SET event_id = s.event_id
  FROM public.sessions s
 WHERE s.id = g.session_id
   AND g.event_id IS NULL;

-- 3. Exigir event_id após o backfill ------------------------------------------
ALTER TABLE public.grupos ALTER COLUMN event_id SET NOT NULL;

-- 4. Índice para consultas por evento -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_grupos_event_id ON public.grupos (event_id);

-- 5. Unicidade do nome do grupo por SESSÃO ------------------------------------
-- (mesmo nome pode repetir entre sessões diferentes, inclusive do mesmo evento;
--  não pode repetir dentro da mesma sessão).
CREATE UNIQUE INDEX IF NOT EXISTS uq_grupos_session_nome
  ON public.grupos (session_id, upper(nome));

-- 6. login_grupo: incluir event_nome para rotular o seletor de sessões --------
-- Mantém a lógica de rate-limit de 019 e o multi-session de 008/012.
DROP FUNCTION IF EXISTS public.login_grupo(text, text);
CREATE OR REPLACE FUNCTION public.login_grupo(p_nome text, p_senha text)
RETURNS TABLE(
  grupo_id uuid,
  session_id text,
  grupo_idx integer,
  session_nome text,
  event_id uuid,
  event_nome text
)
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
    s.event_id,
    e.nome         AS event_nome
  FROM ordered o
  JOIN sessions s ON s.id = o.session_id
  LEFT JOIN events e ON e.id = s.event_id
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
