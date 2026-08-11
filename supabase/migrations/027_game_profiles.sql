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
