-- Keep friend-request notifications after accept/decline, with resolved types.
-- Declining used to delete the friendship and cascade-delete the notification.

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'friend_request',
    'friend_request_accepted',
    'friend_request_declined',
    'friend_accepted',
    'message'
  ));

alter table public.notifications
  drop constraint if exists notifications_friendship_id_fkey;

alter table public.notifications
  add constraint notifications_friendship_id_fkey
  foreign key (friendship_id)
  references public.friendships (id)
  on delete set null;
