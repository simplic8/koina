"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function InboxNavLink() {
  const { t } = useLocale();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/inbox/unread");
        if (!response.ok) return;
        const payload = (await response.json()) as { unread?: number };
        if (!cancelled) setUnread(Number(payload.unread ?? 0));
      } catch {
        // Ignore badge errors.
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    function onFocus() {
      void load();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <Link
      href="/inbox"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-ink-15 text-ink-70 no-underline transition-colors hover:border-ink hover:text-ink"
      aria-label={
        unread > 0 ? `${t("nav.inbox")} (${unread})` : t("nav.inbox")
      }
      title={t("nav.inbox")}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M2.5 4.25h11a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-.75.75h-11a.75.75 0 0 1-.75-.75V5a.75.75 0 0 1 .75-.75Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="m2.1 4.7 5.35 3.55a1 1 0 0 0 1.1 0L13.9 4.7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {unread > 0 ? (
        <span className="absolute -top-1 -right-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold leading-4 text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
