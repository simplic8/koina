import type { Metadata } from "next";
import { HolodoriPageContent } from "@/components/holodori/HolodoriPageContent";
import {
  getCurrentProfile,
  getHolodoriHeroLines,
  getPublishedGames,
  getSessionTitleSuggestions,
  getUpcomingSessionsByGameSlug,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Holodori — Hololive Dreams | JustVibing",
  description:
    "Discover Hololive Dreams (Holodori): a free-to-play rhythm & RPG where you clear songs, train holomems, and expand the dream park.",
};

const HOLODORI_SLUG = "holodori";

export default async function HolodoriPage() {
  const [profile, games, titleSuggestions, heroLines, playingSessions] =
    await Promise.all([
      getCurrentProfile(),
      getPublishedGames(),
      getSessionTitleSuggestions(),
      getHolodoriHeroLines(),
      getUpcomingSessionsByGameSlug(HOLODORI_SLUG),
    ]);

  const holodoriGame = games.filter((game) => game.slug === HOLODORI_SLUG);
  const canSchedule = Boolean(profile) && holodoriGame.length > 0;

  return (
    <HolodoriPageContent
      heroLines={heroLines}
      holodoriGame={holodoriGame}
      titleSuggestions={titleSuggestions}
      canSchedule={canSchedule}
      signedIn={Boolean(profile)}
      playingSessions={playingSessions}
    />
  );
}
