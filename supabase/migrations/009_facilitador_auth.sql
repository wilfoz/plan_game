-- Tabela de configuração da aplicação (não legível por anon diretamente)
CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy pública — só acessível via funções SECURITY DEFINER
CREATE POLICY "deny_all" ON app_config FOR ALL TO anon USING (false);

-- RPC de autenticação do facilitador
-- Verifica a senha contra o hash bcrypt armazenado em app_config
-- Nunca retorna o hash — apenas true/false
CREATE OR REPLACE FUNCTION public.login_facilitador(p_senha text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT COALESCE(
    (SELECT value = crypt(p_senha, value)
       FROM app_config
      WHERE key = 'facilitador_senha_hash'),
    false
  );
$$;

-- RPC para atualizar a senha do facilitador (usar somente via dashboard/CLI)
CREATE OR REPLACE FUNCTION public.set_facilitador_senha(p_senha text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  INSERT INTO app_config (key, value)
    VALUES ('facilitador_senha_hash', crypt(p_senha, gen_salt('bf', 12)))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
$$;
