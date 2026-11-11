"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LiveDot } from "@/components/ui/Badge";
import { useLocale } from "@/components/i18n/LocaleProvider";

export default function ConfirmEmailPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("email");
    const fromError = params.get("error");
    const fromMessage = params.get("message");
    if (fromQuery) setEmail(fromQuery);
    if (fromError) setError(fromError);
    if (fromMessage) {
      setMessage(fromMessage);
    } else if (fromQuery && !fromError) {
      setSentTo(fromQuery);
    }
  }, []);

  // Derived so the default notice follows the locale (it resolves after mount)
  const shownMessage = message ?? (sentTo ? t("confirm.sentTo", { email: sentTo }) : null);

  async function onResend(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSentTo(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError(t("confirm.enterEmail"));
      return;
    }

    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        alreadyConfirmed?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.error ?? t("confirm.resendFailed"));
      }
      setMessage(data.message ?? t("confirm.resendDefault"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("confirm.resendFailed"),
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-md px-6">
        <p className="mb-3.5 flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
          <LiveDot />
          {t("confirm.eyebrow")}
        </p>
        <h1 className="mb-2 text-3xl">{t("confirm.title")}</h1>
        <p className="mb-8 text-ink-70">{t("confirm.lead")}</p>

        <form onSubmit={onResend} className="flex flex-col gap-4">
          <label className="block text-sm font-medium">
            {t("confirm.email")}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              autoComplete="email"
            />
          </label>
          {error && <p className="text-sm text-accent-600">{error}</p>}
          {shownMessage && <p className="text-sm text-ink-70">{shownMessage}</p>}
          <Button type="submit" disabled={resending}>
            {resending ? t("confirm.sending") : t("confirm.resend")}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-70">
          {t("confirm.already")}{" "}
          <Link href="/login" className="font-semibold text-accent-600">
            {t("confirm.signIn")}
          </Link>
        </p>
      </div>
    </section>
  );
}
