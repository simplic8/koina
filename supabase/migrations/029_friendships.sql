-- One-way friendships: user_id added friend_id to their friends list.

create table if not exists public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint friendships_no_self check (user_id <> friend_id)
);

create index if not exists friendships_friend_id_idx
  on public.friendships (friend_id);

create index if not exists friendships_user_created_idx
  on public.friendships (user_id, created_at desc);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
  on public.friendships for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
  on public.friendships for insert
  with check (auth.uid() = user_id and user_id <> friend_id);

drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own"
  on public.friendships for delete
  using (auth.uid() = user_id);
