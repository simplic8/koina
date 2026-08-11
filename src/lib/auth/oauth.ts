import type { Provider, UserIdentity } from "@supabase/supabase-js";
import { siteOriginForClient } from "@/lib/auth/confirm-url";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function friendlyLinkingError(message: string | undefined | null) {
  const raw = message?.trim() || "Something went wrong.";
  if (/manual linking is disabled/i.test(raw)) {
    return "Manual linking is disabled in Supabase. Open your project → Authentication → Sign In / Providers → turn on “Allow manual linking”, then try again.";
  }
  return raw;
}

function oauthCallbackUrl(next = "/", link?: "discord" | "google") {
  const redirectTo = new URL("/auth/callback", siteOriginForClient());
  if (next && next !== "/") {
    redirectTo.searchParams.set("next", next);
  }
  if (link) {
    redirectTo.searchParams.set("link", link);
  }
  return redirectTo.toString();
}

export async function signInWithOAuthProvider(
  provider: Extract<Provider, "discord" | "google">,
  next = "/",
) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Add env vars and restart." };
  }

  const supabase = createClient();
  if (!supabase) {
    return { error: "Supabase is not configured. Add env vars and restart." };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: oauthCallbackUrl(next),
      // Discord must include email so we can send the confirmation link.
      scopes: provider === "discord" ? "identify email" : undefined,
      queryParams:
        provider === "google"
          ? { access_type: "offline", prompt: "consent" }
          : undefined,
    },
  });

  return { error: error ? friendlyLinkingError(error.message) : null };
}

/** Link Google or Discord to the currently signed-in account. */
export async function linkOAuthProvider(
  provider: Extract<Provider, "discord" | "google">,
  next = "/profile",
) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Add env vars and restart." };
  }

  const supabase = createClient();
  if (!supabase) {
    return { error: "Supabase is not configured. Add env vars and restart." };
  }

  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: oauthCallbackUrl(next, provider),
      scopes: provider === "discord" ? "identify email" : undefined,
      queryParams:
        provider === "google"
          ? { access_type: "offline", prompt: "consent" }
          : undefined,
    },
  });

  return { error: error ? friendlyLinkingError(error.message) : null };
}

export async function unlinkOAuthProvider(
  provider: Extract<Provider, "discord" | "google">,
) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Add env vars and restart." };
  }

  const supabase = createClient();
  if (!supabase) {
    return { error: "Supabase is not configured. Add env vars and restart." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: userError?.message ?? "Sign in to manage linked accounts." };
  }

  const identities = user.identities ?? [];
  const identity = identities.find((item) => item.provider === provider) as
    | UserIdentity
    | undefined;
  if (!identity) {
    return { error: `${provider} is not linked to this account.` };
  }

  if (identities.length <= 1) {
    return {
      error:
        "You can’t unlink your only sign-in method. Add another method first.",
    };
  }

  const { error } = await supabase.auth.unlinkIdentity(identity);
  if (error) return { error: friendlyLinkingError(error.message) };

  if (provider === "discord") {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearDiscordId: true }),
    });
  }

  return { error: null };
}
