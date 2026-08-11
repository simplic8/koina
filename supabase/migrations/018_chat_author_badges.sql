-- Discord profile badges (public_flags + optional clan/server tag).
alter table public.chat_messages
  add column if not exists author_badges jsonb not null default '[]'::jsonb;
