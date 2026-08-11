import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { lookupRobloxUserByUsername } from "@/lib/roblox/users";
import type { GameProfile } from "@/lib/types";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
  };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!username) {
    return NextResponse.json({ error: "Enter a Roblox username." }, { status: 400 });
  }

  try {
    const snapshot = await lookupRobloxUserByUsername(username);
    const syncedAt = new Date().toISOString();

    const { data, error } = await auth.supabase
      .from("game_profiles")
      .upsert(
        {
          user_id: auth.user.id,
          platform: "roblox",
          roblox_username: snapshot.username,
          roblox_display_name: snapshot.displayName,
          roblox_user_id: snapshot.userId,
          roblox_avatar_url: snapshot.avatarUrl,
          roblox_bio: snapshot.bio,
          roblox_online_status: snapshot.onlineStatus,
          roblox_synced_at: syncedAt,
          updated_at: syncedAt,
        },
        { onConflict: "user_id,platform" },
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await auth.supabase
      .from("profiles")
      .update({ roblox_user_id: snapshot.userId })
      .eq("id", auth.user.id);

    return NextResponse.json({
      profile: data as GameProfile,
      snapshot,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not pull Roblox profile.",
      },
      { status: 400 },
    );
  }
}
