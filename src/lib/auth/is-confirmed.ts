import type { Profile } from "@/lib/types";

/**
 * True only after the user clicks the KOINA confirmation email link.
 * Do not trust auth.users.email_confirmed_at — Google/Discord set that automatically.
 */
export function isAppEmailConfirmed(
  profile: Pick<Profile, "email_confirmed"> | null | undefined,
) {
  return profile?.email_confirmed === true;
}
