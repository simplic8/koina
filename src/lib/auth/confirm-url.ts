/**
 * Canonical public site origin for auth redirects and emails.
 * Prefer NEXT_PUBLIC_SITE_URL in production so OAuth never falls back to
 * localhost / preview hosts when Supabase or proxies rewrite the request URL.
 */
export function getConfiguredSiteOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return configured || null;
}

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

/**
 * Origin for email links and most server redirects.
 * On localhost, prefer the request host so local cookies / confirm links match.
 */
export function siteOriginFromRequest(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  if (isLocalOrigin(requestOrigin)) return requestOrigin;
  return getConfiguredSiteOrigin() ?? requestOrigin;
}

/**
 * Post-OAuth redirects must use the host that received `/auth/callback`
 * (where the PKCE + session cookies were set). Never swap localhost → SITE_URL.
 */
export function oauthReturnOrigin(request: Request) {
  return new URL(request.url).origin;
}

/** Browser-side origin for OAuth redirectTo — must match where PKCE cookies live. */
export function siteOriginForClient() {
  // Prefer the page the user is actually on so the code-verifier cookie set by
  // createBrowserClient is sent back to /auth/callback on the same host.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return getConfiguredSiteOrigin() ?? "";
}

/** App-owned confirmation link (not Supabase Auth OTP). */
export function buildEmailConfirmUrl(
  origin: string,
  token: string,
  next = "/onboarding",
) {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("token", token);
  url.searchParams.set("next", next);
  return url.toString();
}
