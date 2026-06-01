import type { Metadata } from "next";
import LeaderboardPage from "../components/leaderboard-page";

export const metadata: Metadata = {
  title: "Contributor Leaderboard | Cantopop Map 粵語歌地圖",
  description:
    "Browse Cantopop Map contributors ranked by song and music video credits across Hong Kong filming locations.",
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    title: "Contributor Leaderboard | Cantopop Map 粵語歌地圖",
    description:
      "See who contributed the most song and music video credits across Hong Kong Cantopop filming locations.",
    url: "/leaderboard",
  },
};

export default function Page() {
  return <LeaderboardPage />;
}
