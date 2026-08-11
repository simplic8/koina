create table if not exists public.session_title_suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  game_slug text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.session_title_suggestions enable row level security;

drop policy if exists "Active session title suggestions are public"
  on public.session_title_suggestions;
create policy "Active session title suggestions are public"
  on public.session_title_suggestions for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage session title suggestions"
  on public.session_title_suggestions;
create policy "Admins manage session title suggestions"
  on public.session_title_suggestions for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.session_title_suggestions (title, game_slug) values
  ('Checkpoint & Chill', null),
  ('Respawn Rally', null),
  ('The Golden Lobby', null),
  ('Squad Goals After Dark', null),
  ('Speedrun Social', null),
  ('Victory Vibes', null),
  ('Co-op Campfire', null),
  ('One More Round', null),
  ('Wayfinder Wednesday', null),
  ('Party Up & Press Play', null),
  ('The Great Roblox Rendezvous', null),
  ('Final Boss Fellowship', null),
  ('The Eternity Climb', 'tower-to-eternity'),
  ('Tower Hour', 'tower-to-eternity'),
  ('Steps to Eternity', 'tower-to-eternity'),
  ('Summit Seekers', 'tower-to-eternity'),
  ('Lightbearer League', 'warrior-of-light'),
  ('Armor & Allies', 'warrior-of-light'),
  ('Runes & Respawns', 'warrior-of-light'),
  ('Shadow Siege Social', 'warrior-of-light'),
  ('Gatebound Gathering', 'run-to-the-gate'),
  ('Seven Signs Sprint', 'run-to-the-gate'),
  ('Path to the Gates', 'run-to-the-gate'),
  ('Run, Rally, Repeat', 'run-to-the-gate')
on conflict (title) do update set
  game_slug = excluded.game_slug,
  is_active = true;
