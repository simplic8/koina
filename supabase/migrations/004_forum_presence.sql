-- Live forum presence: who is currently connected to a session

create table if not exists public.forum_presence (
  session_id uuid not null references public.forum_sessions (id) on delete cascade,
  participant_key text not null,
  role text not null check (role in ('view', 'present')),
  last_seen timestamptz not null default now(),
  primary key (session_id, participant_key)
);

create index if not exists forum_presence_session_seen_idx
  on public.forum_presence (session_id, last_seen desc);

alter table public.forum_presence enable row level security;

drop policy if exists "Forum presence is publicly readable"
  on public.forum_presence;
create policy "Forum presence is publicly readable"
  on public.forum_presence for select
  using (true);

drop policy if exists "Anyone can upsert forum presence"
  on public.forum_presence;
create policy "Anyone can upsert forum presence"
  on public.forum_presence for insert
  with check (true);

drop policy if exists "Anyone can update forum presence"
  on public.forum_presence;
create policy "Anyone can update forum presence"
  on public.forum_presence for update
  using (true)
  with check (true);

drop policy if exists "Anyone can delete forum presence"
  on public.forum_presence;
create policy "Anyone can delete forum presence"
  on public.forum_presence for delete
  using (true);
