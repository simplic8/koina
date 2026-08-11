-- Holodori (Hololive Dreams) as a schedulable non-Roblox game
insert into public.games (
  id, slug, title, platform, description,
  roblox_universe_id, roblox_place_id, ordered_datastore_id,
  is_vetted, is_published, is_featured, sort_order, published_at
) values (
  '11111111-1111-1111-1111-111111111104',
  'holodori',
  'Holodori',
  'external',
  'Hololive Dreams — free-to-play rhythm & RPG. Clear songs, train holomems, and expand the Dream Park together.',
  null,
  null,
  null,
  true,
  true,
  false,
  4,
  now()
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  platform = excluded.platform,
  description = excluded.description,
  roblox_universe_id = null,
  roblox_place_id = null,
  ordered_datastore_id = null,
  is_vetted = true,
  is_published = true,
  is_featured = false,
  sort_order = excluded.sort_order;

insert into public.session_title_suggestions (title, game_slug) values
  ('Dream Park Party', 'holodori'),
  ('Rhythm Rally', 'holodori'),
  ('Holomem Hangout', 'holodori'),
  ('Chart Clear Crew', 'holodori'),
  ('Park Expansion Night', 'holodori'),
  ('Song Clear Social', 'holodori')
on conflict (title) do update set
  game_slug = excluded.game_slug,
  is_active = true;
