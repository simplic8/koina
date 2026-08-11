-- Allow session creators (and admins) to delete their own sessions.
drop policy if exists "Creators delete own sessions" on public.sessions;
create policy "Creators delete own sessions"
  on public.sessions for delete
  to authenticated
  using (auth.uid() = creator_id or public.is_admin());
