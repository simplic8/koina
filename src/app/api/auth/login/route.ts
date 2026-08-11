import { NextResponse } from "next/server";
import { isAppEmailConfirmed } from "@/lib/auth/is-confirmed";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Enter your password." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message = error.message.toLowerCase();
    const code = error.code?.toLowerCase() ?? "";
    if (
      code === "email_not_confirmed" ||
      message.includes("email not confirmed") ||
      message.includes("confirm your email") ||
      message.includes("email address not confirmed")
    ) {
      return NextResponse.json(
        {
          error: "unconfirmed",
          email,
          message:
            "Confirm your email before signing in. Check your inbox for the link from noreply@koina.space.",
        },
        { status: 403 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const user = data.user;
  if (!user) {
    return NextResponse.json({ error: "Could not sign in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_confirmed")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAppEmailConfirmed(profile)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        error: "unconfirmed",
        email,
        message:
          "Confirm your email before signing in. Check your inbox for the link from noreply@koina.space.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
