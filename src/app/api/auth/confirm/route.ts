import { NextResponse } from "next/server";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

type ConfirmBody = {
  token?: string;
  next?: string;
};

function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/onboarding";
  }
  if (next === "/login" || next.startsWith("/login?")) {
    return "/onboarding";
  }
  return next;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "Could not verify email." },
      { status: 503 },
    );
  }

  let body: ConfirmBody;
  try {
    body = (await request.json()) as ConfirmBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const next = safeNextPath(body.next);

  if (!token || token.length < 32) {
    return NextResponse.json(
      {
        error: "Invalid confirmation link.",
        code: "token_invalid",
      },
      { status: 400 },
    );
  }

  const { data: profile, error: lookupError } = await service
    .from("profiles")
    .select("id, email_confirmed, email_confirm_expires_at")
    .eq("email_confirm_token", token)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 });
  }

  if (!profile) {
    // Token already used/cleared, or never existed — guide users to sign in
    // instead of trapping them in a resend loop.
    return NextResponse.json(
      {
        error:
          "This confirmation link was already used or is no longer valid. If you already confirmed, sign in. Otherwise request a new confirmation email.",
        code: "token_invalid",
        signInPath: "/login",
      },
      { status: 400 },
    );
  }

  const expired =
    !!profile.email_confirm_expires_at &&
    new Date(profile.email_confirm_expires_at).getTime() < Date.now();

  if (expired && profile.email_confirmed !== true) {
    return NextResponse.json(
      {
        error:
          "Email link has expired. Request a new confirmation email.",
        code: "token_expired",
      },
      { status: 400 },
    );
  }

  // Idempotent: already confirmed with this still-present token is OK.
  if (profile.email_confirmed !== true) {
    const { error: updateError } = await service
      .from("profiles")
      .update({
        email_confirmed: true,
      })
      .eq("id", profile.id)
      .eq("email_confirm_token", token);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  await service.auth.admin.updateUserById(profile.id, { email_confirm: true });

  const { data: authUser, error: userError } =
    await service.auth.admin.getUserById(profile.id);
  const email = authUser.user?.email?.trim();

  if (userError || !email) {
    await service
      .from("profiles")
      .update({
        email_confirm_token: null,
        email_confirm_expires_at: null,
      })
      .eq("id", profile.id);

    return NextResponse.json({
      ok: true,
      next:
        "/login?message=" +
        encodeURIComponent("Email confirmed. Sign in to continue."),
    });
  }

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  const tokenHash = linkData?.properties?.hashed_token;
  // Prefer the verification type Supabase returns for this link.
  const verificationType =
    (linkData?.properties as { verification_type?: string } | undefined)
      ?.verification_type === "magiclink"
      ? "magiclink"
      : "email";

  // Clear the app token only after confirmation succeeded. Retries with the
  // same email link can still hit this endpoint while the token remains, but
  // we clear it now so links aren't reusable forever.
  await service
    .from("profiles")
    .update({
      email_confirm_token: null,
      email_confirm_expires_at: null,
    })
    .eq("id", profile.id);

  if (linkError || !tokenHash) {
    return NextResponse.json({
      ok: true,
      next:
        "/login?message=" +
        encodeURIComponent(
          "Email confirmed. Sign in to continue.",
        ),
    });
  }

  return NextResponse.json({
    ok: true,
    next,
    token_hash: tokenHash,
    otp_type: verificationType,
  });
}
