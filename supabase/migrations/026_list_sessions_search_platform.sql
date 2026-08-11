-- Include platform in list_sessions search / filter-by

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true,
  p_past_only boolean default false,
  p_game_slug text default null
)
returns table (
  id uuid,
  game_id uuid,
  creator_id uuid,
  title text,
  starts_at timestamptz,
  capacity int,
  registered_count int,
  created_at timestamptz,
  locale text,
  game_title text,
  game_slug text,
  game_platform text,
  creator_username text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_search_by text := lower(coalesce(nullif(trim(p_search_by), ''), 'all'));
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'date'));
  v_dir text := lower(coalesce(nullif(trim(p_dir), ''), 'asc'));
  v_game_slug text := nullif(trim(coalesce(p_game_slug, '')), '');
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
  v_time_clause text;
begin
  if v_search_by not in ('all', 'title', 'creator', 'game', 'platform') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
  end if;

  if coalesce(p_past_only, false) then
    v_time_clause := 's.starts_at < now()';
  elsif coalesce(p_upcoming_only, true) then
    v_time_clause := 's.starts_at >= now()';
  else
    v_time_clause := 'true';
  end if;

  v_offset := (v_page - 1) * v_page_size;
  v_order := case v_sort
    when 'title' then format('lower(f.title) %s, f.id asc', v_dir)
    when 'registered' then format('f.registered_count %s, f.id asc', v_dir)
    else format('f.starts_at %s, f.id asc', v_dir)
  end;

  return query execute format(
    $q$
      with filtered as (
        select
          s.id,
          s.game_id,
          s.creator_id,
          s.title,
          s.starts_at,
          s.capacity,
          s.registered_count,
          s.created_at,
          s.locale,
          g.title as game_title,
          g.slug as game_slug,
          g.platform as game_platform,
          p.username as creator_username
        from public.sessions s
        join public.games g on g.id = s.game_id
        left join public.profiles p on p.id = s.creator_id
        where (g.is_published = true or public.is_admin())
          and (%s)
          and ($5::text is null or g.slug = $5)
          and (
            $1::text is null
            or (
              case $2
                when 'title' then s.title ilike '%%' || $1 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $1 || '%%'
                when 'game' then (
                  g.title ilike '%%' || $1 || '%%'
                  or g.slug ilike '%%' || $1 || '%%'
                  or exists (
                    select 1
                    from public.game_translations gt
                    where gt.game_id = g.id
                      and gt.title ilike '%%' || $1 || '%%'
                  )
                )
                when 'platform' then coalesce(g.platform, '') ilike '%%' || $1 || '%%'
                else (
                  s.title ilike '%%' || $1 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $1 || '%%'
                  or g.title ilike '%%' || $1 || '%%'
                  or g.slug ilike '%%' || $1 || '%%'
                  or coalesce(g.platform, '') ilike '%%' || $1 || '%%'
                  or exists (
                    select 1
                    from public.game_translations gt
                    where gt.game_id = g.id
                      and gt.title ilike '%%' || $1 || '%%'
                  )
                )
              end
            )
          )
      ),
      counted as (
        select *, count(*) over() as total_count from filtered
      )
      select
        f.id,
        f.game_id,
        f.creator_id,
        f.title,
        f.starts_at,
        f.capacity,
        f.registered_count,
        f.created_at,
        f.locale,
        f.game_title,
        f.game_slug,
        f.game_platform,
        f.creator_username,
        f.total_count
      from counted f
      order by %s
      limit $3 offset $4
    $q$,
    v_time_clause,
    v_order
  )
  using v_search, v_search_by, v_page_size, v_offset, v_game_slug;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean, boolean, text
) to anon, authenticated;
