"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizeGame } from "@/lib/i18n/content";
import { GAME_CARD_IMAGES } from "@/lib/games/images";
import type { Game } from "@/lib/types";

const EXTERNAL_PLAY_URLS: Record<string, string> = {
  holodori: "https://www.hololive-dreams.com/en/",
};

function playHref(game: Game) {
  if (game.roblox_place_id) {
    return `https://www.roblox.com/games/${game.roblox_place_id}/${game.slug}`;
  }
  if (EXTERNAL_PLAY_URLS[game.slug]) return EXTERNAL_PLAY_URLS[game.slug];
  if (game.slug === "holodori") return "/holodori";
  return "/leaderboard";
}

export function GamesSection({
  games,
  showBrowseAll = true,
}: {
  games: Game[];
  showBrowseAll?: boolean;
}) {
  const { t, locale } = useLocale();
  const holodoriLabel = t("nav.holodori");
  const featured = games.filter((g) => g.is_featured).slice(0, 3);
  const list = showBrowseAll
    ? featured.length
      ? featured
      : games.slice(0, 3)
    : games;

  function platformBadge(game: Game) {
    if (game.slug === "holodori") return holodoriLabel;
    if (game.platform === "roblox") return t("common.roblox");
    if (game.platform === "external") return t("common.external");
    return game.platform.charAt(0).toUpperCase() + game.platform.slice(1);
  }

  function playLabel(game: Game) {
    if (game.roblox_place_id) return t("games.playRoblox");
    if (EXTERNAL_PLAY_URLS[game.slug] || game.platform === "external") {
      return t("games.visitSite");
    }
    return t("games.viewLeaderboard");
  }

  return (
    <section
      id="games"
      className="border-y border-ink-08 bg-surface py-16"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[28px]">
            {showBrowseAll ? t("games.featured") : t("games.all")}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/games#leaderboard"
              className="whitespace-nowrap text-[13px] font-semibold text-accent-600 no-underline"
            >
              {t("games.leaderboardLink")}
            </Link>
            {showBrowseAll && (
              <Link
                href="/games"
                className="whitespace-nowrap text-[13px] font-semibold text-accent-600 no-underline"
              >
                {t("games.browseAll")}
              </Link>
            )}
          </div>
        </div>
        <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {list.map((game) => {
            const image = GAME_CARD_IMAGES[game.slug];
            const localized = localizeGame(game, locale);
            const title =
              game.slug === "holodori" ? holodoriLabel : localized.title;

            return (
              <div
                key={game.id}
                className="group overflow-hidden rounded-[6px] border border-ink-15 bg-base transition-[border-color,box-shadow] duration-300 hover:border-accent-500 hover:shadow-[0_0_0_1px_var(--accent-500)]"
              >
                {image ? (
                  <div className="relative h-[130px] overflow-hidden">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="relative h-[130px] overflow-hidden">
                    <div
                      className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
                      style={{
                        background:
                          "repeating-linear-gradient(135deg, var(--accent-100) 0 14px, var(--accent-50) 14px 28px)",
                      }}
                    />
                  </div>
                )}
                <div className="p-[18px]">
                  <Badge tone="vetted">{platformBadge(game)}</Badge>
                  <div className="mt-1.5 mb-2 font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold">
                    {title}
                  </div>
                  <p className="mb-3.5 text-[13.5px] text-ink-70">
                    {localized.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button href={playHref(game)} variant="outline" size="sm">
                      {playLabel(game)}
                    </Button>
                    {game.platform === "roblox" && (
                      <Button
                        href="/games#leaderboard"
                        variant="outline"
                        size="sm"
                      >
                        {t("games.leaderboardLink")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
