-- Adiciona colunas de obrigatoriedade e variação mínima na tabela equipe_base_mo
alter table public.equipe_base_mo
add column if not exists obrigatorio boolean not null default false,
add column if not exists min_var_pct numeric default null;

-- Adiciona coluna de obrigatoriedade na tabela equipe_base_eq
alter table public.equipe_base_eq
add column if not exists obrigatorio boolean not null default false;
