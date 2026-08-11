update public.games
set
  slug = 'tower-to-eternity',
  title = 'Tower to Eternity',
  description = 'Find the way to reach the Eternity Tower in this speedrun challenge.',
  roblox_place_id = '74440430260118'
where id = '11111111-1111-1111-1111-111111111101';

update public.games
set
  slug = 'warrior-of-light',
  title = 'Warrior Of Light',
  description = 'Forge legendary gear, unlock hidden power, and defend Yesu''s village from shadow creatures.',
  roblox_place_id = '76414853406395'
where id = '11111111-1111-1111-1111-111111111102';

update public.games
set
  slug = 'run-to-the-gate',
  title = 'Run to the Gate',
  description = 'Follow the path past seven signs and come face to face with the Guy at the Gates.',
  roblox_place_id = '73387522939923'
where id = '11111111-1111-1111-1111-111111111103';

update public.sessions
set title = 'Run to the Gate Co-op Night'
where id = '22222222-2222-2222-2222-222222222203';
