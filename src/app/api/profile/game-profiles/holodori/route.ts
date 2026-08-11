import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { filterValidOshiIds } from "@/lib/hololive/holomems";
import type { GameProfile } from "@/lib/types";

function emptyHolodori(userId: string): GameProfile {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    platform: "holodori",
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
    .eq("platform", "holodori")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profile = data
    ? {
        ...(data as GameProfile),
        oshi_ids: Array.isArray(data.oshi_ids) ? data.oshi_ids : [],
      }
    : emptyHolodori(auth.user.id);

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    holodoriGameId?: string | null;
    oshiIds?: string[];
  };

  const holodoriGameId =
    typeof body.holodoriGameId === "string"
      ? body.holodoriGameId.trim().slice(0, 64) || null
      : body.holodoriGameId === null
        ? null
        : undefined;

  if (holodoriGameId === undefined && body.oshiIds === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  if (
    holodoriGameId &&
    !/^[a-zA-Z0-9_\-.]{1,64}$/.test(holodoriGameId)
  ) {
    return NextResponse.json(
      { error: "Game ID can use letters, numbers, _ - . (max 64)." },
      { status: 400 },
    );
  }

  const oshiIds =
    body.oshiIds === undefined
      ? undefined
      : filterValidOshiIds(
          Array.isArray(body.oshiIds)
            ? body.oshiIds.filter((id): id is string => typeof id === "string")
            : [],
        );

  const payload: Record<string, unknown> = {
    user_id: auth.user.id,
    platform: "holodori",
    updated_at: new Date().toISOString(),
  };
  if (holodoriGameId !== undefined) payload.holodori_game_id = holodoriGameId;
  if (oshiIds !== undefined) payload.oshi_ids = oshiIds;

  const { data, error } = await auth.supabase
    .from("game_profiles")
    .upsert(payload, { onConflict: "user_id,platform" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: {
      ...(data as GameProfile),
      oshi_ids: Array.isArray(data.oshi_ids) ? data.oshi_ids : [],
    },
  });
}
