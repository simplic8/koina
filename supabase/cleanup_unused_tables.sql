-- Drop JustVibing leftover tables not used by the KOINA hub.
-- Run this on an existing project that already applied the full JV schema.
-- Safe to re-run (IF EXISTS).

-- Session / game RPCs first
drop function if exists public.list_sessions cascade;
drop function if exists public.join_session cascade;
drop function if exists public.leave_session cascade;

drop table if exists public.session_rsvps cascade;
drop table if exists public.sessions cascade;
drop table if exists public.session_title_suggestions cascade;
drop table if exists public.scores cascade;
drop table if exists public.game_translations cascade;
drop table if exists public.game_profiles cascade;
drop table if exists public.games cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.holodori_hero_lines cascade;

-- Optional: remove chat-only settings keys
delete from public.site_settings
where key in ('chat_refresh_interval_seconds', 'chat_last_discord_sync_at');
