import { createFileRoute, notFound } from "@tanstack/react-router";
import { JsonLdScript } from "~/app/components/JsonLd";
import { DirectoryPage, LocationList } from "~/app/components/directory-page";
import {
  ARTIST_INDEX,
  absoluteUrl,
  artistJsonLd,
  artistPath,
  locationPath,
} from "~/app/common/seo";

function getArtist(slug: string) {
  return ARTIST_INDEX.get(slug);
}

function describeArtist(name: string, count: number) {
  return `${count} ${count === 1 ? "music video" : "music videos"} by ${name} mapped to their real filming locations on Cantopop Map 粵語歌地圖.`;
}

export const Route = createFileRoute("/artists/$slug")({
  beforeLoad: ({ params }) => {
    if (!getArtist(params.slug)) notFound({ throw: true });
  },
  head: ({ params }) => {
    const artist = getArtist(params.slug);
    if (!artist) return {};
    const title = `${artist.name} MV 拍攝地點及取景地 | Cantopop Map 粵語歌地圖`;
    const description = `想知 ${artist.name} 的 MV 喺邊度拍？瀏覽 ${artist.locations.length} 首歌曲的收錄拍攝地點、音樂錄像及製作名單，包括${artist.locations
      .slice(0, 5)
      .map((location) => location.name)
      .join("、")}。Explore ${artist.name} music video filming locations.`;
    const url = absoluteUrl(artistPath(artist.name));
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { property: "og:image", content: artist.locations[0]?.image ?? "" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const artist = getArtist(slug);
  if (!artist) return null;

  const pageUrl = absoluteUrl(artistPath(artist.name));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...artistJsonLd(artist.name),
        track: artist.locations.map((location) => ({
          "@type": "MusicRecording",
          "@id": `${absoluteUrl(locationPath(location))}#song`,
          name: location.name,
          url: absoluteUrl(locationPath(location)),
        })),
      },
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${artist.name} music video filming locations`,
        inLanguage: ["zh-Hant-HK", "en"],
        about: { "@id": `${pageUrl}#artist` },
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Cantopop Map",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Browse",
            item: absoluteUrl("/browse"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: artist.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <DirectoryPage
      title={`${artist.name} MV 拍攝地點`}
      intro={
        <>
          <p>
            {artist.name} 的 MV 喺邊度拍？本站收錄 {artist.locations.length}{" "}
            首歌曲的音樂錄像、取景地及幕後製作名單。選擇歌曲查看詳細地址、街景及影片。
          </p>
          <p lang="en" className="mt-2">
            {describeArtist(artist.name, artist.locations.length)}
          </p>
        </>
      }
    >
      <JsonLdScript data={jsonLd} />
      <LocationList locations={artist.locations} />
    </DirectoryPage>
  );
}
