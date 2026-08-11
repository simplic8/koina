import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  let query = admin.supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(
      `username.ilike.%${q}%,discord_id.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
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

  if (body.id === admin.user.id) {
    if (body.role && body.role !== "admin") {
      return NextResponse.json(
        { error: "You cannot demote yourself" },
        { status: 400 },
      );
    }
    if (body.status === "suspended") {
      return NextResponse.json(
        { error: "You cannot suspend yourself" },
        { status: 400 },
      );
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.role === "user" || body.role === "admin") patch.role = body.role;
  if (body.status === "active" || body.status === "suspended") {
    patch.status = body.status;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const service = createServiceClient() ?? admin.supabase;
  const { data, error } = await service
    .from("profiles")
    .update(patch)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
