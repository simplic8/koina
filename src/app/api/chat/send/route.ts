import { NextResponse } from "next/server";
import { SITE_CHAT_CHANNEL } from "@/lib/chat-channel";
import { discordProfileBadges } from "@/lib/discord/badges";
import {
  discordAvatarDecorationUrl,
  discordUserAvatarUrl,
  fetchDiscordUser,
  isDiscordConfigured,
  postDiscordChatMessage,
} from "@/lib/discord/rest";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function discordIdFromUser(user: {
  identities?: { provider: string; id: string }[] | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const fromIdentity = user.identities?.find((i) => i.provider === "discord")
    ?.id;
  if (fromIdentity) return fromIdentity;
  const meta = user.user_metadata ?? {};
  const providerId = meta.provider_id;
  const sub = meta.sub;
  if (typeof providerId === "string" && /^\d+$/.test(providerId)) {
    return providerId;
  }
  if (typeof sub === "string" && /^\d+$/.test(sub)) {
    return sub;
  }
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to chat" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    return NextResponse.json(
      { error: "Your account cannot send messages" },
      { status: 403 },
    );
  }

  const { body } = (await request.json()) as { body?: string };
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const author = profile.username ?? "Player";
  const discordUserId =
    profile.discord_id?.trim() || discordIdFromUser(user) || null;
  let discordMessageId: string | null = null;
  let authorAvatarUrl: string | null = profile.avatar_url ?? null;
  let authorAvatarDecorationUrl: string | null = null;
  let authorBadges: ReturnType<typeof discordProfileBadges> = [];

  if (discordUserId && isDiscordConfigured()) {
    try {
      const discordUser = await fetchDiscordUser(discordUserId);
      authorAvatarUrl = discordUserAvatarUrl(discordUser);
      authorAvatarDecorationUrl = discordAvatarDecorationUrl(
        discordUser.avatar_decoration_data,
      );
      authorBadges = discordProfileBadges(discordUser);
    } catch {
      // Keep site avatar for the web transcript if Discord lookup fails.
    }
  }

  let discordWarning: string | null = null;
  if (isDiscordConfigured()) {
    try {
      const posted = await postDiscordChatMessage(body.trim(), {
        discordUserId,
        displayName: author,
        // Only used when there is no Discord identity — never override Discord PFP.
        avatarUrl: discordUserId ? null : profile.avatar_url,
      });
      discordMessageId = posted.id;
    } catch (err) {
      console.error(err);
      discordWarning =
        err instanceof Error
          ? err.message
          : "Could not post this message to Discord";
      // Still store locally if Discord fails
    }
  }

  const service = createServiceClient() ?? supabase;
  const { data: message, error } = await service
    .from("chat_messages")
    .insert({
      channel: SITE_CHAT_CHANNEL,
      author,
      author_discord_id: discordUserId,
      author_avatar_url: authorAvatarUrl,
      author_avatar_decoration_url: authorAvatarDecorationUrl,
      author_badges: authorBadges,
      body: body.trim(),
      discord_message_id: discordMessageId,
      source: "web",
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message,
    ...(discordWarning ? { discordWarning } : {}),
  });
}
