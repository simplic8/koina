import { NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { requireUser } from "@/lib/auth/require-user";
import { loadForumTallies } from "@/lib/forum/tallies";
import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const { tallies, meta } = await loadForumTallies(service, id);
  return NextResponse.json({ tallies, meta });
}

export async function POST(request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  let body: {
    activityKey?: string;
    optionKey?: string;
    participantKey?: string;
    delta?: number;
    label?: string;
    payload?: Record<string, unknown>;
    reset?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const activityKey = body.activityKey?.trim() ?? "";
  if (!activityKey || activityKey.length > 120) {
    return NextResponse.json(
      { error: "activityKey is required." },
      { status: 400 },
    );
  }

  // Reset is admin-only
  if (body.reset) {
    const auth = await requireUser();
    if ("error" in auth || !isAdminProfile(auth.profile)) {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }
    await service
      .from("forum_responses")
      .delete()
      .eq("session_id", id)
      .eq("activity_key", activityKey);
    const { tallies, meta } = await loadForumTallies(service, id);
    return NextResponse.json({ ok: true, tallies, meta });
  }

  const optionKey = body.optionKey?.trim() ?? "";
  const participantKey = body.participantKey?.trim() ?? "";
  if (!optionKey || optionKey.length > 160) {
    return NextResponse.json(
      { error: "optionKey is required." },
      { status: 400 },
    );
  }
  if (!participantKey || participantKey.length > 80) {
    return NextResponse.json(
      { error: "participantKey is required." },
      { status: 400 },
    );
  }

  const delta = body.delta === -1 ? -1 : 1;
  const userClient = await createClient();
  const {
    data: { user },
  } = (await userClient?.auth.getUser()) ?? { data: { user: null } };

  const { data: existing } = await service
    .from("forum_responses")
    .select("id, payload")
    .eq("session_id", id)
    .eq("activity_key", activityKey)
    .eq("option_key", optionKey)
    .eq("participant_key", participantKey)
    .maybeSingle();

  const prevCount =
    typeof (existing?.payload as { count?: number } | null)?.count === "number"
      ? Number((existing?.payload as { count: number }).count)
      : existing
        ? 1
        : 0;
  const nextCount = Math.max(0, prevCount + delta);

  if (nextCount <= 0) {
    if (existing) {
      await service.from("forum_responses").delete().eq("id", existing.id);
    }
  } else if (existing) {
    await service
      .from("forum_responses")
      .update({
        payload: {
          ...(body.payload ?? {}),
          label: body.label ?? null,
          count: nextCount,
        },
        updated_at: new Date().toISOString(),
        user_id: user?.id ?? null,
      })
      .eq("id", existing.id);
  } else {
    await service.from("forum_responses").insert({
      session_id: id,
      activity_key: activityKey,
      option_key: optionKey,
      participant_key: participantKey,
      user_id: user?.id ?? null,
      payload: {
        ...(body.payload ?? {}),
        label: body.label ?? null,
        count: nextCount,
      },
    });
  }

  const { tallies, meta } = await loadForumTallies(service, id);
  return NextResponse.json({ ok: true, tallies, meta });
}
