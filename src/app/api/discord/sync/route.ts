import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  discordBotInviteUrl,
  isDiscordConfigured,
  probeDiscordChatAccess,
} from "@/lib/discord/rest";
import { syncDiscordChatToSupabase } from "@/lib/discord/sync-chat";
import { createServiceClient } from "@/lib/supabase/server";

async function authorize(request: Request) {
  const cron = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && cron === `Bearer ${secret}`) {
    return { ok: true as const, via: "cron" as const };
  }

  const admin = await requireAdmin();
  if ("error" in admin) {
    return { ok: false as const, error: admin.error, status: admin.status };
  }
  return { ok: true as const, via: "admin" as const };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("probe") === "1") {
    const auth = await authorize(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!isDiscordConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          error:
            "Set DISCORD_BOT_TOKEN and DISCORD_CHAT_CHANNEL_ID on this host (Vercel env for production).",
        },
        { status: 503 },
      );
    }
    const probe = await probeDiscordChatAccess();
    const inviteUrl =
      probe.ok && "botId" in probe
        ? discordBotInviteUrl(probe.botId)
        : undefined;
    return NextResponse.json({ ...probe, inviteUrl, via: auth.via });
  }

  return POST(request);
}

export async function POST(request: Request) {
  const auth = await authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isDiscordConfigured()) {
    return NextResponse.json(
      {
        error:
          "Set DISCORD_BOT_TOKEN and DISCORD_CHAT_CHANNEL_ID (your #web channel ID) on Vercel.",
      },
      { status: 503 },
    );
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Service role key required for Discord sync" },
      { status: 503 },
    );
  }

  try {
    const result = await syncDiscordChatToSupabase(service);
    if ("error" in result && result.error) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json({ ...result, via: auth.via });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Discord sync failed",
      },
      { status: 500 },
    );
  }
}
