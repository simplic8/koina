import { NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { requireUser } from "@/lib/auth/require-user";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { ForumPresenterState } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { params: Promise<{ id: string }> };

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

function normalizePresenterState(
  incoming: Record<string, unknown>,
  previous: ForumPresenterState | null | undefined,
): ForumPresenterState {
  const prev = previous && typeof previous === "object" ? previous : {};
  const merged: ForumPresenterState = { ...prev, ...incoming };

  // Wire-only flags — keep bringToken so pollers can detect nudges
  delete merged.force;
  delete merged.prompt;

  const slideIndex =
    typeof incoming.slideIndex === "number" &&
    Number.isFinite(incoming.slideIndex)
      ? incoming.slideIndex
      : typeof prev.slideIndex === "number" && Number.isFinite(prev.slideIndex)
        ? prev.slideIndex
        : 0;

  merged.slideIndex = Math.max(0, Math.floor(slideIndex));
  merged.syncToken =
    typeof incoming.syncToken === "number"
      ? incoming.syncToken
      : typeof prev.syncToken === "number"
        ? prev.syncToken
        : Date.now();

  if (typeof incoming.bringToken === "number") {
    merged.bringToken = incoming.bringToken;
  }

  return merged;
}

/** Lightweight read of presenter_state for viewers (polling). */
export async function GET(_request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return json({ error: "Supabase is not configured." }, 503);
  }
  const service = createServiceClient();
  if (!service) {
    return json({ error: "Supabase is not configured." }, 503);
  }

  const { id } = await params;
  const { data, error } = await service
    .from("forum_sessions")
    .select("presenter_state, is_live, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Not found." }, 404);

  return json({
    presenter_state: data.presenter_state ?? {},
    is_live: data.is_live,
    updated_at: data.updated_at,
  });
}

/** Presenter writes current slide/UI state (admin only). */
export async function PUT(request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return json({ error: "Supabase is not configured." }, 503);
  }

  const auth = await requireUser();
  if ("error" in auth) {
    return json({ error: auth.error }, auth.status);
  }
  if (!isAdminProfile(auth.profile)) {
    return json({ error: "Admin only." }, 403);
  }

  const service = createServiceClient();
  if (!service) {
    return json({ error: "Supabase is not configured." }, 503);
  }

  const { id } = await params;
  let body: { presenter_state?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  if (!body.presenter_state || typeof body.presenter_state !== "object") {
    return json({ error: "presenter_state is required." }, 400);
  }

  const { data: existing } = await service
    .from("forum_sessions")
    .select("presenter_state")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return json({ error: "Not found." }, 404);

  const presenterState = normalizePresenterState(
    body.presenter_state,
    (existing.presenter_state as ForumPresenterState) ?? {},
  );

  const { data, error } = await service
    .from("forum_sessions")
    .update({
      presenter_state: presenterState,
      is_live: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("presenter_state, is_live, updated_at")
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Not found." }, 404);

  return json({
    ok: true,
    presenter_state: data.presenter_state,
    is_live: data.is_live,
    updated_at: data.updated_at,
  });
}
