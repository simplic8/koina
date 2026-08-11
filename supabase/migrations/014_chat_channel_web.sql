-- Point existing chat rows at the #web mirror channel.
update public.chat_messages
set channel = 'web'
where channel = 'jam-lounge';

alter table public.chat_messages
  alter column channel set default 'web';
