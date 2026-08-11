import { NextResponse } from "next/server";
import { SITE_CHAT_CHANNEL, CHAT_VISIBLE_MESSAGE_LIMIT } from "@/lib/chat-channel";
import { isDiscordConfigured } from "@/lib/discord/rest";
import { syncDiscordChatToSupabase } from "@/lib/discord/sync-chat";
import {
  CHAT_LAST_DISCORD_SYNC_KEY,
  CHAT_REFRESH_INTERVAL_KEY,
  clampChatRefreshInterval,
  DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
} from "@/lib/site-settings-constants";
import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

async function readRefreshInterval(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", CHAT_REFRESH_INTERVAL_KEY)
    .maybeSingle();
  return clampChatRefreshInterval(
    data?.value ?? DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
  );
}

async function maybeSyncDiscord(intervalSeconds: number) {
  if (!isDiscordConfigured()) return { synced: false as const };
  const service = createServiceClient();
  if (!service) return { synced: false as const };

  const { data } = await service
    .from("site_settings")
    .select("value")
    .eq("key", CHAT_LAST_DISCORD_SYNC_KEY)
    .maybeSingle();

  const lastMs = data?.value ? Date.parse(data.value) : 0;
  const due =
    !Number.isFinite(lastMs) ||
    Date.now() - lastMs >= intervalSeconds * 1000;

  if (!due) return { synced: false as const, skipped: true as const };

  await service.from("site_settings").upsert(
    {
      key: CHAT_LAST_DISCORD_SYNC_KEY,
      value: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  const result = await syncDiscordChatToSupabase(service, { limit: 40 });
  return { synced: true as const, result };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      messages: [],
      refreshIntervalSeconds: DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
    });
  }

  const supabase = (await createClient()) ?? createServiceClient();
  if (!supabase) {
    return NextResponse.json({
      messages: [],
      refreshIntervalSeconds: DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
    });
  }

  const refreshIntervalSeconds = await readRefreshInterval(supabase);

  try {
    await maybeSyncDiscord(refreshIntervalSeconds);
  } catch {
    // Still return DB messages if Discord sync fails.
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel", SITE_CHAT_CHANNEL)
    .order("created_at", { ascending: false })
    .limit(CHAT_VISIBLE_MESSAGE_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages = [...(data ?? [])].reverse();

  return NextResponse.json({
    messages,
    refreshIntervalSeconds,
  });
}
