-- 1. Tabela de Eventos
CREATE TABLE IF NOT EXISTS public.events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                    TEXT NOT NULL,
  facilitador_login       TEXT NOT NULL UNIQUE,
  facilitador_senha_hash  TEXT NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS e negar leitura direta para anon
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon" ON public.events FOR ALL TO anon USING (false);

-- 2. Vincular as Sessões a Eventos
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- 3. Criar Evento Padrão e Migrar Dados Legados (Preservação de Dados)
-- Cria um evento padrão com senha provisória 'facilitador123'
DO $$
DECLARE
  v_default_event_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE facilitador_login = 'facilitador') THEN
    INSERT INTO public.events (nome, facilitador_login, facilitador_senha_hash)
    VALUES (
      'Jornada Padrão', 
      'facilitador', 
      extensions.crypt('facilitador123', extensions.gen_salt('bf', 12))
    )
    RETURNING id INTO v_default_event_id;
    
    -- Associar todas as sessões órfãs ao evento padrão
    UPDATE public.sessions
       SET event_id = v_default_event_id
     WHERE event_id IS NULL;
  END IF;
END $$;

-- 4. Criar Senha Mestre do Administrador no app_config
-- Inicializa a senha do administrador como 'admin123' caso não esteja configurada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_config WHERE key = 'admin_senha_hash') THEN
    INSERT INTO public.app_config (key, value)
    VALUES ('admin_senha_hash', extensions.crypt('admin123', extensions.gen_salt('bf', 12)));
  END IF;
END $$;

-- 5. RPC de Autenticação do Administrador
CREATE OR REPLACE FUNCTION public.login_admin(p_senha text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT COALESCE(
    (SELECT value = crypt(p_senha, value)
       FROM app_config
      WHERE key = 'admin_senha_hash'),
    false
  );
$$;

-- RPC para atualizar a senha do administrador
CREATE OR REPLACE FUNCTION public.set_admin_senha(p_senha text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  INSERT INTO app_config (key, value)
    VALUES ('admin_senha_hash', crypt(p_senha, gen_salt('bf', 12)))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
$$;

-- 6. RPC de Autenticação do Facilitador do Evento
CREATE OR REPLACE FUNCTION public.login_event_facilitador(p_login text, p_senha text)
RETURNS TABLE(event_id uuid, event_nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id AS event_id,
    nome AS event_nome
  FROM events
  WHERE lower(facilitador_login) = lower(p_login)
    AND facilitador_senha_hash = crypt(p_senha, facilitador_senha_hash);
END;
$$;

-- 7. RPC de Agregação de Dados para o Dashboard Admin
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data(p_admin_senha text)
RETURNS TABLE(
  event_id uuid,
  event_nome text,
  facilitador_login text,
  created_at timestamptz,
  total_sessions bigint,
  total_groups bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.login_admin(p_admin_senha) THEN
    RAISE EXCEPTION 'Acesso negado: Senha administrativa incorreta.';
  END IF;

  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.nome AS event_nome,
    e.facilitador_login,
    e.created_at,
    COALESCE(count(DISTINCT s.id), 0)::bigint AS total_sessions,
    COALESCE(count(DISTINCT g.id), 0)::bigint AS total_groups
  FROM events e
  LEFT JOIN sessions s ON s.event_id = e.id
  LEFT JOIN grupos g ON g.session_id = s.id
  GROUP BY e.id, e.nome, e.facilitador_login, e.created_at
  ORDER BY e.created_at DESC;
END;
$$;

-- 8. RPC de Criação de Evento
CREATE OR REPLACE FUNCTION public.create_event(
  p_admin_senha text,
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
  IF NOT public.login_admin(p_admin_senha) THEN
    RAISE EXCEPTION 'Acesso negado: Senha administrativa incorreta.';
  END IF;

  INSERT INTO events (nome, facilitador_login, facilitador_senha_hash)
  VALUES (
    p_nome,
    p_fac_login,
    crypt(p_fac_senha, gen_salt('bf', 12))
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- 9. RPC de Remoção de Evento
CREATE OR REPLACE FUNCTION public.delete_event(
  p_admin_senha text,
  p_event_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.login_admin(p_admin_senha) THEN
    RAISE EXCEPTION 'Acesso negado: Senha administrativa incorreta.';
  END IF;

  DELETE FROM events WHERE id = p_event_id;
END;
$$;

-- 10. Atualização do RPC login_grupo para incluir o event_id
DROP FUNCTION IF EXISTS public.login_grupo(text, text);
CREATE OR REPLACE FUNCTION public.login_grupo(p_nome text, p_senha text)
RETURNS TABLE(grupo_id uuid, session_id text, grupo_idx integer, session_nome text, event_id uuid)
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
    s.nome         AS session_nome,
    s.event_id
  FROM ordered o
  JOIN sessions s ON s.id = o.session_id
  WHERE upper(o.nome) = upper(p_nome)
    AND o.senha <> ''
    AND o.senha = crypt(p_senha, o.senha)
  ORDER BY s.created_at DESC;
END;
$$;
