import { createClient } from "@/lib/supabase/server";
import { isAdminProfile } from "@/lib/auth/is-admin";

export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured", status: 503 as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminProfile(profile)) {
    return { error: "Forbidden", status: 403 as const };
  }

  return { user, profile, supabase };
}
