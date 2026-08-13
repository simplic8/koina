-- KOINA hub schema (profiles, auth helpers, hero, friends/inbox, settings, avatars)
-- Run once on a fresh Supabase project. Admin: admin@koina.space / Indigitous2026!

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  discord_id text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  email_confirmed boolean not null default false,
  email_confirm_token text,
  email_confirm_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_email_confirm_token_uidx
  on public.profiles (email_confirm_token)
  where email_confirm_token is not null;

comment on column public.profiles.display_name is
  'Optional display name (spaces allowed). Username remains the handle without spaces.';

-- ---------------------------------------------------------------------------
-- Hero quotes (landing)
-- ---------------------------------------------------------------------------
create table if not exists public.hero_quotes (
  id uuid primary key default gen_random_uuid(),
  first_line text not null,
  second_line text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (first_line, second_line)
);

-- ---------------------------------------------------------------------------
-- Site settings
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Friendships + inbox
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);
create index if not exists friendships_status_idx on public.friendships (status);

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

create index if not exists direct_messages_pair_created_idx
  on public.direct_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

create index if not exists direct_messages_recipient_unread_idx
  on public.direct_messages (recipient_id, created_at desc)
  where read_at is null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null
    check (type in (
      'friend_request',
      'friend_request_accepted',
      'friend_request_declined',
      'friend_accepted',
      'message'
    )),
  friendship_id uuid references public.friendships (id) on delete set null,
  message_id uuid references public.direct_messages (id) on delete cascade,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.hero_quotes enable row level security;
alter table public.site_settings enable row level security;
alter table public.friendships enable row level security;
alter table public.direct_messages enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "Active hero quotes are public" on public.hero_quotes;
create policy "Active hero quotes are public"
  on public.hero_quotes for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage hero quotes" on public.hero_quotes;
create policy "Admins manage hero quotes"
  on public.hero_quotes for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Site settings are publicly readable" on public.site_settings;
create policy "Site settings are publicly readable"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "friendships_select_participants" on public.friendships;
create policy "friendships_select_participants"
  on public.friendships for select
  using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
    or public.is_admin()
  );

drop policy if exists "friendships_insert_requester" on public.friendships;
create policy "friendships_insert_requester"
  on public.friendships for insert
  with check (auth.uid() = requester_id and requester_id <> addressee_id);

drop policy if exists "friendships_update_participants" on public.friendships;
create policy "friendships_update_participants"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friendships_delete_participants" on public.friendships;
create policy "friendships_delete_participants"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "direct_messages_select_participants" on public.direct_messages;
create policy "direct_messages_select_participants"
  on public.direct_messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = recipient_id
    or public.is_admin()
  );

drop policy if exists "direct_messages_insert_sender" on public.direct_messages;
create policy "direct_messages_insert_sender"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "direct_messages_update_recipient" on public.direct_messages;
create policy "direct_messages_update_recipient"
  on public.direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notifications_insert_service_or_self" on public.notifications;
create policy "notifications_insert_service_or_self"
  on public.notifications for insert
  with check (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Vibe Code workshop registrations
-- ---------------------------------------------------------------------------
create table if not exists public.vibe_code_registrations (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  whatsapp text,
  telegram text,
  discord text,
  consent_vibe_code boolean not null default false,
  consent_koina boolean not null default false,
  created_at timestamptz not null default now(),
  constraint vibe_code_registrations_email_unique unique (email),
  constraint vibe_code_registrations_consent_vibe_required
    check (consent_vibe_code = true)
);

create index if not exists vibe_code_registrations_created_at_idx
  on public.vibe_code_registrations (created_at desc);

alter table public.vibe_code_registrations enable row level security;

drop policy if exists "Admins can read vibe code registrations"
  on public.vibe_code_registrations;
create policy "Admins can read vibe code registrations"
  on public.vibe_code_registrations for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Avatars storage
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Seed: hero quotes
-- ---------------------------------------------------------------------------
insert into public.hero_quotes (first_line, second_line, is_active, sort_order)
values
  ('Shared spaces. Shared interests.', 'Shared purpose.', true, 1),
  ('Belong. Explore.', 'Grow together.', true, 2),
  ('Presence before', 'proclamation.', true, 3),
  ('Fellowship through', 'shared participation.', true, 4)
on conflict (first_line, second_line) do update set
  is_active = true,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Seed: default admin (admin@koina.space / Indigitous2026!)
-- ---------------------------------------------------------------------------
do $$
declare
  v_user_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_email text := 'admin@koina.space';
  v_password text := 'Indigitous2026!';
  v_existing_id uuid;
begin
  if exists (select 1 from auth.users where id = v_user_id) then
    update auth.users
    set
      email = v_email,
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now(),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"username":"admin"}'::jsonb
    where id = v_user_id;

    update auth.identities
    set
      identity_data = jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      provider_id = v_user_id::text,
      updated_at = now()
    where user_id = v_user_id and provider = 'email';

    if not exists (
      select 1 from auth.identities where user_id = v_user_id and provider = 'email'
    ) then
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
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
        now(), now(), now()
      );
    end if;

    update public.profiles
    set
      role = 'admin',
      status = 'active',
      username = coalesce(nullif(username, ''), 'admin'),
      email_confirmed = true
    where id = v_user_id;
    return;
  end if;

  select id into v_existing_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_existing_id is not null then
    update public.profiles
    set role = 'admin', status = 'active',
        username = coalesce(nullif(username, ''), 'admin'),
        email_confirmed = true
    where id = v_existing_id;
    return;
  end if;

  -- Also migrate prior seed emails to the new address if present
  select id into v_existing_id
  from auth.users
  where lower(email) in ('admin@koina.space', 'admin@koina.community', 'admin@justvibing.gg')
  limit 1;

  if v_existing_id is not null then
    update auth.users
    set
      email = v_email,
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_existing_id;

    update public.profiles
    set role = 'admin', status = 'active',
        username = coalesce(nullif(username, ''), 'admin'),
        email_confirmed = true
    where id = v_existing_id;
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, reauthentication_token, phone_change, phone_change_token
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
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
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
    now(), now(), now()
  );

  update public.profiles
  set role = 'admin', status = 'active', username = 'admin', email_confirmed = true
  where id = v_user_id;
end $$;
