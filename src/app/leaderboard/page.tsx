import { redirect } from "next/navigation";

/** Leaderboard now lives on the Games page. */
export default function LeaderboardPage() {
  redirect("/games");
}
