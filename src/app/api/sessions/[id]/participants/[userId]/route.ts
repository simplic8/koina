import { NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { requireUser } from "@/lib/auth/require-user";
import {
  loadSessionDetail,
  SESSION_UUID_PATTERN,
} from "@/lib/sessions/detail";
import { createServiceClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string; userId: string }>;
};

/** Host/admin removes a participant, or a user removes themself. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id, userId } = await context.params;
  if (!SESSION_UUID_PATTERN.test(id) || !SESSION_UUID_PATTERN.test(userId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const isSelf = userId === auth.user.id;
  const service = createServiceClient();
  // Removing someone else bypasses RSVP RLS (users may only delete their own rows).
  const supabase = isSelf ? (service ?? auth.supabase) : service;
  if (!supabase) {
    return NextResponse.json(
      { error: "Participant updates require the service role key." },
      { status: 503 },
    );
  }

  const { data: session, error: loadError } = await supabase
    .from("sessions")
    .select("id, creator_id, starts_at, registered_count")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const isOwner = session.creator_id === auth.user.id;
  if (!isSelf && !isOwner && !isAdminProfile(auth.profile)) {
    return NextResponse.json(
      { error: "Only the host can remove other participants." },
      { status: 403 },
    );
  }

  if (new Date(session.starts_at).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Participants can’t be changed after the session has started." },
      { status: 409 },
    );
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("session_rsvps")
    .delete()
    .eq("session_id", id)
    .eq("user_id", userId)
    .select("user_id");

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (deleted?.length) {
    const nextCount = Math.max(Number(session.registered_count) - 1, 0);
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ registered_count: nextCount })
      .eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const detail = await loadSessionDetail(id, auth.user.id, {
    revealParticipants: isAdminProfile(auth.profile),
  });
  if ("error" in detail) {
    return NextResponse.json({
      ok: true,
      joined: false,
      registered_count: Math.max(Number(session.registered_count) - 1, 0),
    });
  }

  return NextResponse.json(detail);
}
