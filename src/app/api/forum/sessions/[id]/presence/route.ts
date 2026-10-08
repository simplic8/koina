import { NextResponse } from "next/server";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { params: Promise<{ id: string }> };

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/** Viewers count as connected if seen within this window. */
const ACTIVE_MS = 30_000;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

async function countActive(
  service: NonNullable<ReturnType<typeof createServiceClient>>,
  sessionId: string,
) {
  const since = new Date(Date.now() - ACTIVE_MS).toISOString();
  const { data, error } = await service
    .from("forum_presence")
    .select("participant_key, role")
    .eq("session_id", sessionId)
    .gte("last_seen", since);

  if (error) {
    // Table not migrated yet — treat as empty rather than failing the room
    if (error.code === "42P01" || /forum_presence/i.test(error.message)) {
      return { viewers: 0, presenters: 0, unavailable: true as const };
    }
    throw new Error(error.message);
  }

  const viewers = new Set<string>();
  const presenters = new Set<string>();
  for (const row of data ?? []) {
    if (row.role === "view") viewers.add(row.participant_key);
    else if (row.role === "present") presenters.add(row.participant_key);
  }
  return { viewers: viewers.size, presenters: presenters.size };
}

/** Current connected counts. */
export async function GET(_request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return json({ error: "Supabase is not configured." }, 503);
  }
  const service = createServiceClient();
  if (!service) return json({ error: "Supabase is not configured." }, 503);

  const { id } = await params;
  try {
    const counts = await countActive(service, id);
    return json(counts);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Could not load presence." },
      500,
    );
  }
}

/** Heartbeat from a connected client. */
export async function POST(request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return json({ error: "Supabase is not configured." }, 503);
  }
  const service = createServiceClient();
  if (!service) return json({ error: "Supabase is not configured." }, 503);

  const { id } = await params;
  let body: { participantKey?: string; role?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const participantKey =
    typeof body.participantKey === "string"
      ? body.participantKey.trim().slice(0, 120)
      : "";
  const role = body.role === "present" ? "present" : "view";
  if (!participantKey) {
    return json({ error: "participantKey is required." }, 400);
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await service.from("forum_presence").upsert(
    {
      session_id: id,
      participant_key: participantKey,
      role,
      last_seen: now,
    },
    { onConflict: "session_id,participant_key" },
  );

  if (upsertError) {
    if (
      upsertError.code === "42P01" ||
      /forum_presence/i.test(upsertError.message)
    ) {
      return json({ ok: true, viewers: 0, presenters: 0, unavailable: true });
    }
    return json({ error: upsertError.message }, 500);
  }

  // Opportunistic cleanup of stale rows for this session
  const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
  void service
    .from("forum_presence")
    .delete()
    .eq("session_id", id)
    .lt("last_seen", staleBefore);

  try {
    const counts = await countActive(service, id);
    return json({ ok: true, ...counts });
  } catch (err) {
    return json({
      ok: true,
      viewers: 0,
      presenters: 0,
      error: err instanceof Error ? err.message : "Count failed.",
    });
  }
}
