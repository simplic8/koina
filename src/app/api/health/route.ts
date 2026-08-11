import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "koina",
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    roblox: Boolean(process.env.ROBLOX_OPEN_CLOUD_API_KEY),
    discord: Boolean(
      process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHAT_CHANNEL_ID,
    ),
  });
}
