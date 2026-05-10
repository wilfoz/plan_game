-- Composições de equipe por grupo e atividade
-- mo_rows / eq_rows / req_ids armazenados como JSONB para compatibilidade direta com o AppContext
create table grupo_comps (
  id           uuid        primary key default gen_random_uuid(),
  session_id   text        not null references sessions(id) on delete cascade,
  grupo_id     uuid        not null references grupos(id)   on delete cascade,
  atividade_id text        not null,
  kpi          numeric     not null default 0,
  equipes      integer     not null default 1,
  mo_rows      jsonb       not null default '[]',
  eq_rows      jsonb       not null default '[]',
  req_ids      jsonb       not null default '[]',
  updated_at   timestamptz not null default now(),
  unique (grupo_id, atividade_id)
);

create index on grupo_comps (session_id);
create index on grupo_comps (grupo_id);
