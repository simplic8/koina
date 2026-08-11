import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { oauthReturnOrigin } from "@/lib/auth/confirm-url";
import { isAppEmailConfirmed } from "@/lib/auth/is-confirmed";
import { sendConfirmationEmail } from "@/lib/auth/send-confirmation";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function oauthProviderLabel(user: {
  app_metadata?: { provider?: string };
  identities?: { provider: string }[] | null;
}) {
  const provider =
    user.app_metadata?.provider ||
    user.identities?.find((i) => i.provider !== "email")?.provider;
  if (provider === "discord") return "Discord";
  if (provider === "google") return "Google";
  return "your account";
}

function absoluteUrl(origin: string, path: string) {
  return path.startsWith("http") ? path : new URL(path, origin).toString();
}

function redirectWithCookies(url: string, cookiesToSet: CookieToSet[]) {
  const response = NextResponse.redirect(url);
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }
  return response;
}

function discordUserIdFromIdentity(identity: {
  id: string;
  identity_data?: Record<string, unknown> | null;
}) {
  const data = identity.identity_data ?? {};
  for (const candidate of [data.provider_id, data.sub, identity.id]) {
    if (typeof candidate === "string" && /^\d{5,}$/.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const linkProvider = searchParams.get("link");
  // Must match the host that set the OAuth cookies (localhost vs production).
  const origin = oauthReturnOrigin(request);

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(absoluteUrl(origin, next));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(absoluteUrl(origin, next));
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          request.cookies.set(cookie.name, cookie.value);
          cookiesToSet.push(cookie);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const failPath = linkProvider ? "/profile" : "/login";
    return redirectWithCookies(
      absoluteUrl(
        origin,
        `${failPath}?error=${encodeURIComponent(error.message)}`,
      ),
      cookiesToSet,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithCookies(absoluteUrl(origin, next), cookiesToSet);
  }

  const service = createServiceClient();
  const discordIdentity = user.identities?.find(
    (identity) => identity.provider === "discord",
  );
  const discordUserId = discordIdentity
    ? discordUserIdFromIdentity(discordIdentity)
    : null;

  if (service && discordUserId) {
    await service
      .from("profiles")
      .update({ discord_id: discordUserId })
      .eq("id", user.id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_confirmed, username")
    .eq("id", user.id)
    .maybeSingle();

  if (linkProvider) {
    const linked = new URL("/profile", origin);
    linked.searchParams.set(
      "message",
      `${linkProvider === "discord" ? "Discord" : "Google"} linked successfully.`,
    );
    return redirectWithCookies(linked.toString(), cookiesToSet);
  }

  if (!isAppEmailConfirmed(profile)) {
    const label = oauthProviderLabel(user);
    const confirmUrl = new URL("/confirm-email", origin);

    if (service && user.email) {
      // Reuse a still-valid pending link — do not rotate the token on every
      // OAuth attempt (that invalidates the email already in their inbox).
      const sendResult = await sendConfirmationEmail({
        supabase: service,
        origin,
        email: user.email,
        username: profile?.username ?? null,
        forceNewToken: false,
      });
      confirmUrl.searchParams.set("email", user.email);
      if (sendResult.error === "already_confirmed") {
        // Race: confirmed between checks — continue to app.
        return redirectWithCookies(absoluteUrl(origin, next), cookiesToSet);
      }
      if ("error" in sendResult && sendResult.error) {
        confirmUrl.searchParams.set(
          "error",
          `${label} sign-in needs email confirmation, but we couldn’t send the link: ${sendResult.error}`,
        );
      } else {
        confirmUrl.searchParams.set(
          "message",
          sendResult.ok && sendResult.reusedToken
            ? `${label} sign-in needs email confirmation first. Use the link we already sent from noreply@koina.space (or resend below).`
            : `${label} sign-in needs email confirmation first. We sent a link from noreply@koina.space.`,
        );
      }
    } else {
      confirmUrl.searchParams.set(
        "error",
        `${label} did not share an email address. Enable email on your ${label} account, or register with email instead.`,
      );
    }

    await supabase.auth.signOut();
    return redirectWithCookies(confirmUrl.toString(), cookiesToSet);
  }

  return redirectWithCookies(absoluteUrl(origin, next), cookiesToSet);
}
