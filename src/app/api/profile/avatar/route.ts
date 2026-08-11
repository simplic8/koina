import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 2 * 1024 * 1024;

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Choose an image file to upload." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, or GIF image." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 2MB or smaller." },
      { status: 400 },
    );
  }

  const ext = extensionFor(file.type);
  const path = `${auth.user.id}/avatar.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { data: existing } = await auth.supabase.storage
    .from("avatars")
    .list(auth.user.id);
  const stale = (existing ?? [])
    .map((fileInfo) => `${auth.user.id}/${fileInfo.name}`)
    .filter((name) => name !== path);
  if (stale.length) {
    await auth.supabase.storage.from("avatars").remove(stale);
  }

  const { error: uploadError } = await auth.supabase.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return NextResponse.json(
      {
        error: uploadError.message.includes("Bucket not found")
          ? "Avatar storage is not set up. Apply migration 008_avatars_storage.sql."
          : uploadError.message,
      },
      { status: 400 },
    );
  }

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from("avatars").getPublicUrl(path);

  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await auth.supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", auth.user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await auth.supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  return NextResponse.json({ ok: true, avatar_url: avatarUrl });
}

export async function DELETE() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const folder = auth.user.id;
  const { data: files } = await auth.supabase.storage.from("avatars").list(folder);

  if (files?.length) {
    await auth.supabase.storage
      .from("avatars")
      .remove(files.map((file) => `${folder}/${file.name}`));
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await auth.supabase.auth.updateUser({
    data: { avatar_url: null },
  });

  return NextResponse.json({ ok: true, avatar_url: null });
}
