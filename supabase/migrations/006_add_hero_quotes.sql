create table if not exists public.hero_quotes (
  id uuid primary key default gen_random_uuid(),
  first_line text not null,
  second_line text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (first_line, second_line)
);

alter table public.hero_quotes enable row level security;

drop policy if exists "Active hero quotes are public" on public.hero_quotes;
create policy "Active hero quotes are public"
  on public.hero_quotes for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage hero quotes" on public.hero_quotes;
create policy "Admins manage hero quotes"
  on public.hero_quotes for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.hero_quotes (
  first_line, second_line, is_active, sort_order
) values (
  'Shared spaces. Shared interests.',
  'Shared purpose.',
  true,
  1
)
on conflict (first_line, second_line) do update set
  is_active = true,
  sort_order = excluded.sort_order;
