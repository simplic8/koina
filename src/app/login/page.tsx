"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { signInWithOAuthProvider } from "@/lib/auth/oauth";
import { LiveDot } from "@/components/ui/Badge";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "discord" | null>(
    null,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLink = params.get("error");
    const fromMessage = params.get("message");
    if (fromLink) setError(fromLink);
    if (fromMessage) setMessage(fromMessage);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as {
        error?: string;
        email?: string;
        message?: string;
      };

      if (response.status === 403 && data.error === "unconfirmed") {
        const confirmedEmail = (data.email ?? email).trim().toLowerCase();
        router.push(
          `/confirm-email?email=${encodeURIComponent(confirmedEmail)}&message=${encodeURIComponent(
            data.message ??
              "Confirm your email before signing in. We can resend the link below.",
          )}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not sign in.");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setLoading(false);
    }
  }

  async function signInOAuth(provider: "google" | "discord") {
    setError(null);
    setMessage(null);
    setOauthLoading(provider);
    const { error: err } = await signInWithOAuthProvider(provider);
    if (err) {
      setError(err);
      setOauthLoading(null);
    }
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-md px-6">
        <p className="mb-3.5 flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
          <LiveDot />
          {t("auth.welcomeBack")}
        </p>
        <h1 className="mb-2 text-3xl">{t("auth.signInTitle")}</h1>
        <p className="mb-8 text-ink-70">{t("auth.signInLead")}</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="block text-sm font-medium">
            {t("auth.email")}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block text-sm font-medium">
            {t("auth.password")}
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />
          </label>
          {message && <p className="text-sm text-ink-70">{message}</p>}
          {error && <p className="text-sm text-accent-600">{error}</p>}
          <Button type="submit" disabled={loading || Boolean(oauthLoading)}>
            {loading ? `${t("auth.signInCta")}…` : t("auth.signInCta")}
          </Button>
        </form>

        <p className="mt-4 text-sm text-ink-70">
          {t("auth.needConfirm")}{" "}
          <Link href="/confirm-email" className="font-semibold text-accent-600">
            {t("auth.resendLink")}
          </Link>
        </p>

        <div className="my-6 flex items-center gap-3 text-xs text-ink-40">
          <span className="h-px flex-1 bg-ink-08" />
          {t("auth.or")}
          <span className="h-px flex-1 bg-ink-08" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => signInOAuth("google")}
            disabled={loading || Boolean(oauthLoading)}
          >
            {oauthLoading === "google"
              ? `${t("auth.continueGoogle")}…`
              : t("auth.continueGoogle")}
          </Button>
          <Button
            variant="dark"
            className="w-full justify-center"
            onClick={() => signInOAuth("discord")}
            disabled={loading || Boolean(oauthLoading)}
          >
            {oauthLoading === "discord"
              ? `${t("auth.continueDiscord")}…`
              : t("auth.continueDiscord")}
          </Button>
          {message && <p className="text-sm text-ink-70">{message}</p>}
        </div>

        <p className="mt-6 text-sm text-ink-70">
          {t("auth.newHere")}{" "}
          <Link href="/register" className="font-semibold text-accent-600">
            {t("auth.createAccount")}
          </Link>
        </p>
      </div>
    </section>
  );
}
