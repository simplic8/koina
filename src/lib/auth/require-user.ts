import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthOk = {
  user: User;
  profile: Profile;
  supabase: SupabaseClient;
};

type AuthErr = {
  error: string;
  status: 401 | 403 | 503;
};

export async function requireUser(): Promise<AuthOk | AuthErr> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured", status: 503 };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    return { error: "Forbidden", status: 403 };
  }

  return { user, profile: profile as Profile, supabase };
}

export function getServiceOrNull() {
  return createServiceClient();
}
