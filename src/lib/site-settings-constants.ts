export const CHAT_REFRESH_INTERVAL_KEY = "chat_refresh_interval_seconds";
export const CHAT_LAST_DISCORD_SYNC_KEY = "chat_last_discord_sync_at";
export const DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS = 5;
export const MIN_CHAT_REFRESH_INTERVAL_SECONDS = 3;
export const MAX_CHAT_REFRESH_INTERVAL_SECONDS = 300;

export function clampChatRefreshInterval(raw: unknown) {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : Number.NaN;
  if (!Number.isFinite(n)) return DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS;
  return Math.min(
    MAX_CHAT_REFRESH_INTERVAL_SECONDS,
    Math.max(MIN_CHAT_REFRESH_INTERVAL_SECONDS, Math.round(n)),
  );
}
