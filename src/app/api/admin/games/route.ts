import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { isLocaleCode } from "@/lib/i18n/locales";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { data, error } = await admin.supabase
    .from("games")
    .select("*, translations:game_translations(locale, title, description)")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ games: data });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await request.json();
  const service = createServiceClient() ?? admin.supabase;

  const slug =
    body.slug ||
    String(body.title ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const is_vetted = Boolean(body.is_vetted);
  const is_published = Boolean(body.is_published) && is_vetted;

  const { data, error } = await service
    .from("games")
    .insert({
      title: body.title,
      slug,
      platform: "roblox",
      description: body.description ?? null,
      roblox_universe_id: body.roblox_universe_id || null,
      roblox_place_id: body.roblox_place_id || null,
      ordered_datastore_id: body.ordered_datastore_id || "PlayerScores",
      is_vetted,
      is_published,
      is_featured: Boolean(body.is_featured),
      sort_order: Number(body.sort_order ?? 0),
      published_at: is_published ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ game: data });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const service = createServiceClient() ?? admin.supabase;

  const { data: existing } = await service
    .from("games")
    .select("*")
    .eq("id", body.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const is_vetted =
    body.is_vetted !== undefined ? Boolean(body.is_vetted) : existing.is_vetted;
  let is_published =
    body.is_published !== undefined
      ? Boolean(body.is_published)
      : existing.is_published;

  if (is_published && !is_vetted) {
    is_published = false;
  }

  const patch: Record<string, unknown> = {
    ...("title" in body ? { title: body.title } : {}),
    ...("slug" in body ? { slug: body.slug } : {}),
    ...("description" in body ? { description: body.description } : {}),
    ...("roblox_universe_id" in body
      ? { roblox_universe_id: body.roblox_universe_id || null }
      : {}),
    ...("roblox_place_id" in body
      ? { roblox_place_id: body.roblox_place_id || null }
      : {}),
    ...("ordered_datastore_id" in body
      ? { ordered_datastore_id: body.ordered_datastore_id || null }
      : {}),
    ...("is_featured" in body ? { is_featured: Boolean(body.is_featured) } : {}),
    ...("sort_order" in body ? { sort_order: Number(body.sort_order) } : {}),
    is_vetted,
    is_published,
  };

  if (is_published && !existing.is_published) {
    patch.published_at = new Date().toISOString();
  }
  if (!is_published) {
    patch.published_at = null;
  }

  const { data, error } = await service
    .from("games")
    .update(patch)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(body.translations)) {
    const rows = body.translations
      .map((row: unknown) => {
        if (!row || typeof row !== "object") return null;
        const item = row as Record<string, unknown>;
        const locale = String(item.locale ?? "");
        const title = String(item.title ?? "").trim();
        if (!isLocaleCode(locale) || !title) return null;
        return {
          game_id: body.id as string,
          locale,
          title,
          description:
            item.description === null || item.description === undefined
              ? null
              : String(item.description),
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (rows.length) {
      const { error: translationError } = await service
        .from("game_translations")
        .upsert(rows, { onConflict: "game_id,locale" });
      if (translationError) {
        return NextResponse.json(
          { error: translationError.message },
          { status: 500 },
        );
      }
    }
  }

  const { data: withTranslations, error: reloadError } = await service
    .from("games")
    .select("*, translations:game_translations(locale, title, description)")
    .eq("id", body.id)
    .single();

  if (reloadError) {
    return NextResponse.json({ game: data });
  }

  return NextResponse.json({ game: withTranslations });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const service = createServiceClient() ?? admin.supabase;
  const { error } = await service.from("games").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
