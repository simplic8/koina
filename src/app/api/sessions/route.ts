import { NextResponse } from "next/server";
import { isAppEmailConfirmed } from "@/lib/auth/is-confirmed";
import { requireUser } from "@/lib/auth/require-user";
import { isLocaleCode } from "@/lib/i18n/locales";
import { createServiceClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAppEmailConfirmed(auth.profile)) {
    return NextResponse.json(
      { error: "Confirm your email before scheduling a session." },
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
    .insert({
      game_id: gameId,
      title,
      starts_at: startsAt.toISOString(),
      capacity,
      registered_count: 1,
      creator_id: auth.user.id,
      locale,
    })
    .select(
      "*, game:games(title, slug, platform), creator:profiles!creator_id(username)",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: rsvpError } = await supabase.from("session_rsvps").insert({
    session_id: data.id,
    user_id: auth.user.id,
  });

  if (rsvpError) {
    await supabase
      .from("sessions")
      .update({ registered_count: 0 })
      .eq("id", data.id);
    return NextResponse.json(
      {
        session: { ...data, registered_count: 0 },
        warning:
          "Session created, but auto-join failed. Join from the session card.",
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    { session: { ...data, viewer_joined: true } },
    { status: 201 },
  );
}
