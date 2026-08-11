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
