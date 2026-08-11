import { NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { isAppEmailConfirmed } from "@/lib/auth/is-confirmed";
import { requireUser } from "@/lib/auth/require-user";
import {
  loadSessionDetail,
  mapSessionRpcError,
  SESSION_UUID_PATTERN,
} from "@/lib/sessions/detail";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
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
      { error: "Confirm your email before joining a session." },
      { status: 403 },
    );
  }

  const { data, error } = await auth.supabase.rpc("join_session", {
    p_session_id: id,
  });

  if (error) {
    const mapped = mapSessionRpcError(error.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  const detail = await loadSessionDetail(id, auth.user.id, {
    revealParticipants: isAdminProfile(auth.profile),
  });
  if ("error" in detail) {
    return NextResponse.json({
      joined: true,
      registered_count: Number(
        (data as { registered_count?: number })?.registered_count ?? 0,
      ),
      capacity: Number((data as { capacity?: number })?.capacity ?? 0),
    });
  }

  return NextResponse.json(detail);
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

  const { data, error } = await auth.supabase.rpc("leave_session", {
    p_session_id: id,
  });

  if (error) {
    const mapped = mapSessionRpcError(error.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  const detail = await loadSessionDetail(id, auth.user.id, {
    revealParticipants: isAdminProfile(auth.profile),
  });
  if ("error" in detail) {
    return NextResponse.json({
      joined: false,
      registered_count: Number(
        (data as { registered_count?: number })?.registered_count ?? 0,
      ),
      capacity: Number((data as { capacity?: number })?.capacity ?? 0),
    });
  }

  return NextResponse.json(detail);
}
