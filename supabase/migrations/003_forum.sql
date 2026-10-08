-- Live forum decks: presenter/viewer sync + activity responses

create table if not exists public.forum_sessions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  storage_path text not null,
  created_by uuid references public.profiles (id) on delete set null,
  is_live boolean not null default false,
  presenter_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_sessions_created_at_idx
  on public.forum_sessions (created_at desc);

create table if not exists public.forum_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.forum_sessions (id) on delete cascade,
  activity_key text not null,
  option_key text not null,
  participant_key text not null,
  payload jsonb not null default '{}'::jsonb,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_responses_unique_vote
    unique (session_id, activity_key, option_key, participant_key)
);

create index if not exists forum_responses_session_idx
  on public.forum_responses (session_id, activity_key);

alter table public.forum_sessions enable row level security;
alter table public.forum_responses enable row level security;

drop policy if exists "Forum sessions are publicly readable"
  on public.forum_sessions;
create policy "Forum sessions are publicly readable"
  on public.forum_sessions for select
  using (true);

drop policy if exists "Admins manage forum sessions"
  on public.forum_sessions;
create policy "Admins manage forum sessions"
  on public.forum_sessions for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
    )
  );

drop policy if exists "Forum responses are publicly readable"
  on public.forum_responses;
create policy "Forum responses are publicly readable"
  on public.forum_responses for select
  using (true);

drop policy if exists "Anyone can insert forum responses"
  on public.forum_responses;
create policy "Anyone can insert forum responses"
  on public.forum_responses for insert
  with check (true);

drop policy if exists "Participants update own forum responses"
  on public.forum_responses;
create policy "Participants update own forum responses"
  on public.forum_responses for update
  using (
    user_id = auth.uid()
    or user_id is null
  );

-- Storage bucket for uploaded decks (run in dashboard if storage API differs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'forum-decks',
  'forum-decks',
  false,
  10485760,
  array['text/html', 'application/xhtml+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload forum decks" on storage.objects;
create policy "Admins upload forum decks"
  on storage.objects for insert
  with check (
    bucket_id = 'forum-decks'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
    )
  );

drop policy if exists "Admins update forum decks" on storage.objects;
create policy "Admins update forum decks"
  on storage.objects for update
  using (
    bucket_id = 'forum-decks'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
    )
  );

drop policy if exists "Admins read forum decks" on storage.objects;
create policy "Admins read forum decks"
  on storage.objects for select
  using (
    bucket_id = 'forum-decks'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
    )
  );
