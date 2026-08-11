import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";

type Body = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (!auth.user.email) {
    return NextResponse.json(
      {
        error:
          "This account has no email password. Sign in with Discord or set an email login first.",
      },
      { status: 400 },
    );
  }
  if (currentPassword.length < 6) {
    return NextResponse.json(
      { error: "Enter your current password." },
      { status: 400 },
    );
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters." },
      { status: 400 },
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current one." },
      { status: 400 },
    );
  }

  const { error: verifyError } = await auth.supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  const { error } = await auth.supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
