-- Keep registered_count in sync with session_rsvps via join/leave RPCs.

update public.sessions s
set registered_count = coalesce((
  select count(*)::int
  from public.session_rsvps r
  where r.session_id = s.id
), 0);

create or replace function public.join_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_capacity int;
  v_count int;
  v_starts timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select capacity, registered_count, starts_at
    into v_capacity, v_count, v_starts
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_starts <= now() then
    raise exception 'session_started';
  end if;

  if exists (
    select 1
    from public.session_rsvps
    where session_id = p_session_id
      and user_id = v_uid
  ) then
    return jsonb_build_object(
      'joined', true,
      'registered_count', v_count,
      'capacity', v_capacity
    );
  end if;

  if v_count >= v_capacity then
    raise exception 'session_full';
  end if;

  insert into public.session_rsvps (session_id, user_id)
  values (p_session_id, v_uid);

  update public.sessions
  set registered_count = registered_count + 1
  where id = p_session_id
  returning registered_count into v_count;

  return jsonb_build_object(
    'joined', true,
    'registered_count', v_count,
    'capacity', v_capacity
  );
end;
$$;

create or replace function public.leave_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_capacity int;
  v_count int;
  v_deleted int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select capacity, registered_count
    into v_capacity, v_count
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'session_not_found';
  end if;

  delete from public.session_rsvps
  where session_id = p_session_id
    and user_id = v_uid;

  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    update public.sessions
    set registered_count = greatest(registered_count - 1, 0)
    where id = p_session_id
    returning registered_count into v_count;
  end if;

  return jsonb_build_object(
    'joined', false,
    'registered_count', v_count,
    'capacity', v_capacity
  );
end;
$$;

revoke all on function public.join_session(uuid) from public;
revoke all on function public.leave_session(uuid) from public;
grant execute on function public.join_session(uuid) to authenticated;
grant execute on function public.leave_session(uuid) to authenticated;
