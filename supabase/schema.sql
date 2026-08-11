-- KOINA Supabase schema (compiled from migrations 001–032)
-- Run this once in the Supabase SQL Editor for a new KOINA project.
-- Generated: 2026-08-12


-- =============================================================================
-- 001_init.sql
-- =============================================================================

-- JustVibing foundation schema
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  discord_id text,
  roblox_user_id text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

-- Games (Roblox)
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  platform text not null default 'roblox',
  description text,
  roblox_universe_id text,
  roblox_place_id text,
  ordered_datastore_id text,
  is_vetted boolean not null default false,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  creator_id uuid references public.profiles (id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  capacity int not null default 40,
  registered_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sessions_starts_at_idx on public.sessions (starts_at);
create index if not exists sessions_title_idx on public.sessions (title);
create index if not exists sessions_registered_count_idx on public.sessions (registered_count);
create index if not exists sessions_creator_id_idx on public.sessions (creator_id);

create table if not exists public.session_rsvps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create table if not exists public.session_title_suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  game_slug text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hero_quotes (
  id uuid primary key default gen_random_uuid(),
  first_line text not null,
  second_line text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (first_line, second_line)
);

-- Scores
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  roblox_entry_key text,
  display_name text,
  score int not null default 0,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (game_id, roblox_entry_key)
);

-- Chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'jam-lounge',
  author text not null,
  author_discord_id text,
  body text not null,
  discord_message_id text unique,
  source text not null check (source in ('discord', 'web')),
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Profile bootstrap on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_list text := coalesce(current_setting('app.admin_emails', true), '');
  email_l text := lower(coalesce(new.email, ''));
  uname text;
  is_admin boolean := false;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'player'), '@', 1)
  );

  if admin_list <> '' and position(email_l in lower(admin_list)) > 0 then
    is_admin := true;
  end if;

  insert into public.profiles (id, username, avatar_url, discord_id, role)
  values (
    new.id,
    uname,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    case when is_admin then 'admin' else 'user' end
  )
  on conflict (id) do update set
    username = coalesce(excluded.username, profiles.username),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    discord_id = coalesce(excluded.discord_id, profiles.discord_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is current user admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.sessions enable row level security;
alter table public.session_rsvps enable row level security;
alter table public.session_title_suggestions enable row level security;
alter table public.hero_quotes enable row level security;
alter table public.scores enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- Games
create policy "Published games are public"
  on public.games for select
  using (is_published = true or public.is_admin());

create policy "Admins manage games"
  on public.games for all
  using (public.is_admin())
  with check (public.is_admin());

-- Sessions
create policy "Sessions for published games are public"
  on public.sessions for select
  using (
    exists (
      select 1 from public.games g
      where g.id = sessions.game_id and (g.is_published = true or public.is_admin())
    )
  );

create policy "Admins manage sessions"
  on public.sessions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Session title suggestions
create policy "Active session title suggestions are public"
  on public.session_title_suggestions for select
  using (is_active = true or public.is_admin());

create policy "Admins manage session title suggestions"
  on public.session_title_suggestions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Hero quotes
create policy "Active hero quotes are public"
  on public.hero_quotes for select
  using (is_active = true or public.is_admin());

create policy "Admins manage hero quotes"
  on public.hero_quotes for all
  using (public.is_admin())
  with check (public.is_admin());

-- RSVPs
create policy "RSVPs readable"
  on public.session_rsvps for select using (true);

create policy "Users manage own RSVPs"
  on public.session_rsvps for insert
  with check (auth.uid() = user_id);

create policy "Users delete own RSVPs"
  on public.session_rsvps for delete
  using (auth.uid() = user_id);

-- Scores
create policy "Scores for published games are public"
  on public.scores for select
  using (
    exists (
      select 1 from public.games g
      where g.id = scores.game_id and (g.is_published = true or public.is_admin())
    )
  );

create policy "Admins manage scores"
  on public.scores for all
  using (public.is_admin())
  with check (public.is_admin());

-- Chat
create policy "Chat is readable by everyone"
  on public.chat_messages for select using (true);

create policy "Active users can post chat"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and source = 'web'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.status = 'active'
    )
  );

-- Paginated session listing (search / sort / page)
create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
begin
  if v_search_by not in ('all', 'title', 'creator') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and ($1 is false or s.starts_at >= now())
          and (
            $2::text is null
            or (
              case $3
                when 'title' then s.title ilike '%%' || $2 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $2 || '%%'
                else (
                  s.title ilike '%%' || $2 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $2 || '%%'
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $4 offset $5
    $q$,
    v_order
  )
  using p_upcoming_only, v_search, v_search_by, v_page_size, v_offset;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean
) to anon, authenticated;

-- Realtime
alter publication supabase_realtime add table public.chat_messages;

-- Seed games
insert into public.games (
  id, slug, title, platform, description, roblox_place_id, ordered_datastore_id,
  is_vetted, is_published, is_featured, sort_order, published_at
) values
  (
    '11111111-1111-1111-1111-111111111101',
    'tower-to-eternity',
    'Tower to Eternity',
    'roblox',
    'Find the way to reach the Eternity Tower in this speedrun challenge.',
    '74440430260118',
    'PlayerScores',
    true, true, true, 1, now()
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'warrior-of-light',
    'Warrior Of Light',
    'roblox',
    'Forge legendary gear, unlock hidden power, and defend Yesu''s village from shadow creatures.',
    '76414853406395',
    'PlayerScores',
    true, true, true, 2, now()
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'run-to-the-gate',
    'Run to the Gate',
    'roblox',
    'Follow the path past seven signs and come face to face with the Guy at the Gates.',
    '73387522939923',
    'PlayerScores',
    true, true, true, 3, now()
  )
on conflict (id) do nothing;

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

insert into public.hero_quotes (
  first_line, second_line, is_active, sort_order
) values (
  'Find your squad.',
  'Never grind alone.',
  true,
  1
)
on conflict (first_line, second_line) do update set
  is_active = true,
  sort_order = excluded.sort_order;

insert into public.sessions (id, game_id, title, starts_at, capacity, registered_count) values
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'Friday Night Speedrun Jam',
    now() + interval '6 hours',
    40, 24
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'Weekend Defense Squad',
    now() + interval '30 hours',
    32, 31
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111103',
    'Run to the Gate Co-op Night',
    now() + interval '54 hours',
    40, 12
  )
on conflict (id) do nothing;

insert into public.scores (game_id, roblox_entry_key, display_name, score) values
  ('11111111-1111-1111-1111-111111111101', 'ferretking12', 'ferretking12', 18420),
  ('11111111-1111-1111-1111-111111111103', 'nova_dev', 'nova_dev', 17955),
  ('11111111-1111-1111-1111-111111111101', 'quinnbuilds', 'quinnbuilds', 16210),
  ('11111111-1111-1111-1111-111111111102', 'pixelmage', 'pixelmage', 15880),
  ('11111111-1111-1111-1111-111111111102', 'rustyblox', 'rustyblox', 14905),
  ('11111111-1111-1111-1111-111111111103', 'lumen.exe', 'lumen.exe', 14220),
  ('11111111-1111-1111-1111-111111111101', 'obbyqueen', 'obbyqueen', 13760),
  ('11111111-1111-1111-1111-111111111102', 'tinybuilder', 'tinybuilder', 12995)
on conflict (game_id, roblox_entry_key) do nothing;

insert into public.chat_messages (channel, author, body, source) values
  ('jam-lounge', 'nova_dev', 'anyone else''s obby run keep crashing on the third checkpoint', 'discord'),
  ('jam-lounge', 'ferretking12', 'yeah, admins pushed a fix — reload the place and it should be gone', 'discord'),
  ('jam-lounge', 'quinnbuilds', 'friday jam signups close in an hour, get in while you can', 'discord');

-- Default admin: admin@justvibing.gg / Indigitous2026!
do $$
declare
  v_user_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_email text := 'admin@justvibing.gg';
  v_password text := 'Indigitous2026!';
begin
  if exists (select 1 from auth.users where lower(email) = lower(v_email)) then
    update public.profiles
    set
      role = 'admin',
      status = 'active',
      username = coalesce(nullif(username, ''), 'admin')
    where id = (select id from auth.users where lower(email) = lower(v_email) limit 1);
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    phone_change,
    phone_change_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  update public.profiles
  set role = 'admin', status = 'active', username = 'admin'
  where id = v_user_id;
end $$;


-- =============================================================================
-- 002_update_featured_games.sql
-- =============================================================================

update public.games
set
  slug = 'tower-to-eternity',
  title = 'Tower to Eternity',
  description = 'Find the way to reach the Eternity Tower in this speedrun challenge.',
  roblox_place_id = '74440430260118'
where id = '11111111-1111-1111-1111-111111111101';

update public.games
set
  slug = 'warrior-of-light',
  title = 'Warrior Of Light',
  description = 'Forge legendary gear, unlock hidden power, and defend Yesu''s village from shadow creatures.',
  roblox_place_id = '76414853406395'
where id = '11111111-1111-1111-1111-111111111102';

update public.games
set
  slug = 'run-to-the-gate',
  title = 'Run to the Gate',
  description = 'Follow the path past seven signs and come face to face with the Guy at the Gates.',
  roblox_place_id = '73387522939923'
where id = '11111111-1111-1111-1111-111111111103';

update public.sessions
set title = 'Run to the Gate Co-op Night'
where id = '22222222-2222-2222-2222-222222222203';


-- =============================================================================
-- 003_seed_default_admin.sql
-- =============================================================================

-- Default admin for databases that already ran 001_init.sql
-- Credentials: admin@koina.community / Indigitous2026!
do $$
declare
  v_user_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_email text := 'admin@koina.community';
  v_password text := 'Indigitous2026!';
begin
  if exists (select 1 from auth.users where lower(email) = lower(v_email)) then
    update public.profiles
    set
      role = 'admin',
      status = 'active',
      username = coalesce(nullif(username, ''), 'admin')
    where id = (select id from auth.users where lower(email) = lower(v_email) limit 1);
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    phone_change,
    phone_change_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  update public.profiles
  set role = 'admin', status = 'active', username = 'admin'
  where id = v_user_id;
end $$;


-- =============================================================================
-- 004_add_session_title_suggestions.sql
-- =============================================================================

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


-- =============================================================================
-- 005_add_session_creators_and_listing.sql
-- =============================================================================

-- Creator attribution + paginated session listing
alter table public.sessions
  add column if not exists creator_id uuid references public.profiles (id) on delete set null;

create index if not exists sessions_starts_at_idx on public.sessions (starts_at);
create index if not exists sessions_title_idx on public.sessions (title);
create index if not exists sessions_registered_count_idx on public.sessions (registered_count);
create index if not exists sessions_creator_id_idx on public.sessions (creator_id);

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
begin
  if v_search_by not in ('all', 'title', 'creator') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and ($1 is false or s.starts_at >= now())
          and (
            $2::text is null
            or (
              case $3
                when 'title' then s.title ilike '%%' || $2 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $2 || '%%'
                else (
                  s.title ilike '%%' || $2 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $2 || '%%'
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $4 offset $5
    $q$,
    v_order
  )
  using p_upcoming_only, v_search, v_search_by, v_page_size, v_offset;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean
) to anon, authenticated;


-- =============================================================================
-- 006_add_hero_quotes.sql
-- =============================================================================

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


-- =============================================================================
-- 007_add_holodori_game.sql
-- =============================================================================

-- Holodori (Hololive Dreams) as a schedulable non-Roblox game
insert into public.games (
  id, slug, title, platform, description,
  roblox_universe_id, roblox_place_id, ordered_datastore_id,
  is_vetted, is_published, is_featured, sort_order, published_at
) values (
  '11111111-1111-1111-1111-111111111104',
  'holodori',
  'Holodori',
  'external',
  'Hololive Dreams — free-to-play rhythm & RPG. Clear songs, train holomems, and expand the Dream Park together.',
  null,
  null,
  null,
  true,
  true,
  false,
  4,
  now()
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  platform = excluded.platform,
  description = excluded.description,
  roblox_universe_id = null,
  roblox_place_id = null,
  ordered_datastore_id = null,
  is_vetted = true,
  is_published = true,
  is_featured = false,
  sort_order = excluded.sort_order;

insert into public.session_title_suggestions (title, game_slug) values
  ('Dream Park Party', 'holodori'),
  ('Rhythm Rally', 'holodori'),
  ('Holomem Hangout', 'holodori'),
  ('Chart Clear Crew', 'holodori'),
  ('Park Expansion Night', 'holodori'),
  ('Song Clear Social', 'holodori')
on conflict (title) do update set
  game_slug = excluded.game_slug,
  is_active = true;


-- =============================================================================
-- 008_avatars_storage.sql
-- =============================================================================

-- Public avatars bucket for profile pictures
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================================================
-- 009_add_holodori_hero_lines.sql
-- =============================================================================

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


-- =============================================================================
-- 010_google_auth_avatar.sql
-- =============================================================================

-- Prefer Google's picture claim when avatar_url is absent
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_list text := coalesce(current_setting('app.admin_emails', true), '');
  email_l text := lower(coalesce(new.email, ''));
  uname text;
  is_admin boolean := false;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'player'), '@', 1)
  );

  if admin_list <> '' and position(email_l in lower(admin_list)) > 0 then
    is_admin := true;
  end if;

  insert into public.profiles (id, username, avatar_url, discord_id, role)
  values (
    new.id,
    uname,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    case when is_admin then 'admin' else 'user' end
  )
  on conflict (id) do update set
    username = coalesce(excluded.username, profiles.username),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    discord_id = coalesce(excluded.discord_id, profiles.discord_id);

  return new;
end;
$$;


-- =============================================================================
-- 011_default_user_role.sql
-- =============================================================================

-- New accounts always start as general users (role=user).
-- Promote admins explicitly via Admin → Users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'player'), '@', 1)
  );

  insert into public.profiles (id, username, avatar_url, discord_id, role)
  values (
    new.id,
    uname,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    'user'
  )
  on conflict (id) do update set
    username = coalesce(excluded.username, profiles.username),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    discord_id = coalesce(excluded.discord_id, profiles.discord_id);

  return new;
end;
$$;


-- =============================================================================
-- 012_profile_email_confirmed.sql
-- =============================================================================

-- App-level email confirmation (independent of OAuth providers auto-confirming).
-- Users may only use the app after clicking the Resend confirmation link.
alter table public.profiles
  add column if not exists email_confirmed boolean not null default false;

-- Existing accounts that already verified email in Auth stay usable.
update public.profiles p
set email_confirmed = true
where exists (
  select 1
  from auth.users u
  where u.id = p.id
    and u.email_confirmed_at is not null
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'player'), '@', 1)
  );

  insert into public.profiles (
    id, username, avatar_url, discord_id, role, email_confirmed
  )
  values (
    new.id,
    uname,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    'user',
    false
  )
  on conflict (id) do update set
    username = coalesce(excluded.username, profiles.username),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    discord_id = coalesce(excluded.discord_id, profiles.discord_id);

  return new;
end;
$$;


-- =============================================================================
-- 013_email_confirm_token.sql
-- =============================================================================

-- App-owned email confirmation tokens (independent of Supabase Auth OTP).
-- These avoid verifyOtp type/expiry issues and confirmation redirect loops.

alter table public.profiles
  add column if not exists email_confirm_token text,
  add column if not exists email_confirm_expires_at timestamptz;

create unique index if not exists profiles_email_confirm_token_uidx
  on public.profiles (email_confirm_token)
  where email_confirm_token is not null;

-- Look up auth.users by email (service role / security definer only).
create or replace function public.find_auth_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = auth, public
stable
as $$
  select id
  from auth.users
  where lower(email) = lower(lookup_email)
  limit 1;
$$;

revoke all on function public.find_auth_user_id_by_email(text) from public;
grant execute on function public.find_auth_user_id_by_email(text) to service_role;


-- =============================================================================
-- 014_chat_channel_web.sql
-- =============================================================================

-- Point existing chat rows at the #web mirror channel.
update public.chat_messages
set channel = 'web'
where channel = 'jam-lounge';

alter table public.chat_messages
  alter column channel set default 'web';


-- =============================================================================
-- 015_site_settings.sql
-- =============================================================================

-- Global site settings (key/value), publicly readable, admin-writable.

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Site settings are publicly readable" on public.site_settings;
create policy "Site settings are publicly readable"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_settings (key, value)
values
  ('chat_refresh_interval_seconds', '5'),
  ('chat_last_discord_sync_at', '')
on conflict (key) do nothing;


-- =============================================================================
-- 016_chat_author_avatar.sql
-- =============================================================================

-- Per-message author avatar (Discord CDN or site profile URL).
alter table public.chat_messages
  add column if not exists author_avatar_url text;


-- =============================================================================
-- 017_chat_avatar_decoration.sql
-- =============================================================================

-- Discord Nitro avatar decorations (profile stickers around the PFP).
alter table public.chat_messages
  add column if not exists author_avatar_decoration_url text;


-- =============================================================================
-- 018_chat_author_badges.sql
-- =============================================================================

-- Discord profile badges (public_flags + optional clan/server tag).
alter table public.chat_messages
  add column if not exists author_badges jsonb not null default '[]'::jsonb;


-- =============================================================================
-- 019_game_translations_and_session_locale.sql
-- =============================================================================

-- Curated game copy translations + locale tag on user sessions

create table if not exists public.game_translations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  locale text not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_translations_locale_check check (
    locale in ('en', 'ja', 'ko', 'fil', 'ms', 'id', 'zh-CN', 'zh-TW')
  ),
  constraint game_translations_game_locale_unique unique (game_id, locale)
);

create index if not exists game_translations_game_id_idx
  on public.game_translations (game_id);

create index if not exists game_translations_locale_idx
  on public.game_translations (locale);

alter table public.game_translations enable row level security;

drop policy if exists "Game translations are public"
  on public.game_translations;
create policy "Game translations are public"
  on public.game_translations for select
  using (true);

drop policy if exists "Admins manage game translations"
  on public.game_translations;
create policy "Admins manage game translations"
  on public.game_translations for all
  using (public.is_admin())
  with check (public.is_admin());

-- Session locale (author language tag; source of truth stays original title)
alter table public.sessions
  add column if not exists locale text;

update public.sessions
set locale = 'en'
where locale is null;

alter table public.sessions
  alter column locale set default 'en';

alter table public.sessions
  alter column locale set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sessions_locale_check'
  ) then
    alter table public.sessions
      add constraint sessions_locale_check check (
        locale in ('en', 'ja', 'ko', 'fil', 'ms', 'id', 'zh-CN', 'zh-TW')
      );
  end if;
end $$;

create index if not exists sessions_locale_idx on public.sessions (locale);

-- Seed curated translations (English row mirrors base games for completeness)
insert into public.game_translations (game_id, locale, title, description)
select g.id, v.locale, v.title, v.description
from public.games g
join (
  values
    -- tower-to-eternity
    ('tower-to-eternity', 'en', 'Tower to Eternity',
     'Find the way to reach the Eternity Tower in this speedrun challenge.'),
    ('tower-to-eternity', 'ja', 'Tower to Eternity',
     'スピードランでエターニティタワーへたどり着く道を見つけよう。'),
    ('tower-to-eternity', 'ko', 'Tower to Eternity',
     '스피드런으로 이터니티 타워에 도달하는 길을 찾으세요.'),
    ('tower-to-eternity', 'fil', 'Tower to Eternity',
     'Hanapin ang daan patungo sa Eternity Tower sa speedrun challenge na ito.'),
    ('tower-to-eternity', 'ms', 'Tower to Eternity',
     'Cari jalan ke Menara Eternity dalam cabaran speedrun ini.'),
    ('tower-to-eternity', 'id', 'Tower to Eternity',
     'Temukan jalan ke Menara Eternity dalam tantangan speedrun ini.'),
    ('tower-to-eternity', 'zh-CN', 'Tower to Eternity',
     '在这场竞速挑战中，找到通往永恒之塔的路。'),
    ('tower-to-eternity', 'zh-TW', 'Tower to Eternity',
     '在這場競速挑戰中，找到通往永恆之塔的路。'),

    -- warrior-of-light
    ('warrior-of-light', 'en', 'Warrior Of Light',
     'Forge legendary gear, unlock hidden power, and defend Yesu''s village from shadow creatures.'),
    ('warrior-of-light', 'ja', 'Warrior Of Light',
     '伝説の装備を鍛え、隠された力を解き放ち、イェスの村を影の生き物から守れ。'),
    ('warrior-of-light', 'ko', 'Warrior Of Light',
     '전설의 장비를 만들고 숨겨진 힘을 해금해 Yesu의 마을을 그림자 생물로부터 지키세요.'),
    ('warrior-of-light', 'fil', 'Warrior Of Light',
     'Gumawa ng legendary gear, i-unlock ang hidden power, at ipagtanggol ang nayon ni Yesu mula sa shadow creatures.'),
    ('warrior-of-light', 'ms', 'Warrior Of Light',
     'Tempa gear legenda, buka kuasa tersembunyi, dan pertahankan kampung Yesu daripada makhluk bayang.'),
    ('warrior-of-light', 'id', 'Warrior Of Light',
     'Tempa perlengkapan legendaris, buka kekuatan tersembunyi, dan bela desa Yesu dari makhluk bayangan.'),
    ('warrior-of-light', 'zh-CN', 'Warrior Of Light',
     '打造传说装备、解锁隐藏力量，保卫 Yesu 的村庄免受暗影生物侵袭。'),
    ('warrior-of-light', 'zh-TW', 'Warrior Of Light',
     '打造傳說裝備、解鎖隱藏力量，保衛 Yesu 的村莊免受暗影生物侵襲。'),

    -- run-to-the-gate
    ('run-to-the-gate', 'en', 'Run to the Gate',
     'Follow the path past seven signs and come face to face with the Guy at the Gates.'),
    ('run-to-the-gate', 'ja', 'Run to the Gate',
     '七つの標識を越えて進み、ゲートの男と対峙しよう。'),
    ('run-to-the-gate', 'ko', 'Run to the Gate',
     '일곱 표지를 지나 길을 따라가 게이트의 가이와 마주하세요.'),
    ('run-to-the-gate', 'fil', 'Run to the Gate',
     'Sundan ang landas lampas sa pitong palatandaan at harapin ang Guy at the Gates.'),
    ('run-to-the-gate', 'ms', 'Run to the Gate',
     'Ikuti laluan melepasi tujuh tanda dan berhadapan dengan Guy at the Gates.'),
    ('run-to-the-gate', 'id', 'Run to the Gate',
     'Ikuti jalur melewati tujuh tanda dan berhadapan dengan Guy at the Gates.'),
    ('run-to-the-gate', 'zh-CN', 'Run to the Gate',
     '沿着小路越过七个路标，直面守门人。'),
    ('run-to-the-gate', 'zh-TW', 'Run to the Gate',
     '沿著小路越過七個路標，直面守門人。'),

    -- holodori
    ('holodori', 'en', 'Holodori',
     'Hololive Dreams — free-to-play rhythm & RPG. Clear songs, train holomems, and expand the Dream Park together.'),
    ('holodori', 'ja', 'ホロドリ',
     'ホロライブドリームス — 無料のリズム＆RPG。楽曲をクリアし、ホロメンを育て、ドリームパークを広げよう。'),
    ('holodori', 'ko', 'Holodori',
     '홀로라이브 드림스 — 무료 리듬 & RPG. 곡을 클리어하고 홀로멤을 키우며 드림 파크를 확장하세요.'),
    ('holodori', 'fil', 'Holodori',
     'Hololive Dreams — free-to-play rhythm & RPG. I-clear ang songs, i-train ang holomems, at palawakin ang Dream Park.'),
    ('holodori', 'ms', 'Holodori',
     'Hololive Dreams — rhythm & RPG percuma. Lengkapkan lagu, latih holomem, dan kembangkan Dream Park bersama.'),
    ('holodori', 'id', 'Holodori',
     'Hololive Dreams — rhythm & RPG gratis. Selesaikan lagu, latih holomem, dan kembangkan Dream Park bersama.'),
    ('holodori', 'zh-CN', 'Holodori',
     'Hololive Dreams — 免费节奏 & RPG。通关曲目、培养 holomem，一起扩建梦想乐园。'),
    ('holodori', 'zh-TW', 'Holodori',
     'Hololive Dreams — 免費節奏 & RPG。通關曲目、培養 holomem，一起擴建夢想樂園。')
) as v(slug, locale, title, description)
  on g.slug = v.slug
on conflict (game_id, locale) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

-- Refresh list_sessions to expose locale
drop function if exists public.list_sessions(
  text, text, text, text, int, int, boolean
);

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  locale text,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
begin
  if v_search_by not in ('all', 'title', 'creator') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          s.locale,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and ($1 is false or s.starts_at >= now())
          and (
            $2::text is null
            or (
              case $3
                when 'title' then s.title ilike '%%' || $2 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $2 || '%%'
                else (
                  s.title ilike '%%' || $2 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $2 || '%%'
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.locale,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $4 offset $5
    $q$,
    v_order
  )
  using p_upcoming_only, v_search, v_search_by, v_page_size, v_offset;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean
) to anon, authenticated;


-- =============================================================================
-- 020_list_sessions_past_only.sql
-- =============================================================================

-- Support listing past sessions via list_sessions(p_past_only := true)

drop function if exists public.list_sessions(
  text, text, text, text, int, int, boolean
);

drop function if exists public.list_sessions(
  text, text, text, text, int, int, boolean, boolean
);

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true,
  p_past_only boolean default false
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  locale text,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
  v_time_clause text;
begin
  if v_search_by not in ('all', 'title', 'creator') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  if coalesce(p_past_only, false) then
    v_time_clause := 's.starts_at < now()';
  elsif coalesce(p_upcoming_only, true) then
    v_time_clause := 's.starts_at >= now()';
  else
    v_time_clause := 'true';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          s.locale,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and (%s)
          and (
            $1::text is null
            or (
              case $2
                when 'title' then s.title ilike '%%' || $1 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $1 || '%%'
                else (
                  s.title ilike '%%' || $1 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $1 || '%%'
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.locale,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $3 offset $4
    $q$,
    v_time_clause,
    v_order
  )
  using v_search, v_search_by, v_page_size, v_offset;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean, boolean
) to anon, authenticated;


-- =============================================================================
-- 021_users_create_sessions.sql
-- =============================================================================

-- Allow signed-in users to create sessions they host (service role still used by API).
drop policy if exists "Authenticated users create sessions" on public.sessions;
create policy "Authenticated users create sessions"
  on public.sessions for insert
  to authenticated
  with check (
    auth.uid() = creator_id
    and exists (
      select 1
      from public.games g
      where g.id = game_id
        and g.is_published = true
    )
  );

drop policy if exists "Creators update own sessions" on public.sessions;
create policy "Creators update own sessions"
  on public.sessions for update
  to authenticated
  using (auth.uid() = creator_id or public.is_admin())
  with check (auth.uid() = creator_id or public.is_admin());


-- =============================================================================
-- 022_session_join_leave.sql
-- =============================================================================

-- Keep registered_count in sync with session_rsvps via join/leave RPCs.

update public.sessions s
set registered_count = coalesce((
  select count(*)::int
  from public.session_rsvps r
  where r.session_id = s.id
), 0);

create or replace function public.join_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_capacity int;
  v_count int;
  v_starts timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select capacity, registered_count, starts_at
    into v_capacity, v_count, v_starts
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_starts <= now() then
    raise exception 'session_started';
  end if;

  if exists (
    select 1
    from public.session_rsvps
    where session_id = p_session_id
      and user_id = v_uid
  ) then
    return jsonb_build_object(
      'joined', true,
      'registered_count', v_count,
      'capacity', v_capacity
    );
  end if;

  if v_count >= v_capacity then
    raise exception 'session_full';
  end if;

  insert into public.session_rsvps (session_id, user_id)
  values (p_session_id, v_uid);

  update public.sessions
  set registered_count = registered_count + 1
  where id = p_session_id
  returning registered_count into v_count;

  return jsonb_build_object(
    'joined', true,
    'registered_count', v_count,
    'capacity', v_capacity
  );
end;
$$;

create or replace function public.leave_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_capacity int;
  v_count int;
  v_deleted int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select capacity, registered_count
    into v_capacity, v_count
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  delete from public.session_rsvps
  where session_id = p_session_id
    and user_id = v_uid;

  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    update public.sessions
    set registered_count = greatest(registered_count - 1, 0)
    where id = p_session_id
    returning registered_count into v_count;
  end if;

  return jsonb_build_object(
    'joined', false,
    'registered_count', v_count,
    'capacity', v_capacity
  );
end;
$$;

revoke all on function public.join_session(uuid) from public;
revoke all on function public.leave_session(uuid) from public;
grant execute on function public.join_session(uuid) to authenticated;
grant execute on function public.leave_session(uuid) to authenticated;


-- =============================================================================
-- 023_creators_delete_sessions.sql
-- =============================================================================

-- Allow session creators (and admins) to delete their own sessions.
drop policy if exists "Creators delete own sessions" on public.sessions;
create policy "Creators delete own sessions"
  on public.sessions for delete
  to authenticated
  using (auth.uid() = creator_id or public.is_admin());


-- =============================================================================
-- 024_list_sessions_game_slug.sql
-- =============================================================================

-- Filter list_sessions by game slug (e.g. holodori)

drop function if exists public.list_sessions(
  text, text, text, text, int, int, boolean, boolean
);

drop function if exists public.list_sessions(
  text, text, text, text, int, int, boolean, boolean, text
);

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true,
  p_past_only boolean default false,
  p_game_slug text default null
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  locale text,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_game_slug text := nullif(trim(coalesce(p_game_slug, '')), '');
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
  v_time_clause text;
begin
  if v_search_by not in ('all', 'title', 'creator') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  if coalesce(p_past_only, false) then
    v_time_clause := 's.starts_at < now()';
  elsif coalesce(p_upcoming_only, true) then
    v_time_clause := 's.starts_at >= now()';
  else
    v_time_clause := 'true';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          s.locale,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and (%s)
          and ($5::text is null or g.slug = $5)
          and (
            $1::text is null
            or (
              case $2
                when 'title' then s.title ilike '%%' || $1 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $1 || '%%'
                else (
                  s.title ilike '%%' || $1 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $1 || '%%'
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.locale,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $3 offset $4
    $q$,
    v_time_clause,
    v_order
  )
  using v_search, v_search_by, v_page_size, v_offset, v_game_slug;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean, boolean, text
) to anon, authenticated;


-- =============================================================================
-- 025_list_sessions_search_game.sql
-- =============================================================================

-- Include game title in list_sessions search / filter-by

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true,
  p_past_only boolean default false,
  p_game_slug text default null
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  locale text,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_game_slug text := nullif(trim(coalesce(p_game_slug, '')), '');
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
  v_time_clause text;
begin
  if v_search_by not in ('all', 'title', 'creator', 'game') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  if coalesce(p_past_only, false) then
    v_time_clause := 's.starts_at < now()';
  elsif coalesce(p_upcoming_only, true) then
    v_time_clause := 's.starts_at >= now()';
  else
    v_time_clause := 'true';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          s.locale,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and (%s)
          and ($5::text is null or g.slug = $5)
          and (
            $1::text is null
            or (
              case $2
                when 'title' then s.title ilike '%%' || $1 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $1 || '%%'
                when 'game' then (
                  g.title ilike '%%' || $1 || '%%'
                  or g.slug ilike '%%' || $1 || '%%'
                  or exists (
                    select 1
                    from public.game_translations gt
                    where gt.game_id = g.id
                      and gt.title ilike '%%' || $1 || '%%'
                  )
                )
                else (
                  s.title ilike '%%' || $1 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $1 || '%%'
                  or g.title ilike '%%' || $1 || '%%'
                  or g.slug ilike '%%' || $1 || '%%'
                  or exists (
                    select 1
                    from public.game_translations gt
                    where gt.game_id = g.id
                      and gt.title ilike '%%' || $1 || '%%'
                  )
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.locale,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $3 offset $4
    $q$,
    v_time_clause,
    v_order
  )
  using v_search, v_search_by, v_page_size, v_offset, v_game_slug;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean, boolean, text
) to anon, authenticated;


-- =============================================================================
-- 026_list_sessions_search_platform.sql
-- =============================================================================

-- Include platform in list_sessions search / filter-by

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true,
  p_past_only boolean default false,
  p_game_slug text default null
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  locale text,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_game_slug text := nullif(trim(coalesce(p_game_slug, '')), '');
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
  v_time_clause text;
begin
  if v_search_by not in ('all', 'title', 'creator', 'game', 'platform') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  if coalesce(p_past_only, false) then
    v_time_clause := 's.starts_at < now()';
  elsif coalesce(p_upcoming_only, true) then
    v_time_clause := 's.starts_at >= now()';
  else
    v_time_clause := 'true';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          s.locale,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and (%s)
          and ($5::text is null or g.slug = $5)
          and (
            $1::text is null
            or (
              case $2
                when 'title' then s.title ilike '%%' || $1 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $1 || '%%'
                when 'game' then (
                  g.title ilike '%%' || $1 || '%%'
                  or g.slug ilike '%%' || $1 || '%%'
                  or exists (
                    select 1
                    from public.game_translations gt
                    where gt.game_id = g.id
                      and gt.title ilike '%%' || $1 || '%%'
                  )
                )
                when 'platform' then coalesce(g.platform, '') ilike '%%' || $1 || '%%'
                else (
                  s.title ilike '%%' || $1 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $1 || '%%'
                  or g.title ilike '%%' || $1 || '%%'
                  or g.slug ilike '%%' || $1 || '%%'
                  or coalesce(g.platform, '') ilike '%%' || $1 || '%%'
                  or exists (
                    select 1
                    from public.game_translations gt
                    where gt.game_id = g.id
                      and gt.title ilike '%%' || $1 || '%%'
                  )
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.locale,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $3 offset $4
    $q$,
    v_time_clause,
    v_order
  )
  using v_search, v_search_by, v_page_size, v_offset, v_game_slug;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean, boolean, text
) to anon, authenticated;


-- =============================================================================
-- 027_game_profiles.sql
-- =============================================================================

-- Per-platform game profiles (Holodori, Roblox)

create table if not exists public.game_profiles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('holodori', 'roblox')),
  -- Holodori
  holodori_game_id text,
  oshi_ids text[] not null default '{}',
  -- Roblox
  roblox_username text,
  roblox_display_name text,
  roblox_user_id text,
  roblox_avatar_url text,
  roblox_bio text,
  roblox_online_status text,
  roblox_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, platform)
);

create index if not exists game_profiles_platform_idx
  on public.game_profiles (platform);

alter table public.game_profiles enable row level security;

drop policy if exists "game_profiles_select_own" on public.game_profiles;
create policy "game_profiles_select_own"
  on public.game_profiles for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "game_profiles_insert_own" on public.game_profiles;
create policy "game_profiles_insert_own"
  on public.game_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "game_profiles_update_own" on public.game_profiles;
create policy "game_profiles_update_own"
  on public.game_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "game_profiles_delete_own" on public.game_profiles;
create policy "game_profiles_delete_own"
  on public.game_profiles for delete
  using (auth.uid() = user_id);


-- =============================================================================
-- 028_profile_display_name.sql
-- =============================================================================

-- Optional friendly name shown in the UI; username stays the unique handle (no spaces).

alter table public.profiles
  add column if not exists display_name text;

comment on column public.profiles.display_name is
  'Optional display name (spaces allowed). Username remains the handle without spaces.';


-- =============================================================================
-- 029_friendships.sql
-- =============================================================================

-- One-way friendships: user_id added friend_id to their friends list.

create table if not exists public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint friendships_no_self check (user_id <> friend_id)
);

create index if not exists friendships_friend_id_idx
  on public.friendships (friend_id);

create index if not exists friendships_user_created_idx
  on public.friendships (user_id, created_at desc);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
  on public.friendships for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
  on public.friendships for insert
  with check (auth.uid() = user_id and user_id <> friend_id);

drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own"
  on public.friendships for delete
  using (auth.uid() = user_id);


-- =============================================================================
-- 030_friend_requests_messages.sql
-- =============================================================================

-- Friend requests (pending → accepted) + DMs + inbox notifications.
-- Replaces the one-way friendships table from 029.

drop policy if exists "friendships_select_own" on public.friendships;
drop policy if exists "friendships_insert_own" on public.friendships;
drop policy if exists "friendships_delete_own" on public.friendships;
drop table if exists public.friendships cascade;

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

-- One relationship per unordered pair
create unique index friendships_unique_pair_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);
create index friendships_status_idx on public.friendships (status);

alter table public.friendships enable row level security;

create policy "friendships_select_participants"
  on public.friendships for select
  using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
    or public.is_admin()
  );

create policy "friendships_insert_requester"
  on public.friendships for insert
  with check (auth.uid() = requester_id and requester_id <> addressee_id);

create policy "friendships_update_participants"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_delete_participants"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Direct messages (friends only — enforced in API)
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null
    check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint direct_messages_no_self check (sender_id <> recipient_id)
);

create index direct_messages_pair_created_idx
  on public.direct_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

create index direct_messages_recipient_unread_idx
  on public.direct_messages (recipient_id, created_at desc)
  where read_at is null;

alter table public.direct_messages enable row level security;

create policy "direct_messages_select_participants"
  on public.direct_messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = recipient_id
    or public.is_admin()
  );

create policy "direct_messages_insert_sender"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

create policy "direct_messages_update_recipient"
  on public.direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Inbox notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null
    check (type in ('friend_request', 'friend_accepted', 'message')),
  friendship_id uuid references public.friendships (id) on delete cascade,
  message_id uuid references public.direct_messages (id) on delete cascade,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin());

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts happen via service role from the API (or allow authenticated insert for own outbound mirrors — use service).
create policy "notifications_insert_service_or_self"
  on public.notifications for insert
  with check (auth.uid() = user_id or public.is_admin());


-- =============================================================================
-- 031_friend_request_notification_outcomes.sql
-- =============================================================================

-- Keep friend-request notifications after accept/decline, with resolved types.
-- Declining used to delete the friendship and cascade-delete the notification.

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'friend_request',
    'friend_request_accepted',
    'friend_request_declined',
    'friend_accepted',
    'message'
  ));

alter table public.notifications
  drop constraint if exists notifications_friendship_id_fkey;

alter table public.notifications
  add constraint notifications_friendship_id_fkey
  foreign key (friendship_id)
  references public.friendships (id)
  on delete set null;


-- =============================================================================
-- 032_koina_hero_quotes.sql
-- =============================================================================

-- KOINA hero quotes from the brand deck
-- Shared spaces. Shared interests. Shared purpose.

update public.hero_quotes set is_active = false;

insert into public.hero_quotes (
  first_line, second_line, is_active, sort_order
) values
  ('Shared spaces. Shared interests.', 'Shared purpose.', true, 1),
  ('Belong. Explore.', 'Grow together.', true, 2),
  ('Presence before', 'proclamation.', true, 3),
  ('Fellowship through', 'shared participation.', true, 4)
on conflict (first_line, second_line) do update set
  is_active = true,
  sort_order = excluded.sort_order;

