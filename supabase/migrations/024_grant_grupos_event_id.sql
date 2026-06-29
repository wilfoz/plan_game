-- 024_grant_grupos_event_id.sql
-- A migração 020 restringiu o SELECT de grupos a colunas explícitas (escondendo o
-- hash de senha do role anon). A coluna event_id, adicionada na 023, ficou de fora
-- desse GRANT — então o frontend recebia 401 ao selecioná-la.
-- Aqui concedemos SELECT da nova coluna ao anon (mantendo senha protegida).

GRANT SELECT (event_id) ON public.grupos TO anon;
