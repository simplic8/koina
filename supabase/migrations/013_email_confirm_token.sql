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
