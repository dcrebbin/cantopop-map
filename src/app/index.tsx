import { createFileRoute } from "@tanstack/react-router";
import DynamicHomePage from "./components/dynamic-home-page";
import { HomePageJsonLd } from "./components/JsonLd";
import { LOCATIONS } from "./common/lib";
import { absoluteUrl } from "./common/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Page,
});

// Keep context in the server-rendered HTML without adding a panel over the map.
function SiteSummary() {
  return (
    <section className="sr-only focus-within:not-sr-only">
      <h1 className="font-semibold">粵語歌地圖 · Cantopop Map</h1>
      <p className="mt-1">
        廣東歌 MV 喺邊度拍？探索 {LOCATIONS.length}{" "}
        首歌曲的香港及海外拍攝地點與製作名單。
      </p>
      <p>
        <a href="/browse" className="mt-2 inline-block font-semibold underline">
          瀏覽歌曲及取景地 · Browse locations
        </a>
      </p>
      <p lang="en" className="mt-2">
        A community-curated map of Cantonese pop music video filming locations,
        with street views, video links and song and video credits.
      </p>
      <p className="mt-2">
        想搵某位歌手的 MV
        取景地、歌曲作曲填詞人或音樂錄像導演？歌曲目錄提供歌手、拍攝地點與幕後團隊的連結。
      </p>
    </section>
  );
}

function Page() {
  return (
    <>
      <HomePageJsonLd />
      <SiteSummary />
      <DynamicHomePage />
    </>
  );
}
