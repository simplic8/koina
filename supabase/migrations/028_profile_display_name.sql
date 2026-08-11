-- Optional friendly name shown in the UI; username stays the unique handle (no spaces).

alter table public.profiles
  add column if not exists display_name text;

comment on column public.profiles.display_name is
  'Optional display name (spaces allowed). Username remains the handle without spaces.';
