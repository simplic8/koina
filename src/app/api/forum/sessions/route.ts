import { NextResponse } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { requireUser } from "@/lib/auth/require-user";
import { slugifyTitle } from "@/lib/forum/slug";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("forum_sessions")
    .select(
      "id, slug, title, description, is_live, created_at, updated_at, created_by",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(request: Request) {
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

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const file = form.get("file");

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "HTML file is required." },
      { status: 400 },
    );
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be 10MB or smaller." },
      { status: 400 },
    );
  }

  const html = await file.text();
  if (!/<html|<!doctype html/i.test(html)) {
    return NextResponse.json(
      { error: "Upload a valid HTML file." },
      { status: 400 },
    );
  }

  const slug = slugifyTitle(title);
  const storagePath = `${auth.user.id}/${slug}.html`;

  const { error: uploadError } = await service.storage
    .from("forum-decks")
    .upload(storagePath, html, {
      contentType: "text/html; charset=utf-8",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data, error } = await service
    .from("forum_sessions")
    .insert({
      slug,
      title,
      description,
      storage_path: storagePath,
      created_by: auth.user.id,
      is_live: false,
      presenter_state: {},
    })
    .select(
      "id, slug, title, description, is_live, created_at, updated_at, created_by",
    )
    .single();

  if (error) {
    await service.storage.from("forum-decks").remove([storagePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data }, { status: 201 });
}
