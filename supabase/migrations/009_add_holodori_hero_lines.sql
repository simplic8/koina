create table if not exists public.holodori_hero_lines (
  id uuid primary key default gen_random_uuid(),
  word_one text not null,
  word_two text not null,
  word_three text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (word_one, word_two, word_three)
);

alter table public.holodori_hero_lines enable row level security;

drop policy if exists "Active holodori hero lines are public"
  on public.holodori_hero_lines;
create policy "Active holodori hero lines are public"
  on public.holodori_hero_lines for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage holodori hero lines"
  on public.holodori_hero_lines;
create policy "Admins manage holodori hero lines"
  on public.holodori_hero_lines for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.holodori_hero_lines (
  word_one, word_two, word_three, is_active, sort_order
) values
  ('Play', 'Expand', 'Dreams', true, 1),
  ('Clear', 'Train', 'Shine', true, 2),
  ('Sing', 'Build', 'Dream', true, 3),
  ('Rhythm', 'Quest', 'Together', true, 4)
on conflict (word_one, word_two, word_three) do update set
  is_active = true,
  sort_order = excluded.sort_order;
