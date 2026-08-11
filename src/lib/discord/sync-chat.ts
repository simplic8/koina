import { SITE_CHAT_CHANNEL } from "@/lib/chat-channel";
import { discordProfileBadges } from "@/lib/discord/badges";
import {
  discordMessageAvatarUrl,
  discordMessageDecorationUrl,
  fetchDiscordChannelMessages,
  isDiscordConfigured,
  probeDiscordChatAccess,
} from "@/lib/discord/rest";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncDiscordChatToSupabase(
  supabase: SupabaseClient,
  options?: { limit?: number },
) {
  if (!isDiscordConfigured()) {
    return { error: "Discord is not configured" as const };
  }

  const probe = await probeDiscordChatAccess();
  if (!probe.ok) {
    return {
      error: probe.error,
      code: probe.code,
      hint: probe.hint,
    };
  }

  const messages = await fetchDiscordChannelMessages(options?.limit ?? 50);
  let upserted = 0;
  let skipped = 0;

  // Oldest first so realtime order feels natural if inserts stream in.
  const chronological = [...messages].reverse();

  for (const message of chronological) {
    if (message.author.bot || message.webhook_id) {
      skipped += 1;
      continue;
    }
    const body = message.content?.trim();
    if (!body) {
      skipped += 1;
      continue;
    }

    const author =
      message.member?.nick?.trim() ||
      message.author.global_name?.trim() ||
      message.author.username;

    const { error } = await supabase.from("chat_messages").upsert(
      {
        channel: SITE_CHAT_CHANNEL,
        author,
        author_discord_id: message.author.id,
        author_avatar_url: discordMessageAvatarUrl(message),
        author_avatar_decoration_url: discordMessageDecorationUrl(message),
        author_badges: discordProfileBadges(message.author),
        body,
        discord_message_id: message.id,
        source: "discord",
        user_id: null,
        created_at: message.timestamp,
      },
      { onConflict: "discord_message_id" },
    );

    if (error) {
      return {
        error: error.message,
        upserted,
        skipped,
      };
    }
    upserted += 1;
  }

  return {
    ok: true as const,
    upserted,
    skipped,
    fetched: messages.length,
    channel: probe.channelName,
  };
}
