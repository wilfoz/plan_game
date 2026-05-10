-- Jornadas LT — schema inicial
-- RLS desabilitado: app interno, acesso controlado por senha de UI

create table sessions (
  id          text primary key,
  nome        text not null default 'Nova Sessão',
  created_at  timestamptz not null default now()
);

create table lt_config (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null references sessions(id) on delete cascade unique,
  nome        text    default '',
  tensao      text    default '500kV',
  ext         numeric default 0,
  circ        text    default 'simples',
  cab_fase    integer default 4,
  pararaios   integer default 2,
  opgw        integer default 1
);

create table atividades_config (
  id              uuid primary key default gen_random_uuid(),
  session_id      text not null references sessions(id) on delete cascade,
  atividade_id    text not null,
  kpi_base        numeric default 0,
  volume_previsto numeric default 0,
  comentario      text    default '',
  unique (session_id, atividade_id)
);

create table equipe_base_mo (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null references sessions(id) on delete cascade,
  atividade_id text not null,
  cat_id       text not null,
  cargo        text not null,
  sal          numeric not null default 0,
  qtd          integer not null default 1,
  horas_dia    numeric not null default 8.5
);

create table equipe_base_eq (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null references sessions(id) on delete cascade,
  atividade_id text not null,
  cat_id       text not null,
  nome         text not null,
  loc          numeric not null default 0,
  qtd          integer not null default 1,
  horas_dia    numeric not null default 8.0
);

create table requisitos (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null references sessions(id) on delete cascade,
  atividade_id text not null,
  categoria    text    default 'Procedimento',
  descricao    text    default '',
  aplicavel    boolean default true,
  created_at   timestamptz not null default now()
);

create table grupos (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null references sessions(id) on delete cascade,
  nome        text not null,
  resp        text    default '',
  senha       text    default '',
  ordem       integer default 0,
  created_at  timestamptz not null default now()
);

create table epi_cargo (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null references sessions(id) on delete cascade,
  mo_cat_id   text not null,
  epi_cat_id  text not null,
  unique (session_id, mo_cat_id, epi_cat_id)
);

-- Índices para queries frequentes
create index on lt_config          (session_id);
create index on atividades_config  (session_id);
create index on equipe_base_mo     (session_id, atividade_id);
create index on equipe_base_eq     (session_id, atividade_id);
create index on requisitos         (session_id);
create index on grupos             (session_id);
create index on epi_cargo          (session_id);
