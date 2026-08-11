import {
  CHAT_REFRESH_INTERVAL_KEY,
  clampChatRefreshInterval,
  DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
} from "@/lib/site-settings-constants";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export {
  CHAT_REFRESH_INTERVAL_KEY,
  CHAT_LAST_DISCORD_SYNC_KEY,
  DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
  MIN_CHAT_REFRESH_INTERVAL_SECONDS,
  MAX_CHAT_REFRESH_INTERVAL_SECONDS,
  clampChatRefreshInterval,
} from "@/lib/site-settings-constants";

export async function getChatRefreshIntervalSeconds() {
  try {
    const supabase = (await createClient()) ?? createServiceClient();
    if (!supabase) return DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS;

    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", CHAT_REFRESH_INTERVAL_KEY)
      .maybeSingle();

    return clampChatRefreshInterval(data?.value);
  } catch {
    return DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS;
  }
}

export async function getSiteSetting(key: string) {
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) return null;
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function setSiteSetting(key: string, value: string) {
  const supabase = createServiceClient();
  if (!supabase) {
    return { error: "Service role key required to save settings." };
  }
  const { error } = await supabase.from("site_settings").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) return { error: error.message };
  return { ok: true as const };
}
