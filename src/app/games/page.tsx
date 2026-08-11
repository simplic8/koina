import { GamesSection } from "@/components/landing/GamesSection";
import { LeaderboardSection } from "@/components/landing/LeaderboardSection";
import { PageIntro } from "@/components/i18n/T";
import { getLeaderboard, getPublishedGames } from "@/lib/data";

export default async function GamesPage() {
  const [games, scores] = await Promise.all([
    getPublishedGames(),
    getLeaderboard(50),
  ]);

  return (
    <div className="py-10">
      <div className="mx-auto max-w-[1180px] px-6">
        <PageIntro titleKey="games.pageTitle" leadKey="games.pageLead" />
      </div>
      <GamesSection games={games} showBrowseAll={false} />
      <LeaderboardSection scores={scores} embedded />
    </div>
  );
}
