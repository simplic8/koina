-- Discord Nitro avatar decorations (profile stickers around the PFP).
alter table public.chat_messages
  add column if not exists author_avatar_decoration_url text;
