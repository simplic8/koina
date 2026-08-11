import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

export type BotProfile = {
  id: string;
  username: string | null;
  email_confirmed: boolean | null;
  status: string;
  discord_id: string | null;
};

let cached: SupabaseClient | null = null;

export function getBotSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function siteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://justvibing.fun"
  );
}

export function loginLink() {
  return `${siteBaseUrl()}/login?next=${encodeURIComponent("/profile")}`;
}

export function sessionDeepLink(sessionId: string) {
  return `${siteBaseUrl()}/sessions?session=${sessionId}`;
}
