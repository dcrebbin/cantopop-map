import { createFileRoute, notFound } from "@tanstack/react-router";
import { JsonLdScript } from "~/app/components/JsonLd";
import { DirectoryPage, LocationList } from "~/app/components/directory-page";
import {
  PEOPLE_INDEX,
  absoluteUrl,
  instagramUrl,
  locationPath,
  personJsonLd,
  personPath,
  type PersonEntry,
} from "~/app/common/seo";

function getPerson(slug: string) {
  return PEOPLE_INDEX.get(decodeURIComponent(slug));
}

function uniqueRoles(person: PersonEntry) {
  return [...new Set(person.credits.map((credit) => credit.role))];
}

function uniqueLocations(person: PersonEntry) {
  return [
    ...new Map(
      person.credits.map((credit) => [credit.location.id, credit.location]),
    ).values(),
  ];
}

function describePerson(person: PersonEntry) {
  const locations = uniqueLocations(person);
  const artists = [
    ...new Set(locations.flatMap((location) => location.artists)),
  ];
  const count = locations.length;
  return `${person.name} is credited as ${uniqueRoles(person).join(", ")} on ${count} Cantopop ${count === 1 ? "song or music video" : "songs and music videos"}, working with ${artists.slice(0, 8).join(", ")}${artists.length > 8 ? " and others" : ""}.`;
}

export const Route = createFileRoute("/people/$slug")({
  head: ({ params }) => {
    const person = getPerson(params.slug);
    if (!person) return {};
    const title = `${person.name}: ${uniqueRoles(person).slice(0, 3).join(", ")} credits | Cantopop Map 粵語歌地圖`;
    const description = describePerson(person);
    const url = absoluteUrl(personPath(person.name));
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PersonPage,
});

function PersonPage() {
  const { slug } = Route.useParams();
  const person = getPerson(slug);
  if (!person) throw notFound();

  const pageUrl = absoluteUrl(personPath(person.name));
  const roles = uniqueRoles(person);
  const locations = uniqueLocations(person);
  const instagram = instagramUrl(person.instagram);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...personJsonLd(person.name, person.instagram),
        jobTitle: roles,
        description: describePerson(person),
      },
      {
        "@type": "ProfilePage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${person.name} credits`,
        mainEntity: { "@id": `${pageUrl}#person` },
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      },
      ...locations.map((location) => ({
        "@type": "CreativeWork",
        "@id": `${absoluteUrl(locationPath(location))}#song`,
        name: location.name,
        url: absoluteUrl(locationPath(location)),
        contributor: person.credits
          .filter((credit) => credit.location.id === location.id)
          .map((credit) => ({
            "@type": "Role",
            roleName: credit.role,
            contributor: { "@id": `${pageUrl}#person` },
          })),
      })),
    ],
  };

  return (
    <DirectoryPage
      title={`${person.name}: Cantopop credits`}
      intro={
        <>
          <p>{describePerson(person)}</p>
          {instagram ? (
            <p className="mt-1">
              Instagram:{" "}
              <a href={instagram} rel="noreferrer" className="underline">
                @{person.instagram}
              </a>
            </p>
          ) : null}
        </>
      }
    >
      <JsonLdScript data={jsonLd} />
      <LocationList
        locations={locations}
        note={(location) => {
          const credits = person.credits.filter(
            (credit) => credit.location.id === location.id,
          );
          return credits
            .map(
              (credit) =>
                `${credit.role} (${credit.category === "song" ? "song" : "music video"})`,
            )
            .join(", ");
        }}
      />
    </DirectoryPage>
  );
}
