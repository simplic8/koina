-- Credentials: admin@koina.space / Indigitous2026!
-- Updates existing seed admin (any prior email) to admin@koina.space
do $$
declare
  v_user_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_email text := 'admin@koina.space';
  v_password text := 'Indigitous2026!';
begin
  update auth.users
  set
    email = v_email,
    encrypted_password = crypt(v_password, gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
  where id = v_user_id
     or lower(email) in ('admin@koina.space', 'admin@koina.community', 'admin@justvibing.gg');

  update public.profiles
  set role = 'admin', status = 'active',
      username = coalesce(nullif(username, ''), 'admin'),
      email_confirmed = true
  where id in (
    select id from auth.users
    where lower(email) = lower(v_email)
       or id = v_user_id
  );
end $$;
