"use client";

import { HolodoriHeroTitle } from "@/components/holodori/HolodoriHeroTitle";
import { HolodoriName } from "@/components/holodori/HolodoriName";
import { HolodoriPlayingNow } from "@/components/holodori/HolodoriPlayingNow";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type {
  Game,
  HolodoriHeroLine,
  Session,
  SessionTitleSuggestion,
} from "@/lib/types";

const HOLODORI_URL = "https://www.hololive-dreams.com/en/";
const HOLODORI_SLUG = "holodori";

const systemKeys = [
  {
    number: "01",
    title: "holodori.rhythm" as const,
    desc: "holodori.rhythmDesc" as const,
  },
  {
    number: "02",
    title: "holodori.minigames" as const,
    desc: "holodori.minigamesDesc" as const,
  },
  {
    number: "03",
    title: "holodori.training" as const,
    desc: "holodori.trainingDesc" as const,
  },
];

const platforms = [
  { label: "iOS", detail: "App Store" },
  { label: "Android", detail: "Google Play" },
  { label: "PC", detail: "Steam" },
];

export function HolodoriPageContent({
  heroLines,
  holodoriGame,
  titleSuggestions,
  canSchedule,
  signedIn,
  playingSessions,
}: {
  heroLines: HolodoriHeroLine[];
  holodoriGame: Game[];
  titleSuggestions: SessionTitleSuggestion[];
  canSchedule: boolean;
  signedIn: boolean;
  playingSessions: Session[];
}) {
  const { t } = useLocale();
  const scheduleLoginHref = `/login?next=${encodeURIComponent("/sessions?create=true&game=holodori")}`;

  return (
    <div className="holodori-theme">
      <section className="relative overflow-hidden border-b border-ink-08">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 12% 18%, color-mix(in srgb, var(--holo-cyan) 30%, transparent), transparent 55%), radial-gradient(ellipse 70% 55% at 92% 78%, color-mix(in srgb, var(--holo-pink) 26%, transparent), transparent 52%), linear-gradient(180deg, var(--surface), var(--base))",
          }}
        />
        <div className="relative mx-auto grid min-h-[calc(100svh-170px)] max-w-[1180px] items-center gap-10 px-6 py-16 md:py-20 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-[540px]">
            <p className="mb-4 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] uppercase">
              <span className="holodori-gradient-text">
                {t("holodori.featured")}
              </span>
            </p>
            <p className="holodori-gradient-text mb-3 font-[family-name:var(--font-space-grotesk)] text-[clamp(42px,8vw,88px)] font-bold leading-[0.95] tracking-[-0.03em]">
              <HolodoriName uppercase />
            </p>
            <HolodoriHeroTitle lines={heroLines} />
            <p className="mb-8 max-w-[48ch] text-[17px] leading-7 text-ink-70">
              {t("holodori.lead")}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={HOLODORI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="holodori-cta"
              >
                {t("holodori.visitSite")}
              </a>
              {canSchedule ? (
                <CreateSessionModal
                  games={holodoriGame}
                  titleSuggestions={titleSuggestions}
                  defaultGameSlug={HOLODORI_SLUG}
                  triggerLabel={t("holodori.schedule")}
                  triggerClassName="holodori-cta-outline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : (
                <a
                  href={
                    signedIn
                      ? "/sessions?create=true&game=holodori"
                      : scheduleLoginHref
                  }
                  className="holodori-cta-outline"
                >
                  {t("holodori.schedule")}
                </a>
              )}
              <a href="/sessions?game=holodori" className="holodori-cta-outline">
                {t("holodori.browseSessions")}
              </a>
            </div>
          </div>

          <div className="flex w-full justify-center lg:h-full lg:items-center lg:justify-center">
            <div className="w-full max-w-[min(100%,360px)] rounded-[22px] bg-white p-3 shadow-[0_18px_50px_rgba(20,16,40,0.14)]">
              <div className="aspect-square overflow-hidden rounded-[14px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/games/holodori-hero.png"
                  alt="Hololive Dreams promotional art"
                  className="h-full w-full object-cover"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <HolodoriPlayingNow sessions={playingSessions} />

      <section className="border-b border-ink-08 bg-surface py-16">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] uppercase">
                <span className="holodori-gradient-text">
                  {t("holodori.howPlay")}
                </span>
              </p>
              <h2 className="text-[28px]">{t("holodori.howPlayTitle")}</h2>
            </div>
            <p className="max-w-[42ch] text-sm text-ink-70">
              {t("holodori.howPlayLead")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {systemKeys.map((system) => (
              <article
                key={system.number}
                className="holodori-gradient-border rounded-[8px] bg-base p-6"
              >
                <span className="holodori-gradient-text font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold">
                  {system.number}
                </span>
                <h3 className="mt-6 mb-2 text-xl">{t(system.title)}</h3>
                <p className="m-0 text-sm leading-6 text-ink-70">
                  {t(system.desc)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#15151a] py-16 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 0% 50%, color-mix(in srgb, var(--holo-cyan) 24%, transparent), transparent 60%), radial-gradient(ellipse 55% 45% at 100% 40%, color-mix(in srgb, var(--holo-pink) 22%, transparent), transparent 58%)",
          }}
        />
        <div className="relative mx-auto max-w-[1180px] px-6">
          <div className="mb-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="mb-3 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] uppercase">
                <span className="holodori-gradient-text">
                  {t("holodori.available")}
                </span>
              </p>
              <h2 className="mb-4 text-[clamp(28px,3.5vw,40px)] leading-[1.1]">
                {t("holodori.jumpIn")}
              </h2>
              <p className="mb-6 max-w-[48ch] text-[15px] leading-7 text-[#b8b8bc]">
                {t("holodori.jumpInLead")}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={HOLODORI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="holodori-cta"
                >
                  {t("holodori.visitSite")}
                </a>
                <a href="/sessions?game=holodori" className="holodori-cta-outline">
                  {t("holodori.browseSessions")}
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              {platforms.map((platform) => (
                <div
                  key={platform.label}
                  className="rounded-[8px] border border-white/10 bg-white/[0.04] px-5 py-4"
                >
                  <div className="holodori-gradient-text font-[family-name:var(--font-space-grotesk)] text-lg font-bold">
                    {platform.label}
                  </div>
                  <div className="mt-1 text-sm text-[#b8b8bc]">
                    {platform.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-[#8a8a8c]">{t("holodori.disclaimer")}</p>
        </div>
      </section>
    </div>
  );
}
