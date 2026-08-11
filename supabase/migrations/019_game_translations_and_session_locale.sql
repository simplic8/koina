-- Curated game copy translations + locale tag on user sessions

create table if not exists public.game_translations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  locale text not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_translations_locale_check check (
    locale in ('en', 'ja', 'ko', 'fil', 'ms', 'id', 'zh-CN', 'zh-TW')
  ),
  constraint game_translations_game_locale_unique unique (game_id, locale)
);

create index if not exists game_translations_game_id_idx
  on public.game_translations (game_id);

create index if not exists game_translations_locale_idx
  on public.game_translations (locale);

alter table public.game_translations enable row level security;

drop policy if exists "Game translations are public"
  on public.game_translations;
create policy "Game translations are public"
  on public.game_translations for select
  using (true);

drop policy if exists "Admins manage game translations"
  on public.game_translations;
create policy "Admins manage game translations"
  on public.game_translations for all
  using (public.is_admin())
  with check (public.is_admin());

-- Session locale (author language tag; source of truth stays original title)
alter table public.sessions
  add column if not exists locale text;

update public.sessions
set locale = 'en'
where locale is null;

alter table public.sessions
  alter column locale set default 'en';

alter table public.sessions
  alter column locale set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sessions_locale_check'
  ) then
    alter table public.sessions
      add constraint sessions_locale_check check (
        locale in ('en', 'ja', 'ko', 'fil', 'ms', 'id', 'zh-CN', 'zh-TW')
      );
  end if;
end $$;

create index if not exists sessions_locale_idx on public.sessions (locale);

-- Seed curated translations (English row mirrors base games for completeness)
insert into public.game_translations (game_id, locale, title, description)
select g.id, v.locale, v.title, v.description
from public.games g
join (
  values
    -- tower-to-eternity
    ('tower-to-eternity', 'en', 'Tower to Eternity',
     'Find the way to reach the Eternity Tower in this speedrun challenge.'),
    ('tower-to-eternity', 'ja', 'Tower to Eternity',
     'スピードランでエターニティタワーへたどり着く道を見つけよう。'),
    ('tower-to-eternity', 'ko', 'Tower to Eternity',
     '스피드런으로 이터니티 타워에 도달하는 길을 찾으세요.'),
    ('tower-to-eternity', 'fil', 'Tower to Eternity',
     'Hanapin ang daan patungo sa Eternity Tower sa speedrun challenge na ito.'),
    ('tower-to-eternity', 'ms', 'Tower to Eternity',
     'Cari jalan ke Menara Eternity dalam cabaran speedrun ini.'),
    ('tower-to-eternity', 'id', 'Tower to Eternity',
     'Temukan jalan ke Menara Eternity dalam tantangan speedrun ini.'),
    ('tower-to-eternity', 'zh-CN', 'Tower to Eternity',
     '在这场竞速挑战中，找到通往永恒之塔的路。'),
    ('tower-to-eternity', 'zh-TW', 'Tower to Eternity',
     '在這場競速挑戰中，找到通往永恆之塔的路。'),

    -- warrior-of-light
    ('warrior-of-light', 'en', 'Warrior Of Light',
     'Forge legendary gear, unlock hidden power, and defend Yesu''s village from shadow creatures.'),
    ('warrior-of-light', 'ja', 'Warrior Of Light',
     '伝説の装備を鍛え、隠された力を解き放ち、イェスの村を影の生き物から守れ。'),
    ('warrior-of-light', 'ko', 'Warrior Of Light',
     '전설의 장비를 만들고 숨겨진 힘을 해금해 Yesu의 마을을 그림자 생물로부터 지키세요.'),
    ('warrior-of-light', 'fil', 'Warrior Of Light',
     'Gumawa ng legendary gear, i-unlock ang hidden power, at ipagtanggol ang nayon ni Yesu mula sa shadow creatures.'),
    ('warrior-of-light', 'ms', 'Warrior Of Light',
     'Tempa gear legenda, buka kuasa tersembunyi, dan pertahankan kampung Yesu daripada makhluk bayang.'),
    ('warrior-of-light', 'id', 'Warrior Of Light',
     'Tempa perlengkapan legendaris, buka kekuatan tersembunyi, dan bela desa Yesu dari makhluk bayangan.'),
    ('warrior-of-light', 'zh-CN', 'Warrior Of Light',
     '打造传说装备、解锁隐藏力量，保卫 Yesu 的村庄免受暗影生物侵袭。'),
    ('warrior-of-light', 'zh-TW', 'Warrior Of Light',
     '打造傳說裝備、解鎖隱藏力量，保衛 Yesu 的村莊免受暗影生物侵襲。'),

    -- run-to-the-gate
    ('run-to-the-gate', 'en', 'Run to the Gate',
     'Follow the path past seven signs and come face to face with the Guy at the Gates.'),
    ('run-to-the-gate', 'ja', 'Run to the Gate',
     '七つの標識を越えて進み、ゲートの男と対峙しよう。'),
    ('run-to-the-gate', 'ko', 'Run to the Gate',
     '일곱 표지를 지나 길을 따라가 게이트의 가이와 마주하세요.'),
    ('run-to-the-gate', 'fil', 'Run to the Gate',
     'Sundan ang landas lampas sa pitong palatandaan at harapin ang Guy at the Gates.'),
    ('run-to-the-gate', 'ms', 'Run to the Gate',
     'Ikuti laluan melepasi tujuh tanda dan berhadapan dengan Guy at the Gates.'),
    ('run-to-the-gate', 'id', 'Run to the Gate',
     'Ikuti jalur melewati tujuh tanda dan berhadapan dengan Guy at the Gates.'),
    ('run-to-the-gate', 'zh-CN', 'Run to the Gate',
     '沿着小路越过七个路标，直面守门人。'),
    ('run-to-the-gate', 'zh-TW', 'Run to the Gate',
     '沿著小路越過七個路標，直面守門人。'),

    -- holodori
    ('holodori', 'en', 'Holodori',
     'Hololive Dreams — free-to-play rhythm & RPG. Clear songs, train holomems, and expand the Dream Park together.'),
    ('holodori', 'ja', 'ホロドリ',
     'ホロライブドリームス — 無料のリズム＆RPG。楽曲をクリアし、ホロメンを育て、ドリームパークを広げよう。'),
    ('holodori', 'ko', 'Holodori',
     '홀로라이브 드림스 — 무료 리듬 & RPG. 곡을 클리어하고 홀로멤을 키우며 드림 파크를 확장하세요.'),
    ('holodori', 'fil', 'Holodori',
     'Hololive Dreams — free-to-play rhythm & RPG. I-clear ang songs, i-train ang holomems, at palawakin ang Dream Park.'),
    ('holodori', 'ms', 'Holodori',
     'Hololive Dreams — rhythm & RPG percuma. Lengkapkan lagu, latih holomem, dan kembangkan Dream Park bersama.'),
    ('holodori', 'id', 'Holodori',
     'Hololive Dreams — rhythm & RPG gratis. Selesaikan lagu, latih holomem, dan kembangkan Dream Park bersama.'),
    ('holodori', 'zh-CN', 'Holodori',
     'Hololive Dreams — 免费节奏 & RPG。通关曲目、培养 holomem，一起扩建梦想乐园。'),
    ('holodori', 'zh-TW', 'Holodori',
     'Hololive Dreams — 免費節奏 & RPG。通關曲目、培養 holomem，一起擴建夢想樂園。')
) as v(slug, locale, title, description)
  on g.slug = v.slug
on conflict (game_id, locale) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

-- Refresh list_sessions to expose locale
drop function if exists public.list_sessions(
  text, text, text, text, int, int, boolean
);

create or replace function public.list_sessions(
  p_search text default null,
  p_search_by text default 'all',
  p_sort text default 'date',
  p_dir text default 'asc',
  p_page int default 1,
  p_page_size int default 12,
  p_upcoming_only boolean default true
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
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int;
  v_order text;
begin
  if v_search_by not in ('all', 'title', 'creator') then
    v_search_by := 'all';
  end if;
  if v_sort not in ('title', 'date', 'registered') then
    v_sort := 'date';
  end if;
  if v_dir not in ('asc', 'desc') then
    v_dir := 'asc';
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
          and ($1 is false or s.starts_at >= now())
          and (
            $2::text is null
            or (
              case $3
                when 'title' then s.title ilike '%%' || $2 || '%%'
                when 'creator' then coalesce(p.username, '') ilike '%%' || $2 || '%%'
                else (
                  s.title ilike '%%' || $2 || '%%'
                  or coalesce(p.username, '') ilike '%%' || $2 || '%%'
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
      limit $4 offset $5
    $q$,
    v_order
  )
  using p_upcoming_only, v_search, v_search_by, v_page_size, v_offset;
end;
$$;

grant execute on function public.list_sessions(
  text, text, text, text, int, int, boolean
) to anon, authenticated;
