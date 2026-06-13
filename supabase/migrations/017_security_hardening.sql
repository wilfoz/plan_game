-- Migração 017: Endurecimento de segurança
-- 1. Bloqueia escalonamento de privilégio via RPCs SECURITY DEFINER de troca de senha
-- 2. Restringe a exposição de colunas sensíveis da tabela events para o role anon
--
-- Contexto: o app usa a anon key (pública, embutida no bundle) sem Supabase Auth.
-- Funções SECURITY DEFINER são executáveis por PUBLIC por padrão no Postgres,
-- então qualquer um com a anon key podia chamá-las. As funções abaixo só devem
-- ser executadas via dashboard/CLI (role postgres/service_role), nunca pelo cliente.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. REVOGAR EXECUÇÃO das funções de troca de senha administrativa
--    (account takeover): set_admin_senha e set_facilitador_senha NÃO são chamadas
--    pelo frontend — apenas set_grupo_senha é (criação de grupos pelo facilitador).
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.set_admin_senha(text)        FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_facilitador_senha(text)  FROM anon, authenticated, public;

-- O owner (postgres) e o service_role continuam executando via SQL Editor / CLI.
-- (Owner sempre pode executar suas próprias funções; service_role tem grant explícito.)

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RESTRINGIR COLUNAS DA TABELA events PARA anon
--    A migration 015 liberou SELECT irrestrito (todas as colunas) para anon,
--    expondo facilitador_login (enumeração de usuários) e facilitador_senha_hash.
--    O frontend só precisa de id, nome e cotacao_dolar (AppContext).
--    Logins de facilitador/admin ocorrem via RPCs SECURITY DEFINER, não por SELECT.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE SELECT ON public.events FROM anon;
GRANT  SELECT (id, nome, cotacao_dolar) ON public.events TO anon;

-- A policy RLS "allow_anon_select" (USING true) permanece, controlando acesso por
-- linha; o GRANT por coluna acima passa a controlar acesso por coluna.
-- As RPCs administrativas (get_admin_dashboard_data, create_event, update_event,
-- delete_event, login_event_facilitador) são SECURITY DEFINER e seguem lendo todas
-- as colunas como owner — não são afetadas por este REVOKE.
