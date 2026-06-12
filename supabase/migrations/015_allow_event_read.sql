-- Permite que usuários anon leiam a tabela de eventos (apenas SELECT)
-- Isso é necessário para que o frontend carregue o nome do evento e a cotação do dólar
CREATE POLICY "allow_anon_select" ON public.events FOR SELECT TO anon USING (true);
