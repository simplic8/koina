"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LiveDot } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";

/**
 * Interstitial confirm page — verification runs only after an explicit click
 * so email scanners cannot consume the one-time token on prefetch.
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [next, setNext] = useState("/onboarding");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [ready, setReady] = useState(false);
  const [signInHint, setSignInHint] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmToken = params.get("token");
    const nextPath = params.get("next");
    setToken(confirmToken);
    if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
      setNext(
        nextPath === "/login" || nextPath.startsWith("/login?")
          ? "/onboarding"
          : nextPath,
      );
    }
    if (!confirmToken) {
      setError(
        "Invalid confirmation link. Request a new one from the confirm email page.",
      );
    }
    setReady(true);
  }, []);

  async function onConfirm() {
    if (!token) {
      setError("Invalid confirmation link.");
      return;
    }

    setConfirming(true);
    setError(null);
    setSignInHint(false);
    try {
      const response = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, next }),
      });
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        next?: string;
        token_hash?: string;
        otp_type?: "magiclink" | "email";
        signInPath?: string;
      };

      if (!response.ok) {
        setSignInHint(
          data.code === "token_invalid" || Boolean(data.signInPath),
        );
        throw new Error(
          data.error ??
            "Email link is invalid or has expired. Request a new confirmation email.",
        );
      }

      // App confirmation succeeded. Auto sign-in is best-effort only — never
      // treat OTP failure as "link invalid" or users get stuck resending.
      if (data.token_hash) {
        const supabase = createClient();
        if (supabase) {
          const otpType = data.otp_type === "magiclink" ? "magiclink" : "email";
          const { error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: data.token_hash,
            type: otpType,
          });
          if (sessionError) {
            router.replace(
              "/login?message=" +
                encodeURIComponent(
                  "Email confirmed. Sign in to continue.",
                ),
            );
            router.refresh();
            return;
          }
        } else {
          router.replace(
            "/login?message=" +
              encodeURIComponent("Email confirmed. Sign in to continue."),
          );
          return;
        }
      }

      router.replace(data.next || "/onboarding");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Email link is invalid or has expired.",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-md px-6">
        <p className="mb-3.5 flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
          <LiveDot />
          Confirm email
        </p>
        <h1 className="mb-2 text-3xl">Activate your account</h1>
        <p className="mb-8 text-ink-70">
          Click the button below to confirm your email. You&apos;ll be signed in
          automatically when possible. This only runs when you press the button
          — not when the email is opened.
        </p>

        {error && (
          <p className="mb-4 text-sm text-accent-600">
            {error}{" "}
            {signInHint && (
              <Link href="/login" className="font-semibold underline">
                Sign in
              </Link>
            )}
          </p>
        )}

        {ready && token && (
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="w-full"
          >
            {confirming ? "Confirming…" : "Confirm email & continue"}
          </Button>
        )}

        <p className="mt-6 text-sm text-ink-70">
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold text-accent-600">
            Sign in
          </Link>
          {" · "}
          Need a new link?{" "}
          <Link href="/confirm-email" className="font-semibold text-accent-600">
            Resend confirmation email
          </Link>
        </p>
      </div>
    </section>
  );
}
