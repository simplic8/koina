import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isRobloxConfigured,
  listOrderedEntries,
} from "@/lib/roblox/open-cloud";

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

export async function POST(request: Request) {
  const auth = await authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isRobloxConfigured()) {
    return NextResponse.json(
      { error: "ROBLOX_OPEN_CLOUD_API_KEY is not set" },
      { status: 503 },
    );
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Service role key required for sync" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId");

  let query = service
    .from("games")
    .select("*")
    .not("roblox_universe_id", "is", null)
    .not("ordered_datastore_id", "is", null);

  if (gameId) query = query.eq("id", gameId);

  const { data: games, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!games?.length) {
    return NextResponse.json({
      synced: 0,
      message: "No games with Roblox universe + Ordered DataStore configured",
    });
  }

  const results: Array<{ gameId: string; upserted: number; error?: string }> =
    [];

  for (const game of games) {
    try {
      const page = await listOrderedEntries({
        universeId: game.roblox_universe_id!,
        dataStoreId: game.ordered_datastore_id!,
      });

      const entries = page.orderedDataStoreEntries ?? [];
      const rows = entries.flatMap((entry) => {
        const key = entry.id ?? entry.path?.split("/").pop() ?? null;
        if (!key || typeof entry.value !== "number") return [];
        return [
          {
            game_id: game.id,
            roblox_entry_key: key,
            display_name: key,
            score: Math.round(entry.value),
            synced_at: new Date().toISOString(),
          },
        ];
      });

      if (!rows.length) {
        results.push({ gameId: game.id, upserted: 0 });
        continue;
      }

      const { error: upsertError } = await service
        .from("scores")
        .upsert(rows, { onConflict: "game_id,roblox_entry_key" });

      if (upsertError) {
        results.push({
          gameId: game.id,
          upserted: 0,
          error: upsertError.message,
        });
      } else {
        results.push({ gameId: game.id, upserted: rows.length });
      }
    } catch (err) {
      results.push({
        gameId: game.id,
        upserted: 0,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  return NextResponse.json({
    synced: results.reduce((n, r) => n + r.upserted, 0),
    results,
  });
}
