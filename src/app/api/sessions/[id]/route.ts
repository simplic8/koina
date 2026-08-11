import { NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { isAppEmailConfirmed } from "@/lib/auth/is-confirmed";
import { requireUser } from "@/lib/auth/require-user";
import { isLocaleCode } from "@/lib/i18n/locales";
import {
  loadSessionDetail,
  SESSION_UUID_PATTERN,
} from "@/lib/sessions/detail";
import { createServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!SESSION_UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  const auth = await requireUser();
  const viewerId = "user" in auth ? auth.user.id : null;
  const detail = await loadSessionDetail(id, viewerId, {
    revealParticipants:
      "profile" in auth ? isAdminProfile(auth.profile) : false,
  });
  if ("error" in detail) {
    return NextResponse.json(
      { error: detail.error },
      { status: detail.status },
    );
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!SESSION_UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAppEmailConfirmed(auth.profile)) {
    return NextResponse.json(
      { error: "Confirm your email before editing a session." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const gameId = String(body.game_id ?? "");
  const title = String(body.title ?? "").trim();
  const startsAt = new Date(String(body.starts_at ?? ""));
  const capacity = Number(body.capacity);
  const localeRaw = String(body.locale ?? "en");
  const locale = isLocaleCode(localeRaw) ? localeRaw : null;

  if (!UUID_PATTERN.test(gameId)) {
    return NextResponse.json({ error: "Choose a valid game." }, { status: 400 });
  }
  if (!title || title.length > 120) {
    return NextResponse.json(
      { error: "Title must be between 1 and 120 characters." },
      { status: 400 },
    );
  }
  if (!locale) {
    return NextResponse.json(
      { error: "Choose a valid title language." },
      { status: 400 },
    );
  }
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "The session must be scheduled in the future." },
      { status: 400 },
    );
  }
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 500) {
    return NextResponse.json(
      { error: "Capacity must be a whole number between 2 and 500." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient() ?? auth.supabase;
  const { data: existing, error: loadError } = await supabase
    .from("sessions")
    .select("id, creator_id, starts_at, registered_count")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const isOwner = existing.creator_id === auth.user.id;
  if (!isOwner && !isAdminProfile(auth.profile)) {
    return NextResponse.json(
      { error: "Only the host or an admin can edit this session." },
      { status: 403 },
    );
  }

  if (new Date(existing.starts_at).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Past sessions cannot be edited." },
      { status: 409 },
    );
  }

  const registeredCount = Number(existing.registered_count ?? 0);
  if (capacity < registeredCount) {
    return NextResponse.json(
      {
        error: `Capacity can’t be below the current signup count (${registeredCount}).`,
      },
      { status: 400 },
    );
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("is_published", true)
    .maybeSingle();

  if (gameError) {
    return NextResponse.json({ error: gameError.message }, { status: 500 });
  }
  if (!game) {
    return NextResponse.json(
      { error: "The selected published game was not found." },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from("sessions")
    .update({
      game_id: gameId,
      title,
      starts_at: startsAt.toISOString(),
      capacity,
      locale,
    })
    .eq("id", id)
    .select(
      "*, game:games(title, slug, platform), creator:profiles!creator_id(username)",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!SESSION_UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient() ?? auth.supabase;
  const { data: session, error: loadError } = await supabase
    .from("sessions")
    .select("id, creator_id, starts_at")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const isOwner = session.creator_id === auth.user.id;
  if (!isOwner && !isAdminProfile(auth.profile)) {
    return NextResponse.json(
      { error: "Only the host or an admin can delete this session." },
      { status: 403 },
    );
  }

  if (new Date(session.starts_at).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Past sessions cannot be deleted." },
      { status: 409 },
    );
  }

  const { error: deleteError } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
