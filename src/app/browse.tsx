import { createFileRoute } from "@tanstack/react-router";
import { JsonLdScript } from "~/app/components/JsonLd";
import { DirectoryPage } from "~/app/components/directory-page";
import { LOCATIONS } from "~/app/common/lib";
import {
  ARTIST_INDEX,
  PEOPLE_INDEX,
  absoluteUrl,
  artistPath,
  locationPath,
  personPath,
} from "~/app/common/seo";

const title =
  "Browse every Cantopop music video location | Cantopop Map 粵語歌地圖";
const description = `A full directory of ${LOCATIONS.length} Cantopop music videos, ${ARTIST_INDEX.size} artists and ${PEOPLE_INDEX.size} credited crew, with the real places each video was filmed.`;

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: absoluteUrl("/browse") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/browse") }],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const artists = [...ARTIST_INDEX.values()];
  const people = [...PEOPLE_INDEX.values()];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absoluteUrl("/browse"),
    url: absoluteUrl("/browse"),
    name: "Browse Cantopop music video locations",
    description,
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: LOCATIONS.length,
      itemListElement: LOCATIONS.map((location, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(locationPath(location)),
        name: `${location.artists.join(", ")} - ${location.name}`,
      })),
    },
  };

  return (
    <DirectoryPage
      title="Browse Cantopop music video locations"
      intro={<p>{description}</p>}
    >
      <JsonLdScript data={jsonLd} />
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Artists</h2>
        <ul className="flex flex-col gap-4">
          {artists.map((artist) => (
            <li key={artist.slug}>
              <h3 className="font-semibold">
                <a href={artistPath(artist.name)} className="underline">
                  {artist.name}
                </a>
              </h3>
              <ul className="ml-4 list-disc text-sm">
                {artist.locations.map((location) => (
                  <li key={location.id}>
                    <a href={locationPath(location)} className="underline">
                      {location.name}
                    </a>
                    {location.address ? ` filmed at ${location.address}` : ""}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Credited people</h2>
        <ul className="flex flex-row flex-wrap gap-x-3 gap-y-1 text-sm">
          {people.map((person) => (
            <li key={person.slug}>
              <a href={personPath(person.name)} className="underline">
                {person.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </DirectoryPage>
  );
}
