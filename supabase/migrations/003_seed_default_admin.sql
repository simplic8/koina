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
