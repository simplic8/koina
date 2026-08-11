const USERNAME_PATTERN = /^[a-zA-Z0-9_\-.]+$/;

export function normalizeUsername(raw: string | null | undefined) {
  return (raw ?? "").trim().replace(/\s+/g, "");
}

export function validateUsername(raw: string | null | undefined):
  | { ok: true; username: string }
  | { ok: false; error: string } {
  const username = normalizeUsername(raw);
  if (username.length < 2 || username.length > 32) {
    return {
      ok: false,
      error: "Username must be between 2 and 32 characters.",
    };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error:
        "Username can’t include spaces. Use letters, numbers, hyphens, dots, or underscores.",
    };
  }
  return { ok: true, username };
}

export function normalizeDisplayName(raw: string | null | undefined) {
  const trimmed = (raw ?? "").trim().replace(/\s+/g, " ");
  return trimmed.length ? trimmed : null;
}

export function validateDisplayName(raw: string | null | undefined):
  | { ok: true; displayName: string | null }
  | { ok: false; error: string } {
  const displayName = normalizeDisplayName(raw);
  if (displayName && displayName.length > 48) {
    return {
      ok: false,
      error: "Display name must be 48 characters or fewer.",
    };
  }
  return { ok: true, displayName };
}
