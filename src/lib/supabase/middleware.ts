import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { isAppEmailConfirmed } from "@/lib/auth/is-confirmed";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const path = request.nextUrl.pathname;

  // Do not touch cookies on the OAuth/PKCE callback — getUser()/refresh can
  // drop the code-verifier cookie before exchangeCodeForSession runs.
  if (path.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (path.startsWith("/admin")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", path);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPublicPath =
    path.startsWith("/confirm-email") ||
    path.startsWith("/auth/confirm") ||
    path.startsWith("/auth/callback");

  let emailConfirmed = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_confirmed, role, status")
      .eq("id", user.id)
      .maybeSingle();

    emailConfirmed = isAppEmailConfirmed(profile);

    if (!emailConfirmed && !isAuthPublicPath) {
      // Do not signOut here — that raced with confirmation and bounced users
      // into a confirm-email loop. Just send them to the gate page.
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/confirm-email";
      redirectUrl.search = "";
      if (user.email) {
        redirectUrl.searchParams.set("email", user.email);
      }
      return NextResponse.redirect(redirectUrl);
    }

    if (path.startsWith("/login") || path.startsWith("/register")) {
      if (!emailConfirmed) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/confirm-email";
        redirectUrl.search = "";
        if (user.email) {
          redirectUrl.searchParams.set("email", user.email);
        }
        return NextResponse.redirect(redirectUrl);
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (path.startsWith("/admin")) {
      if (!isAdminProfile(profile)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  } else if (path.startsWith("/admin")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
