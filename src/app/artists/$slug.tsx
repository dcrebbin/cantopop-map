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
  return ARTIST_INDEX.get(decodeURIComponent(slug));
}

function describeArtist(name: string, count: number) {
  return `${count} ${count === 1 ? "music video" : "music videos"} by ${name} mapped to their real filming locations on Cantopop Map 粵語歌地圖.`;
}

export const Route = createFileRoute("/artists/$slug")({
  head: ({ params }) => {
    const artist = getArtist(params.slug);
    if (!artist) return {};
    const title = `${artist.name} music video filming locations | Cantopop Map 粵語歌地圖`;
    const description = `${describeArtist(artist.name, artist.locations.length)} Includes ${artist.locations
      .slice(0, 5)
      .map((location) => location.name)
      .join(", ")}.`;
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
  if (!artist) throw notFound();

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
      title={`${artist.name}: music video filming locations`}
      intro={<p>{describeArtist(artist.name, artist.locations.length)}</p>}
    >
      <JsonLdScript data={jsonLd} />
      <LocationList locations={artist.locations} />
    </DirectoryPage>
  );
}
