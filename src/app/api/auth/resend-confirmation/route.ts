import { NextResponse } from "next/server";
import { siteOriginFromRequest } from "@/lib/auth/confirm-url";
import { sendConfirmationEmail } from "@/lib/auth/send-confirmation";
import { isResendConfigured } from "@/lib/resend";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

type ResendBody = {
  email?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isResendConfigured()) {
    return NextResponse.json(
      { error: "Email confirmation is not configured." },
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

  let body: ResendBody;
  try {
    body = (await request.json()) as ResendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const origin = siteOriginFromRequest(request);
  const result = await sendConfirmationEmail({
    supabase,
    origin,
    email,
  });

  // Avoid leaking whether an account exists / is already confirmed.
  if (result.error && result.error !== "already_confirmed") {
    // Still return a generic success-shaped response for unknown emails.
    if (
      result.error.toLowerCase().includes("not found") ||
      result.error.toLowerCase().includes("unable") ||
      result.error.toLowerCase().includes("user")
    ) {
      return NextResponse.json({
        ok: true,
        message: "If that email needs confirmation, a new link is on the way.",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message:
      result.error === "already_confirmed"
        ? "That email is already confirmed. You can sign in."
        : "If that email needs confirmation, a new link is on the way.",
    alreadyConfirmed: result.error === "already_confirmed",
  });
}
