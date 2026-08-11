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
