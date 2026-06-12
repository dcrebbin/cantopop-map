import { createFileRoute } from "@tanstack/react-router";
import LeaderboardPage from "./components/leaderboard-page";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Contributor Leaderboard | Cantopop Map 粵語歌地圖" },
      {
        name: "description",
        content:
          "Browse Cantopop Map contributors ranked by song and music video credits across Hong Kong filming locations.",
      },
      { property: "og:title", content: "Contributor Leaderboard | Cantopop Map 粵語歌地圖" },
      {
        property: "og:description",
        content:
          "See who contributed the most song and music video credits across Hong Kong Cantopop filming locations.",
      },
      { property: "og:url", content: "/leaderboard" },
    ],
    links: [{ rel: "canonical", href: "/leaderboard" }],
  }),
  component: Page,
});

function Page() {
  return <LeaderboardPage />;
}
