import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import type { GameProfile } from "@/lib/types";

function emptyRoblox(userId: string): GameProfile {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    platform: "roblox",
    holodori_game_id: null,
    oshi_ids: [],
    roblox_username: null,
    roblox_display_name: null,
    roblox_user_id: null,
    roblox_avatar_url: null,
    roblox_bio: null,
    roblox_online_status: null,
    roblox_synced_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.supabase
    .from("game_profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("platform", "roblox")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: data ? (data as GameProfile) : emptyRoblox(auth.user.id),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string | null;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    onlineStatus?: string | null;
    robloxUserId?: string | null;
    syncedAt?: string | null;
  };

  const username =
    typeof body.username === "string"
      ? body.username.trim().slice(0, 64) || null
      : body.username === null
        ? null
        : undefined;
  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim().slice(0, 64) || null
      : body.displayName === null
        ? null
        : undefined;
  const bio =
    typeof body.bio === "string"
      ? body.bio.trim().slice(0, 1000) || null
      : body.bio === null
        ? null
        : undefined;
  const avatarUrl =
    typeof body.avatarUrl === "string"
      ? body.avatarUrl.trim().slice(0, 500) || null
      : body.avatarUrl === null
        ? null
        : undefined;
  const onlineStatus =
    typeof body.onlineStatus === "string"
      ? body.onlineStatus.trim().slice(0, 64) || null
      : body.onlineStatus === null
        ? null
        : undefined;
  const robloxUserId =
    typeof body.robloxUserId === "string"
      ? body.robloxUserId.trim().slice(0, 32) || null
      : body.robloxUserId === null
        ? null
        : undefined;
  const syncedAt =
    typeof body.syncedAt === "string" ? body.syncedAt : body.syncedAt === null ? null : undefined;

  if (
    username === undefined &&
    displayName === undefined &&
    bio === undefined &&
    avatarUrl === undefined &&
    onlineStatus === undefined &&
    robloxUserId === undefined
  ) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: "Roblox username must be 3–20 letters, numbers, or _." },
      { status: 400 },
    );
  }

  const payload: Record<string, unknown> = {
    user_id: auth.user.id,
    platform: "roblox",
    updated_at: new Date().toISOString(),
  };
  if (username !== undefined) payload.roblox_username = username;
  if (displayName !== undefined) payload.roblox_display_name = displayName;
  if (bio !== undefined) payload.roblox_bio = bio;
  if (avatarUrl !== undefined) payload.roblox_avatar_url = avatarUrl;
  if (onlineStatus !== undefined) payload.roblox_online_status = onlineStatus;
  if (robloxUserId !== undefined) payload.roblox_user_id = robloxUserId;
  if (syncedAt !== undefined) payload.roblox_synced_at = syncedAt;

  const { data, error } = await auth.supabase
    .from("game_profiles")
    .upsert(payload, { onConflict: "user_id,platform" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (robloxUserId !== undefined) {
    await auth.supabase
      .from("profiles")
      .update({ roblox_user_id: robloxUserId })
      .eq("id", auth.user.id);
  }

  return NextResponse.json({ profile: data as GameProfile });
}
