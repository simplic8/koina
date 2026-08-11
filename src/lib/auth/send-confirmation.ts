import { randomBytes } from "crypto";
import {
  confirmSignupHtml,
  confirmSignupSubject,
  confirmSignupText,
} from "@/lib/email/confirm-signup";
import { buildEmailConfirmUrl } from "@/lib/auth/confirm-url";
import { getResendClient, getResendFrom } from "@/lib/resend";
import type { SupabaseClient } from "@supabase/supabase-js";

type SendArgs = {
  supabase: SupabaseClient;
  origin: string;
  email: string;
  username?: string | null;
  /** Creates the auth user when registering with email/password. */
  password?: string;
  /**
   * When false, reuse a still-valid pending token instead of rotating
   * (avoids invalidating the link already in the user's inbox).
   */
  forceNewToken?: boolean;
};

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function newConfirmToken() {
  return randomBytes(32).toString("hex");
}

async function findUserIdByEmail(supabase: SupabaseClient, email: string) {
  const { data, error } = await supabase.rpc("find_auth_user_id_by_email", {
    lookup_email: email,
  });
  if (error) return { userId: null as string | null, error: error.message };
  return { userId: (data as string | null) ?? null, error: null as string | null };
}

export async function sendConfirmationEmail({
  supabase,
  origin,
  email,
  username,
  password,
  forceNewToken = true,
}: SendArgs) {
  const resend = getResendClient();
  if (!resend) {
    return { error: "Email delivery is not configured." };
  }

  let userId: string | undefined;
  let displayName = username?.trim() || email.split("@")[0] || "player";
  let existingToken: string | null = null;
  let existingExpires: string | null = null;

  if (password) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      // Auth-level confirm so password login works after our app gate.
      email_confirm: true,
      user_metadata: username ? { username } : undefined,
    });
    if (error) return { error: error.message };
    userId = data.user?.id;
    displayName =
      (data.user?.user_metadata?.username as string | undefined)?.trim() ||
      displayName;
  } else {
    const found = await findUserIdByEmail(supabase, email);
    if (found.error) return { error: found.error };
    if (!found.userId) {
      return { error: "User not found" };
    }
    userId = found.userId;

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "email_confirmed, username, email_confirm_token, email_confirm_expires_at",
      )
      .eq("id", userId)
      .maybeSingle();

    if (profile?.email_confirmed === true) {
      return { error: "already_confirmed" as const };
    }
    displayName = profile?.username?.trim() || displayName;
    existingToken = profile?.email_confirm_token ?? null;
    existingExpires = profile?.email_confirm_expires_at ?? null;
  }

  if (!userId) {
    return { error: "Could not create a confirmation link." };
  }

  const existingStillValid =
    !forceNewToken &&
    !!existingToken &&
    !!existingExpires &&
    new Date(existingExpires).getTime() > Date.now();

  const token = existingStillValid ? existingToken! : newConfirmToken();
  const expiresAt = existingStillValid
    ? existingExpires!
    : new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  if (!existingStillValid) {
    let tokenSaved = false;
    for (let attempt = 0; attempt < 3 && !tokenSaved; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 150 * attempt));
      }
      const { data: rows, error: tokenError } = await supabase
        .from("profiles")
        .update({
          email_confirmed: false,
          email_confirm_token: token,
          email_confirm_expires_at: expiresAt,
        })
        .eq("id", userId)
        .select("id");

      if (tokenError) {
        return {
          error: tokenError.message || "Could not create a confirmation link.",
        };
      }
      tokenSaved = Boolean(rows?.length);
    }

    if (!tokenSaved) {
      return {
        error:
          "Profile was not ready for confirmation. Wait a moment and try resending.",
      };
    }
  }

  const confirmUrl = buildEmailConfirmUrl(origin, token);
  const { error: sendError } = await resend.emails.send({
    from: getResendFrom(),
    to: email,
    subject: confirmSignupSubject(),
    text: confirmSignupText({ username: displayName, confirmUrl }),
    html: confirmSignupHtml({ username: displayName, confirmUrl }),
  });

  if (sendError) {
    return { error: sendError.message || "Could not send confirmation email." };
  }

  return { ok: true as const, reusedToken: existingStillValid };
}
