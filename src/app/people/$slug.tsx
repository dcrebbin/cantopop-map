import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { JsonLdScript } from "~/app/components/JsonLd";
import { DirectoryPage, LocationList } from "~/app/components/directory-page";
import {
  getPersonEntry,
  absoluteUrl,
  instagramUrl,
  locationPath,
  personJsonLd,
  personPath,
  roleLabelZh,
  type PersonEntry,
} from "~/app/common/seo";

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
  beforeLoad: ({ params }) => {
    const person = getPersonEntry(params.slug);
    if (!person) {
      notFound({ throw: true });
      return;
    }
    if (params.slug !== person.slug)
      redirect({ href: personPath(person.name), statusCode: 301, throw: true });
  },
  head: ({ params }) => {
    const person = getPersonEntry(params.slug);
    if (!person) return {};
    const rolesZh = [
      ...new Set(person.credits.map((credit) => roleLabelZh(credit.roleKey))),
    ];
    const title = `${person.name}｜${rolesZh.slice(0, 3).join("、")}・廣東歌製作名單 | Cantopop Map`;
    const description = `${person.name} 的廣東歌及 MV 製作名單，收錄 ${uniqueLocations(person).length} 首作品，參與職務包括${rolesZh.join("、")}。Cantopop song and music video credits.`;
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
  const person = getPersonEntry(slug);
  if (!person) return null;

  const pageUrl = absoluteUrl(personPath(person.name));
  const roles = uniqueRoles(person);
  const locations = uniqueLocations(person);
  const instagram = instagramUrl(person.instagram);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...personJsonLd(person.name, person.instagram),
        ...(person.kind === "Person" ? { jobTitle: roles } : {}),
        description: describePerson(person),
      },
      {
        "@type": "ProfilePage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${person.name} credits`,
        inLanguage: ["zh-Hant-HK", "en"],
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
      title={`${person.name}：廣東歌及 MV 製作名單`}
      intro={
        <>
          <p>
            {person.name} 參與了本站收錄的 {locations.length} 首作品，職務包括
            {[
              ...new Set(
                person.credits.map((credit) => roleLabelZh(credit.roleKey)),
              ),
            ].join("、")}
            。以下列出相關歌曲、MV 拍攝地點與參與職務。
          </p>
          <p lang="en" className="mt-2">
            {describePerson(person)}
          </p>
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
                `${roleLabelZh(credit.roleKey)} · ${credit.role}（${credit.category === "song" ? "歌曲 Song" : "音樂錄像 MV"}）`,
            )
            .join(", ");
        }}
      />
    </DirectoryPage>
  );
}
