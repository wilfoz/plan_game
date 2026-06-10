-- 1. Atualizar a senha do facilitador padrão com o hash legado do app_config
DO $$
DECLARE
  v_old_fac_hash TEXT;
BEGIN
  SELECT value INTO v_old_fac_hash FROM public.app_config WHERE key = 'facilitador_senha_hash';
  
  IF v_old_fac_hash IS NOT NULL THEN
    UPDATE public.events
       SET facilitador_senha_hash = v_old_fac_hash
     WHERE lower(facilitador_login) = 'facilitador';
  END IF;
END $$;
