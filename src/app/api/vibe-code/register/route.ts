import { NextResponse } from "next/server";
import {
  vibeCodeRegistrationHtml,
  vibeCodeRegistrationSubject,
  vibeCodeRegistrationText,
} from "@/lib/email/vibe-code-registration";
import { getResendClient, getResendFrom, isResendConfigured } from "@/lib/resend";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  discord?: string;
  consentVibeCode?: boolean;
  consentKoina?: boolean;
};

function optionalHandle(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

async function sendRegistrationEmail(firstName: string, email: string) {
  const resend = getResendClient();
  if (!resend) {
    return { error: "Email delivery is not configured." };
  }

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: email,
    subject: vibeCodeRegistrationSubject(),
    text: vibeCodeRegistrationText({ firstName }),
    html: vibeCodeRegistrationHtml({ firstName }),
  });

  if (error) {
    return { error: error.message || "Could not send confirmation email." };
  }
  return { error: null as string | null };
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Registration is unavailable right now." },
      { status: 503 },
    );
  }
  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email delivery is not configured. Add RESEND_API_KEY and try again.",
      },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Registration is unavailable right now." },
      { status: 503 },
    );
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const whatsapp = optionalHandle(body.whatsapp);
  const telegram = optionalHandle(body.telegram);
  const discord = optionalHandle(body.discord);
  const consentVibeCode = body.consentVibeCode === true;
  const consentKoina = body.consentKoina === true;

  if (!firstName || firstName.length > 80) {
    return NextResponse.json(
      { error: "Please enter your first name." },
      { status: 400 },
    );
  }
  if (!lastName || lastName.length > 80) {
    return NextResponse.json(
      { error: "Please enter your last name." },
      { status: 400 },
    );
  }
  if (!email || !email.includes("@") || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (!consentVibeCode) {
    return NextResponse.json(
      {
        error:
          "Please consent to be contacted about Vibe Code so we can follow up.",
      },
      { status: 400 },
    );
  }

  const row = {
    first_name: firstName,
    last_name: lastName,
    email,
    whatsapp,
    telegram,
    discord,
    consent_vibe_code: true,
    consent_koina: consentKoina,
  };

  const { error: insertError } = await supabase
    .from("vibe_code_registrations")
    .insert(row);

  if (insertError) {
    if (insertError.code === "23505") {
      const emailResult = await sendRegistrationEmail(firstName, email);
      if (emailResult.error) {
        return NextResponse.json(
          {
            ok: true,
            alreadyRegistered: true,
            message:
              "You're already registered. We couldn't resend the confirmation email right now — hang tight, we'll still get back to you.",
          },
          { status: 200 },
        );
      }
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        message:
          "You're already registered. We resent a confirmation email — we'll get back to you soon.",
      });
    }

    console.error("vibe-code register insert failed:", insertError.message);
    return NextResponse.json(
      { error: "Could not save your registration. Please try again." },
      { status: 500 },
    );
  }

  const emailResult = await sendRegistrationEmail(firstName, email);
  if (emailResult.error) {
    console.error("vibe-code register email failed:", emailResult.error);
    return NextResponse.json({
      ok: true,
      message:
        "Registration received. We couldn't send the confirmation email right now, but we'll still get back to you.",
    });
  }

  return NextResponse.json({
    ok: true,
    message:
      "Registration received. Check your email for a confirmation — we'll get back to you soon.",
  });
}
