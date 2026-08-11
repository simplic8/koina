import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { listRecentlyPlayedWith } from "@/lib/friends";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const game = new URL(request.url).searchParams.get("game")?.trim() || null;
  const gameSlug = game === "holodori" ? "holodori" : undefined;

  try {
    const people = await listRecentlyPlayedWith(
      auth.supabase,
      auth.user.id,
      10,
      gameSlug ? { gameSlug } : undefined,
    );
    return NextResponse.json({ people });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not load played-with list.",
      },
      { status: 500 },
    );
  }
}
