"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { gameCardImage } from "@/lib/games/images";
import { sessionCreatorLabel } from "@/components/sessions/SessionCard";
import type { Session } from "@/lib/types";

function CompactSessionCard({ session }: { session: Session }) {
  const { t, locale } = useLocale();
  const image = gameCardImage(session.game?.slug);
  const when = new Date(session.starts_at).toLocaleString(locale, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/sessions?session=${encodeURIComponent(session.id)}`}
      className="group flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[6px] border border-ink-15 bg-base no-underline transition-[border-color,box-shadow] duration-300 hover:border-accent-500 hover:shadow-[0_0_0_1px_var(--accent-500)]"
    >
      <div className="relative h-[72px] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="240px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
            style={{
              background:
                "repeating-linear-gradient(135deg, color-mix(in srgb, var(--holo-cyan) 28%, white) 0 12px, color-mix(in srgb, var(--holo-pink) 22%, white) 12px 24px)",
            }}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 font-[family-name:var(--font-space-grotesk)] text-sm font-bold leading-snug text-ink">
          {session.title}
        </div>
        <p className="m-0 text-[11px] text-ink-40">
          {sessionCreatorLabel(session, t("sessions.unknownCreator"))}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 font-[family-name:var(--font-ibm-plex-mono)] text-[10px] tracking-[0.02em] text-ink-40">
          <span>{when}</span>
          <span>
            {session.registered_count}/{session.capacity}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Build one marquee half wide enough to fill the clip box, then duplicate for a seamless -50% loop. */
function buildMarqueeLoop(sessions: Session[]) {
  const half: Session[] = [];
  while (half.length < Math.max(sessions.length, 6)) {
    half.push(...sessions);
  }
  return [...half, ...half];
}

export function HolodoriPlayingNow({ sessions }: { sessions: Session[] }) {
  const { t } = useLocale();

  if (!sessions.length) {
    return (
      <section className="border-b border-ink-08 py-12">
        <div className="mx-auto max-w-[1180px] px-6">
          <p className="mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] uppercase">
            <span className="holodori-gradient-text">
              {t("holodori.playingNow")}
            </span>
          </p>
          <h2 className="mb-3 text-[28px]">{t("holodori.playingNowTitle")}</h2>
          <p className="m-0 max-w-[52ch] text-sm text-ink-70">
            {t("holodori.playingNowEmpty")}{" "}
            <Link
              href="/sessions?create=true&game=holodori"
              className="font-semibold text-accent-600 no-underline hover:text-accent-700"
            >
              {t("holodori.schedule")}
            </Link>
          </p>
        </div>
      </section>
    );
  }

  const loop = buildMarqueeLoop(sessions);

  return (
    <section className="border-b border-ink-08 py-12">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] uppercase">
              <span className="holodori-gradient-text">
                {t("holodori.playingNow")}
              </span>
            </p>
            <h2 className="text-[28px]">{t("holodori.playingNowTitle")}</h2>
          </div>
          <Link
            href="/sessions?game=holodori"
            className="whitespace-nowrap text-[13px] font-semibold text-accent-600 no-underline hover:text-accent-700"
          >
            {t("holodori.browseSessions")}
          </Link>
        </div>

        <div className="overflow-hidden rounded-[6px] border border-ink-08">
          <div className="holodori-session-marquee flex w-max gap-3 py-3">
            {loop.map((session, index) => (
              <CompactSessionCard
                key={`${session.id}-${index}`}
                session={session}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
