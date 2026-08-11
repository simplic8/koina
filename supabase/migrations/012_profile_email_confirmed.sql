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
