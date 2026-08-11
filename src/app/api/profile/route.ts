import { NextResponse } from "next/server";
import { getServiceOrNull, requireUser } from "@/lib/auth/require-user";
import {
  validateDisplayName,
  validateUsername,
} from "@/lib/auth/username";

type ProfileBody = {
  username?: string;
  displayName?: string;
  clearDiscordId?: boolean;
};

type DeleteBody = {
  password?: string;
  confirm?: string;
};

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: ProfileBody;
  try {
    body = (await request.json()) as ProfileBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.clearDiscordId) {
    const { error } = await auth.supabase
      .from("profiles")
      .update({ discord_id: null })
      .eq("id", auth.user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, discord_id: null });
  }

  const usernameResult = validateUsername(body.username);
  if (!usernameResult.ok) {
    return NextResponse.json(
      { error: usernameResult.error },
      { status: 400 },
    );
  }

  const displayResult = validateDisplayName(body.displayName);
  if (!displayResult.ok) {
    return NextResponse.json({ error: displayResult.error }, { status: 400 });
  }

  const { username } = usernameResult;
  const { displayName } = displayResult;

  const { error } = await auth.supabase
    .from("profiles")
    .update({ username, display_name: displayName })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await auth.supabase.auth.updateUser({
    data: { username, display_name: displayName },
  });

  return NextResponse.json({
    ok: true,
    username,
    display_name: displayName,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.confirm?.trim().toUpperCase() !== "DELETE") {
    return NextResponse.json(
      { error: "Type DELETE to confirm account deletion." },
      { status: 400 },
    );
  }

  const identities = auth.user.identities ?? [];
  const hasEmailIdentity = identities.some((i) => i.provider === "email");

  if (hasEmailIdentity) {
    if (!auth.user.email || !body.password || body.password.length < 6) {
      return NextResponse.json(
        { error: "Enter your password to delete this account." },
        { status: 400 },
      );
    }

    const { error: verifyError } = await auth.supabase.auth.signInWithPassword({
      email: auth.user.email,
      password: body.password,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: "Password is incorrect." },
        { status: 400 },
      );
    }
  }

  const service = getServiceOrNull();
  if (!service) {
    return NextResponse.json(
      { error: "Account deletion requires the service role key." },
      { status: 503 },
    );
  }

  const folder = auth.user.id;
  const { data: files } = await service.storage.from("avatars").list(folder);
  if (files?.length) {
    await service.storage
      .from("avatars")
      .remove(files.map((file) => `${folder}/${file.name}`));
  }

  const { error } = await service.auth.admin.deleteUser(auth.user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await auth.supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
