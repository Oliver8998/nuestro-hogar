create table if not exists push_claves (
  id int primary key,
  publica text not null,
  privada text not null
);
create table if not exists push_subs (
  endpoint text primary key,
  hogar text not null,
  yo int not null,
  sub jsonb not null,
  creado timestamptz default now()
);
create index if not exists push_subs_hogar on push_subs (hogar);
alter table push_claves enable row level security;
alter table push_subs enable row level security;
