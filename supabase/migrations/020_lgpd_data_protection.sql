-- Migração 020: Proteção de dados e controles LGPD
-- 1. Esconde o hash de senha dos grupos do role anon (evita harvesting + PII)
-- 2. Trilha de auditoria append-only para tabelas sensíveis (events/sessions/grupos)
-- 3. RPC de anonimização de dados de um evento (direito à eliminação / minimização)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Proteger a coluna grupos.senha (hash bcrypt) do acesso anon
--    O frontend lê grupos apenas com colunas explícitas (id, session_id, nome,
--    resp, ordem) e o join de sessions também. A senha é gravada via RPC
--    set_grupo_senha (SECURITY DEFINER) e verificada via login_grupo — nunca lida
--    diretamente pelo cliente. INSERT/UPDATE de colunas não são afetados.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE SELECT ON public.grupos FROM anon;
GRANT  SELECT (id, session_id, nome, resp, ordem, created_at) ON public.grupos TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Trilha de auditoria (LGPD Art. 48 — rastreabilidade / resposta a incidentes)
--    Append-only. RLS sem policy => inacessível por anon (leitura só via service_role
--    no dashboard). O trigger é exception-safe: falha de auditoria NUNCA aborta a
--    operação de negócio.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  TEXT NOT NULL,
  operation   TEXT NOT NULL,
  row_id      TEXT,
  db_role     TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_log_table_time ON public.audit_log(table_name, changed_at DESC);

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  BEGIN
    INSERT INTO audit_log (table_name, operation, row_id, db_role)
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END)::text,
      current_user
    );
  EXCEPTION WHEN OTHERS THEN
    -- Auditoria é best-effort: nunca deve derrubar a transação de negócio.
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_events   ON public.events;
DROP TRIGGER IF EXISTS trg_audit_sessions ON public.sessions;
DROP TRIGGER IF EXISTS trg_audit_grupos   ON public.grupos;

CREATE TRIGGER trg_audit_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_grupos
  AFTER INSERT OR UPDATE OR DELETE ON public.grupos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Anonimização de dados de um evento (LGPD Art. 18 — eliminação / minimização)
--    Substitui nomes/responsáveis (dados pessoais) por rótulos genéricos e zera as
--    senhas dos grupos. Deve ser executada pelo admin após o término do evento.
--    Operação irreversível — exige token de sessão admin válido.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.anonymize_event_data(p_admin_token uuid, p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.validate_admin_token(p_admin_token) THEN
    RAISE EXCEPTION 'Acesso negado: sessão administrativa inválida ou expirada.';
  END IF;

  UPDATE grupos g
     SET nome  = 'GRUPO-' || left(g.id::text, 8),
         resp  = '',
         senha = ''
   WHERE g.session_id IN (
     SELECT id FROM sessions WHERE event_id = p_event_id
   );
END;
$$;
