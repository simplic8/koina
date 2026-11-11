"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LiveDot } from "@/components/ui/Badge";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";

/**
 * Interstitial confirm page — verification runs only after an explicit click
 * so email scanners cannot consume the one-time token on prefetch.
 */
export default function AuthConfirmPage() {
  const { t } = useLocale();
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
    setReady(true);
  }, []);

  // Derived so the message follows the locale (it resolves after first mount)
  const shownError =
    error ?? (ready && !token ? t("authConfirm.invalidLink") : null);

  async function onConfirm() {
    if (!token) {
      setError(t("authConfirm.invalidShort"));
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
          data.code === "token_invalid"
            ? t("authConfirm.expired")
            : (data.error ?? t("authConfirm.expired")),
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
                encodeURIComponent(t("authConfirm.confirmedSignIn")),
            );
            router.refresh();
            return;
          }
        } else {
          router.replace(
            "/login?message=" +
              encodeURIComponent(t("authConfirm.confirmedSignIn")),
          );
          return;
        }
      }

      router.replace(data.next || "/onboarding");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("authConfirm.expiredShort"),
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
          {t("authConfirm.eyebrow")}
        </p>
        <h1 className="mb-2 text-3xl">{t("authConfirm.title")}</h1>
        <p className="mb-8 text-ink-70">{t("authConfirm.lead")}</p>

        {shownError && (
          <p className="mb-4 text-sm text-accent-600">
            {shownError}{" "}
            {signInHint && (
              <Link href="/login" className="font-semibold underline">
                {t("confirm.signIn")}
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
            {confirming
              ? t("authConfirm.confirming")
              : t("authConfirm.button")}
          </Button>
        )}

        <p className="mt-6 text-sm text-ink-70">
          {t("confirm.already")}{" "}
          <Link href="/login" className="font-semibold text-accent-600">
            {t("confirm.signIn")}
          </Link>
          {" · "}
          {t("authConfirm.needNew")}{" "}
          <Link href="/confirm-email" className="font-semibold text-accent-600">
            {t("confirm.resend")}
          </Link>
        </p>
      </div>
    </section>
  );
}
