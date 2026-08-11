-- KOINA hero quotes from the brand deck
-- Shared spaces. Shared interests. Shared purpose.

update public.hero_quotes set is_active = false;

insert into public.hero_quotes (
  first_line, second_line, is_active, sort_order
) values
  ('Shared spaces. Shared interests.', 'Shared purpose.', true, 1),
  ('Belong. Explore.', 'Grow together.', true, 2),
  ('Presence before', 'proclamation.', true, 3),
  ('Fellowship through', 'shared participation.', true, 4)
on conflict (first_line, second_line) do update set
  is_active = true,
  sort_order = excluded.sort_order;
