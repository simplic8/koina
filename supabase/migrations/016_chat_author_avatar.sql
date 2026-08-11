-- Per-message author avatar (Discord CDN or site profile URL).
alter table public.chat_messages
  add column if not exists author_avatar_url text;
