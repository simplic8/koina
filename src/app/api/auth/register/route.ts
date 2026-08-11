import { NextResponse } from "next/server";
import { siteOriginFromRequest } from "@/lib/auth/confirm-url";
import { sendConfirmationEmail } from "@/lib/auth/send-confirmation";
import { validateUsername } from "@/lib/auth/username";
import { isResendConfigured } from "@/lib/resend";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

type RegisterBody = {
  email?: string;
  password?: string;
  username?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }
  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email delivery is not configured. Add RESEND_API_KEY.",
      },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Auth email services are unavailable." },
      { status: 503 },
    );
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const usernameResult = validateUsername(body.username);

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }
  if (!usernameResult.ok) {
    return NextResponse.json(
      { error: usernameResult.error },
      { status: 400 },
    );
  }
  const username = usernameResult.username;

  const origin = siteOriginFromRequest(request);
  const result = await sendConfirmationEmail({
    supabase,
    origin,
    email,
    username,
    password,
  });

  if (result.error) {
    const message = result.error.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    email,
    message:
      "We sent a confirmation link from noreply@koina.space. Confirm it before signing in.",
  });
}
