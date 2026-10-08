import { NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { requireUser } from "@/lib/auth/require-user";
import {
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
  const { data, error } = await service
    .from("forum_sessions")
    .select(
      "id, slug, title, description, is_live, is_hidden, presenter_state, created_at, updated_at, created_by",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ session: data });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isAdminProfile(auth.profile)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
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
    is_live?: boolean;
    is_hidden?: boolean;
    presenter_state?: Record<string, unknown>;
    title?: string;
    description?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.is_live === "boolean") patch.is_live = body.is_live;
  if (typeof body.is_hidden === "boolean") patch.is_hidden = body.is_hidden;
  if (body.presenter_state && typeof body.presenter_state === "object") {
    patch.presenter_state = body.presenter_state;
  }
  if (typeof body.title === "string" && body.title.trim()) {
    patch.title = body.title.trim();
  }
  if ("description" in body) {
    patch.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;
  }

  const { data, error } = await service
    .from("forum_sessions")
    .update(patch)
    .eq("id", id)
    .select(
      "id, slug, title, description, is_live, is_hidden, presenter_state, created_at, updated_at, created_by",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ session: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isAdminProfile(auth.profile)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const { data: session, error: fetchError } = await service
    .from("forum_sessions")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (session.storage_path) {
    await service.storage.from("forum-decks").remove([session.storage_path]);
  }

  const { error } = await service.from("forum_sessions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
