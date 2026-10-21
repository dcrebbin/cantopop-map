import { createFileRoute } from "@tanstack/react-router";
import DynamicHomePage from "./components/dynamic-home-page";
import { HomePageJsonLd } from "./components/JsonLd";
import { LOCATIONS } from "./common/lib";
import { ARTIST_INDEX, absoluteUrl, artistPath } from "./common/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Page,
});

// The map itself only renders in the browser, so give crawlers and screen
// readers a text summary with links into the server-rendered pages.
function SiteSummary() {
  return (
    <section className="sr-only">
      <h1>Cantopop Map 粵語歌地圖</h1>
      <p>
        Cantopop Map is a community-curated map of {LOCATIONS.length} Hong Kong
        and Cantonese pop music videos and the real places they were filmed,
        with street view, the music video, and full song and video credits for
        each location.
      </p>
      <p>
        <a href="/browse">Browse every song, artist and credited person</a>
      </p>
      <h2>Artists</h2>
      <ul>
        {[...ARTIST_INDEX.values()].map((artist) => (
          <li key={artist.slug}>
            <a href={artistPath(artist.name)}>{artist.name}</a>
          </li>
        ))}
      </ul>
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
