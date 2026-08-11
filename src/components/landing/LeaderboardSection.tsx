"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizeGame } from "@/lib/i18n/content";
import type { Score } from "@/lib/types";

function formatScore(n: number, locale: string) {
  return n.toLocaleString(locale);
}

export function LeaderboardSection({
  scores,
  embedded = false,
}: {
  scores: Score[];
  embedded?: boolean;
}) {
  const { t, locale } = useLocale();
  const allGamesKey = "__all__";

  const gameOptions = useMemo(() => {
    const bySlug = new Map<string, string>();
    for (const score of scores) {
      const slug = score.game?.slug;
      if (!slug || bySlug.has(slug)) continue;
      bySlug.set(slug, localizeGame(score.game, locale).title);
    }
    return [
      { key: allGamesKey, label: t("lb.allGames") },
      ...Array.from(bySlug.entries()).map(([key, label]) => ({ key, label })),
    ];
  }, [scores, locale, t]);

  const [filter, setFilter] = useState(allGamesKey);
  const activeFilter = gameOptions.some((option) => option.key === filter)
    ? filter
    : allGamesKey;

  const rows = scores
    .filter(
      (score) =>
        activeFilter === allGamesKey || score.game?.slug === activeFilter,
    )
    .slice(0, embedded ? 12 : 8);

  return (
    <section
      id="leaderboard"
      className={embedded ? "border-t border-ink-08 py-16" : "py-16"}
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[28px]">
            {embedded ? t("lb.title") : t("lb.global")}
          </h2>
          {!embedded && (
            <Link
              href="/games#leaderboard"
              className="whitespace-nowrap text-[13px] font-semibold text-accent-600 no-underline"
            >
              {t("lb.viewInGames")}
            </Link>
          )}
        </div>
        <div className="mb-[22px] flex flex-wrap gap-2">
          {gameOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`cursor-pointer rounded-full border px-3.5 py-[7px] text-[12.5px] font-semibold ${
                activeFilter === option.key
                  ? "border-ink bg-inverse text-on-inverse"
                  : "border-ink-15 bg-base text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="rounded-[6px] border border-ink-08 bg-surface px-[18px] py-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-11 border-b border-ink-15 pb-3 text-left font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-ink-40 uppercase">
                  {t("lb.rank")}
                </th>
                <th className="border-b border-ink-15 pb-3 text-left font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-ink-40 uppercase">
                  {t("lb.player")}
                </th>
                <th className="border-b border-ink-15 pb-3 text-left font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-ink-40 uppercase">
                  {t("lb.game")}
                </th>
                <th className="border-b border-ink-15 pb-3 text-right font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] text-ink-40 uppercase">
                  {t("lb.score")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-sm text-ink-40"
                  >
                    {t("lb.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id}>
                    <td className="border-b border-ink-08 py-3.5">
                      <div
                        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold text-on-inverse ${
                          i === 0 ? "bg-accent-500" : "bg-inverse"
                        }`}
                      >
                        {i + 1}
                      </div>
                    </td>
                    <td className="border-b border-ink-08 py-3.5 text-sm">
                      {row.display_name ??
                        row.roblox_entry_key ??
                        t("common.player")}
                    </td>
                    <td className="border-b border-ink-08 py-3.5 text-sm">
                      {row.game
                        ? localizeGame(row.game, locale).title
                        : "—"}
                    </td>
                    <td className="border-b border-ink-08 py-3.5 text-right font-[family-name:var(--font-ibm-plex-mono)] text-sm font-semibold">
                      {formatScore(row.score, locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
