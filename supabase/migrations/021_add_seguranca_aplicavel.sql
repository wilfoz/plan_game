-- 021_add_seguranca_aplicavel.sql
--
-- RECONSTRUÍDA a partir do schema de produção. As migrations 021 e 022 foram
-- aplicadas diretamente no banco remoto e nunca versionadas no repositório,
-- causando drift (a função create_event passou a exigir um 5º argumento que o
-- frontend não enviava -> 404 "Could not find function ... in schema cache").
-- Estes arquivos reproduzem o estado atual do banco para um `db reset` limpo.
--
-- Esta migration cobre a parte de SCHEMA: a coluna seguranca_aplicavel por
-- evento. A redefinição das funções está em 022.

-- Flag de "requisitos de segurança aplicáveis" por evento.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seguranca_aplicavel boolean NOT NULL DEFAULT true;

-- A tabela events usa GRANT de SELECT por coluna para o papel anon
-- (id, nome, cotacao_dolar). A nova coluna precisa do mesmo grant para
-- ser legível publicamente.
GRANT SELECT (seguranca_aplicavel) ON TABLE public.events TO anon;
