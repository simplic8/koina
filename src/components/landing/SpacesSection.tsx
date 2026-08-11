"use client";

import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/i18n/LocaleProvider";

const SPACES = [
  {
    id: "justvibing",
    href: "https://justvibing.fun",
    title: "JustVibing.gg",
    accent: "#E85A32",
    gem: "#E85A32",
    bodyKey: "spaces.jvBody" as const,
    badgeKey: "spaces.jvBadge" as const,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect x="2" y="9" width="4.5" height="6" rx="2" fill="currentColor" />
        <rect x="9.75" y="3" width="4.5" height="18" rx="2" fill="currentColor" />
        <rect x="17.5" y="7" width="4.5" height="10" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "oshikatsu",
    href: "#",
    title: "OSHIKATSU",
    accent: "#E73C7E",
    gem: "#E73C7E",
    bodyKey: "spaces.oshiBody" as const,
    badgeKey: "spaces.oshiBadge" as const,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          fill="currentColor"
          d="M12 21s-6.7-4.35-9.33-8.1C.8 10.2 1.2 6.9 3.7 5.2c2-1.35 4.55-.85 6.05 1.05L12 8.2l2.25-1.95c1.5-1.9 4.05-2.4 6.05-1.05 2.5 1.7 2.9 5 1.03 7.7C18.7 16.65 12 21 12 21z"
        />
      </svg>
    ),
  },
  {
    id: "numa",
    href: "#",
    title: "NUMA",
    accent: "#29C194",
    gem: "#29C194",
    bodyKey: "spaces.numaBody" as const,
    badgeKey: "spaces.numaBadge" as const,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M3 14c2.5-1 4-3.5 4-6M21 14c-2.5-1-4-3.5-4-6M7 18c1.5-2 3.5-3 5-3s3.5 1 5 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="8" cy="9" r="2" fill="currentColor" />
        <circle cx="16" cy="9" r="2" fill="currentColor" />
      </svg>
    ),
  },
] as const;

export function SpacesSection() {
  const { t } = useLocale();

  return (
    <section id="spaces" className="border-y border-ink-08 bg-surface py-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
              {t("spaces.eyebrow")}
            </p>
            <h2 className="text-[28px]">{t("spaces.title")}</h2>
          </div>
          <p className="max-w-[42ch] text-[15px] text-ink-70">{t("spaces.lead")}</p>
        </div>

        <div className="grid gap-[22px] lg:grid-cols-3">
          {SPACES.map((space, i) => (
            <article
              key={space.id}
              className="group relative overflow-hidden rounded-[6px] border border-ink-15 bg-base transition-[border-color,transform] duration-300 hover:-translate-y-0.5"
              style={{ borderColor: undefined }}
            >
              <span
                aria-hidden
                className="absolute top-4 right-4 h-3 w-3 rotate-45"
                style={{ background: space.gem }}
              />
              <div
                className="flex items-center gap-3 px-5 py-4 text-white"
                style={{ background: space.accent }}
              >
                <span className="opacity-95">{space.icon}</span>
                <span className="font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold tracking-wide">
                  {space.title}
                </span>
              </div>
              <div className="p-5">
                <p className="mb-1 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-ink-40 uppercase">
                  {t(space.badgeKey)}
                </p>
                <p className="mb-4 text-[14px] leading-6 text-ink-70">
                  {t(space.bodyKey)}
                </p>
                <Button
                  href={space.href}
                  variant="outline"
                  size="sm"
                  className={i === 0 ? undefined : "pointer-events-none opacity-60"}
                >
                  {i === 0 ? t("spaces.visit") : t("spaces.comingSoon")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
