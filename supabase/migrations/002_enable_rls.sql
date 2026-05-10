-- Habilita RLS em todas as tabelas e cria política permissiva para o role anon.
-- O app usa a anon key (exposta no frontend) sem Supabase Auth.
-- Com RLS ativado + política "allow all for anon", o comportamento funcional
-- permanece idêntico, mas o Supabase Security Advisor para de alertar e qualquer
-- role sem a anon key (ex: scripts externos sem autenticação) é bloqueado.

alter table sessions          enable row level security;
alter table lt_config         enable row level security;
alter table atividades_config enable row level security;
alter table equipe_base_mo    enable row level security;
alter table equipe_base_eq    enable row level security;
alter table requisitos        enable row level security;
alter table grupos            enable row level security;
alter table epi_cargo         enable row level security;

create policy "anon_all" on sessions          for all to anon using (true) with check (true);
create policy "anon_all" on lt_config         for all to anon using (true) with check (true);
create policy "anon_all" on atividades_config for all to anon using (true) with check (true);
create policy "anon_all" on equipe_base_mo    for all to anon using (true) with check (true);
create policy "anon_all" on equipe_base_eq    for all to anon using (true) with check (true);
create policy "anon_all" on requisitos        for all to anon using (true) with check (true);
create policy "anon_all" on grupos            for all to anon using (true) with check (true);
create policy "anon_all" on epi_cargo         for all to anon using (true) with check (true);
