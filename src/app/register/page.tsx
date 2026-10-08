"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { signInWithOAuthProvider } from "@/lib/auth/oauth";
import { LiveDot } from "@/components/ui/Badge";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "discord" | null>(
    null,
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = (await response.json()) as {
        error?: string;
        email?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create your account.");
      }

      const confirmedEmail = (data.email ?? email).trim().toLowerCase();
      router.push(
        `/confirm-email?email=${encodeURIComponent(confirmedEmail)}&message=${encodeURIComponent(
          "We sent a confirmation link from noreply@koina.space. Click it before signing in.",
        )}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create your account.",
      );
      setLoading(false);
    }
  }

  async function signInOAuth(provider: "google" | "discord") {
    setError(null);
    setMessage(null);
    setOauthLoading(provider);
    const { error: err } = await signInWithOAuthProvider(
      provider,
      "/onboarding",
    );
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
          {t("auth.joinSquad")}
        </p>
        <h1 className="mb-2 text-3xl">{t("auth.registerTitle")}</h1>
        <p className="mb-8 text-ink-70">{t("auth.registerLead")}</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="block text-sm font-medium">
            {t("auth.username")}
            <input
              type="text"
              required
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9_\-.]+"
              title="Letters, numbers, hyphens, dots, or underscores — no spaces"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.replace(/\s+/g, ""))
              }
              className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              autoComplete="username"
              spellCheck={false}
            />
          </label>
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
          {error && <p className="text-sm text-accent-600">{error}</p>}
          <Button
            type="submit"
            disabled={loading || Boolean(oauthLoading)}
          >
            {loading
              ? `${t("auth.createAccountCta")}…`
              : t("auth.createAccountCta")}
          </Button>
        </form>

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
          {t("auth.alreadyRegistered")}{" "}
          <Link href="/login" className="font-semibold text-accent-600">
            {t("auth.signInCta")}
          </Link>
        </p>
      </div>
    </section>
  );
}
