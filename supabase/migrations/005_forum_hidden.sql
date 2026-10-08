-- Allow admins to hide forum sessions from the public /forum list

alter table public.forum_sessions
  add column if not exists is_hidden boolean not null default false;

create index if not exists forum_sessions_visible_created_at_idx
  on public.forum_sessions (created_at desc)
  where is_hidden = false;
