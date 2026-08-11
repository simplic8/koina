import type { Profile } from "@/lib/types";

/** True only for an active profile with role=admin. */
export function isAdminProfile(
  profile: Pick<Profile, "role" | "status"> | null | undefined,
) {
  return Boolean(
    profile && profile.role === "admin" && profile.status === "active",
  );
}
