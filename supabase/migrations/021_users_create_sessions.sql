-- Allow signed-in users to create sessions they host (service role still used by API).
drop policy if exists "Authenticated users create sessions" on public.sessions;
create policy "Authenticated users create sessions"
  on public.sessions for insert
  to authenticated
  with check (
    auth.uid() = creator_id
    and exists (
      select 1
      from public.games g
      where g.id = game_id
        and g.is_published = true
    )
  );

drop policy if exists "Creators update own sessions" on public.sessions;
create policy "Creators update own sessions"
  on public.sessions for update
  to authenticated
  using (auth.uid() = creator_id or public.is_admin())
  with check (auth.uid() = creator_id or public.is_admin());
