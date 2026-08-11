-- Friend requests (pending → accepted) + DMs + inbox notifications.
-- Replaces the one-way friendships table from 029.

drop policy if exists "friendships_select_own" on public.friendships;
drop policy if exists "friendships_insert_own" on public.friendships;
drop policy if exists "friendships_delete_own" on public.friendships;
drop table if exists public.friendships cascade;

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

-- One relationship per unordered pair
create unique index friendships_unique_pair_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);
create index friendships_status_idx on public.friendships (status);

alter table public.friendships enable row level security;

create policy "friendships_select_participants"
  on public.friendships for select
  using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
    or public.is_admin()
  );

create policy "friendships_insert_requester"
  on public.friendships for insert
  with check (auth.uid() = requester_id and requester_id <> addressee_id);

create policy "friendships_update_participants"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_delete_participants"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Direct messages (friends only — enforced in API)
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null
    check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint direct_messages_no_self check (sender_id <> recipient_id)
);

create index direct_messages_pair_created_idx
  on public.direct_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

create index direct_messages_recipient_unread_idx
  on public.direct_messages (recipient_id, created_at desc)
  where read_at is null;

alter table public.direct_messages enable row level security;

create policy "direct_messages_select_participants"
  on public.direct_messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = recipient_id
    or public.is_admin()
  );

create policy "direct_messages_insert_sender"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

create policy "direct_messages_update_recipient"
  on public.direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Inbox notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null
    check (type in ('friend_request', 'friend_accepted', 'message')),
  friendship_id uuid references public.friendships (id) on delete cascade,
  message_id uuid references public.direct_messages (id) on delete cascade,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin());

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts happen via service role from the API (or allow authenticated insert for own outbound mirrors — use service).
create policy "notifications_insert_service_or_self"
  on public.notifications for insert
  with check (auth.uid() = user_id or public.is_admin());
