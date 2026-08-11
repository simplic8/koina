import type { BotProfile } from "./supabase";
import { getBotSupabase, loginLink } from "./supabase";

export type ResolveProfileResult =
  | { ok: true; profile: BotProfile }
  | {
      ok: false;
      reason: "not_linked" | "inactive" | "unconfirmed";
      message: string;
    };

export async function resolveProfileByDiscordId(
  discordId: string,
  options?: { requireEmailConfirmed?: boolean },
): Promise<ResolveProfileResult> {
  const requireEmailConfirmed = options?.requireEmailConfirmed ?? false;
  const supabase = getBotSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email_confirmed, status, discord_id")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      ok: false,
      reason: "not_linked",
      message: `Link your Discord account on JustVibing first: ${loginLink()}`,
    };
  }

  if (data.status !== "active") {
    return {
      ok: false,
      reason: "inactive",
      message: "Your JustVibing account is not active.",
    };
  }

  if (requireEmailConfirmed && data.email_confirmed !== true) {
    return {
      ok: false,
      reason: "unconfirmed",
      message: `Confirm your email on JustVibing before scheduling or joining: ${loginLink()}`,
    };
  }

  return { ok: true, profile: data as BotProfile };
}
