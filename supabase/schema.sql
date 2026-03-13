create table if not exists public.entries (
  id text primary key,
  date date not null,
  revenue numeric not null default 0,
  coupons numeric not null default 0,
  debit_note text not null default '',
  invoices numeric not null default 0,
  credit_note text not null default ''
);

create table if not exists public.settings (
  key text primary key,
  value text not null
);

create table if not exists public.archives (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  data jsonb not null
);

alter table public.entries enable row level security;
alter table public.settings enable row level security;
alter table public.archives enable row level security;

drop policy if exists "entries_public_access" on public.entries;
create policy "entries_public_access"
on public.entries
for all
using (true)
with check (true);

drop policy if exists "settings_public_access" on public.settings;
create policy "settings_public_access"
on public.settings
for all
using (true)
with check (true);

drop policy if exists "archives_public_access" on public.archives;
create policy "archives_public_access"
on public.archives
for all
using (true)
with check (true);
