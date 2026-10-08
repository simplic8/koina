"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./theme/ThemeToggle";
import { LanguageSelect } from "./i18n/LanguageSelect";
import { useLocale } from "./i18n/LocaleProvider";
import { Button } from "./ui/Button";
import { AvatarImage } from "./ui/AvatarImage";
import { InboxNavLink } from "./inbox/InboxNavLink";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isAdminProfile } from "@/lib/auth/is-admin";

export function SiteHeader({ profile }: { profile: Profile | null }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const links = [
    { href: "/#spaces", label: t("nav.spaces") },
    { href: "/#ethos", label: t("nav.ethos") },
    { href: "/#about", label: t("nav.about") },
    {
      href: "/vibe-code",
      label: t("nav.vibeCode"),
      accent: "vibeCode" as const,
      isNew: true,
    },
    { href: "/forum", label: t("nav.forum") },
  ];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (menuButtonRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink-08 bg-header backdrop-blur-[8px]">
      <nav className="relative mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-[family-name:var(--font-space-grotesk)] text-[19px] font-bold no-underline"
        >
          <BrandMark withGems className="h-[28px] w-[28px]" />
          KOINA
        </Link>

        <ul
          ref={menuRef}
          className={`m-0 list-none gap-8 p-0 text-sm font-medium max-[860px]:absolute max-[860px]:top-[68px] max-[860px]:right-0 max-[860px]:left-0 max-[860px]:flex-col max-[860px]:gap-0 max-[860px]:border-b max-[860px]:border-ink-08 max-[860px]:bg-base max-[860px]:px-6 max-[860px]:py-2 ${
            open ? "flex" : "hidden min-[861px]:flex"
          }`}
        >
          {links.map((l) => {
            const isVibeCode = "accent" in l && l.accent === "vibeCode";
            const isNew = "isNew" in l && Boolean(l.isNew);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`no-underline max-[860px]:block max-[860px]:border-b max-[860px]:border-ink-08 max-[860px]:py-3 ${
                    isVibeCode
                      ? "inline-block origin-left font-semibold transition-transform duration-200 hover:scale-110"
                      : "text-ink-70 hover:text-ink"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span className="relative inline-block">
                    <span
                      className={
                        isVibeCode ? "vibe-code-gradient-text" : undefined
                      }
                    >
                      {l.label}
                    </span>
                    {isNew ? (
                      <span className="animate-new-badge pointer-events-none absolute right-0 bottom-0 translate-x-[55%] translate-y-[35%] rounded-[3px] bg-[#e11d48] px-1 py-[1px] font-[family-name:var(--font-ibm-plex-mono)] text-[8px] font-semibold leading-none tracking-[0.04em] text-white uppercase">
                        {t("nav.new")}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
          {isAdminProfile(profile) && (
            <li>
              <Link
                href="/admin"
                className="text-accent-600 no-underline hover:text-accent-700 max-[860px]:block max-[860px]:border-b max-[860px]:border-ink-08 max-[860px]:py-3"
                onClick={() => setOpen(false)}
              >
                {t("nav.admin")}
              </Link>
            </li>
          )}
          {!profile && (
            <>
              <li className="min-[861px]:hidden">
                <Link
                  href="/login"
                  className="block border-b border-ink-08 py-3 text-ink-70 no-underline hover:text-accent-500"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.signIn")}
                </Link>
              </li>
              <li className="min-[861px]:hidden">
                <Link
                  href="/register"
                  className="block py-3 text-ink-70 no-underline hover:text-accent-500"
                  onClick={() => setOpen(false)}
                >
                  {t("nav.register")}
                </Link>
              </li>
            </>
          )}
          {profile && (
            <li className="min-[861px]:hidden">
              <button
                type="button"
                onClick={signOut}
                className="block w-full cursor-pointer border-0 bg-transparent py-3 text-left text-sm font-medium text-ink-70 hover:text-accent-500"
              >
                {t("nav.signOut")}
              </button>
            </li>
          )}
        </ul>

        <div className="flex items-center gap-2.5">
          <LanguageSelect compact />
          <ThemeToggle />
          {profile ? (
            <>
              <InboxNavLink />
              <Link
                href="/profile"
                className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-[6px] border border-ink-15 text-ink-70 no-underline transition-colors hover:border-ink hover:text-ink"
                aria-label={`${t("nav.profile")}${
                  profile.display_name || profile.username
                    ? `: ${profile.display_name || profile.username}`
                    : ""
                }`}
                title={
                  profile.display_name ||
                  profile.username ||
                  t("nav.profile")
                }
              >
                <AvatarImage
                  src={profile.avatar_url}
                  className="h-full w-full object-cover"
                  fallback={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <circle
                        cx="8"
                        cy="5.5"
                        r="2.75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M3.25 13.25c.7-2.2 2.35-3.25 4.75-3.25s4.05 1.05 4.75 3.25"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                />
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="max-[860px]:hidden"
              >
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <>
              <Button
                href="/login"
                variant="outline"
                size="sm"
                className="max-[860px]:hidden"
              >
                {t("nav.signIn")}
              </Button>
              <Button
                href="/register"
                size="sm"
                className="max-[860px]:hidden"
              >
                {t("nav.register")}
              </Button>
            </>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            className="border-0 bg-transparent p-1.5 min-[861px]:hidden"
            aria-label={t("nav.menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="my-1 block h-0.5 w-[22px] bg-ink" />
            <span className="my-1 block h-0.5 w-[22px] bg-ink" />
            <span className="my-1 block h-0.5 w-[22px] bg-ink" />
          </button>
        </div>
      </nav>
    </header>
  );
}
