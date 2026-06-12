import {
  getContributorDisplayName,
  getContributorInstagram,
  getContributorName,
  humanizeRoleKey,
  nameToLocation,
  type ContributorCredit,
} from "~/app/common/locations";
import { nameToInstagramMap } from "~/app/common/social-media";
import { createFileRoute, notFound } from "@tanstack/react-router";
import DynamicHomePage from "~/app/components/dynamic-home-page";
import CloseButton from "~/app/components/close-button";
import { JsonLdScript } from "~/app/components/JsonLd";

function getContributorInstagramUrl(contributor: ContributorCredit) {
  const name = getContributorName(contributor);
  const instagram =
    getContributorInstagram(contributor) ??
    nameToInstagramMap[name as keyof typeof nameToInstagramMap];

  return instagram ? `https://www.instagram.com/${instagram}` : null;
}

export const Route = createFileRoute("/locations/$slug")({
  head: ({ params }) => {
    const slug = decodeURIComponent(params.slug);
    const location = nameToLocation[slug];
    if (!location) return {};

    const artistNames = location.artists.join(", ");
    const title = `${location.name} by ${artistNames} | Cantopop Map 粵語歌地圖`;
    const locationDescription = location.address
      ? ` at ${location.address}, Hong Kong`
      : "";
    const description = `Discover the filming location for "${location.name}" by ${artistNames}${locationDescription}. Watch the music video and explore the credits with Cantopop Map.`;
    const images = location.image ? [location.image] : ["/images/og-image.png"];
    const path = `/locations/${encodeURIComponent(params.slug)}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content: [
            location.name,
            ...location.artists,
            "cantopop map",
            "粵語歌地圖",
            "music video location",
            "hong kong filming location",
            location.address ?? "",
            "cantopop",
            "廣東歌",
          ]
            .filter(Boolean)
            .join(","),
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: path },
        { property: "og:site_name", content: "Cantopop Map" },
        { property: "og:locale", content: "en_HK" },
        ...images.map((image) => ({ property: "og:image", content: image })),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...images.map((image) => ({ name: "twitter:image", content: image })),
      ],
      links: [
        { rel: "canonical", href: path },
        { rel: "alternate", hrefLang: "en", href: path },
        { rel: "alternate", hrefLang: "zh-HK", href: path },
        { rel: "alternate", hrefLang: "x-default", href: path },
      ],
    };
  },
  component: LocationPage,
});

function LocationPage() {
  const { slug: encodedSlug } = Route.useParams();
  const slug = decodeURIComponent(encodedSlug);
  const location = nameToLocation[slug];

  if (!location) {
    throw notFound();
  }

  const videoId = location?.url.includes("youtu.be")
    ? location?.url.split("youtu.be/")[1]?.split("?")[0]
    : location?.url.split("v=")[1]?.split("&")[0];

  const time = location?.url.split("?t=")[1]?.split("&")[0];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
  const place =
    location.address && location.lat !== null && location.lng !== null
      ? {
          "@type": "Place",
          "@id": `${siteUrl}/locations/${encodeURIComponent(slug)}#place`,
          name: location.address,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Hong Kong",
            addressCountry: "HK",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: location.lat,
            longitude: location.lng,
          },
        }
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MusicRecording",
        "@id": `${siteUrl}/locations/${encodeURIComponent(slug)}#song`,
        name: location.name,
        byArtist: location.artists.map((a) => ({
          "@type": "MusicGroup",
          name: a,
        })),
        url: location.url,
        image: location.image,
        locationCreated: place,
        potentialAction: {
          "@type": "WatchAction",
          target: location.url,
        },
      },
      {
        "@type": "VideoObject",
        name: `${location.name} - Music Video`,
        description: `Official music video for "${location.name}" by ${location.artists.join(", ")}.`,
        thumbnailUrl: location.image,
        embedUrl: videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : undefined,
        contentUrl: location.url,
        uploadDate: new Date().toISOString().split("T")[0],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Cantopop Map",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: location.name,
            item: `${siteUrl}/locations/${encodeURIComponent(slug)}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="relative h-screen w-screen">
      <div
        className="fixed z-95 flex h-screen w-screen flex-col items-center justify-center bg-black/30"
        id="location-modal"
      >
        <div className="mb-10 mt-28 flex h-screen w-[90%] flex-col items-start justify-start overflow-y-auto rounded-lg border-2 border-white/50 bg-white/50 p-4 backdrop-blur-md lg:w-240 xl:w-7xl 2xl:w-360">
          <JsonLdScript data={jsonLd} />
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="text-xl font-semibold">
              {location?.artists.join(", ")} - {location?.name} | Music Video
              Location
            </h1>
            <CloseButton />
          </div>
          <div className="flex w-full flex-col items-start justify-start px-4">
            <div className="mt-4 grid w-full justify-center gap-2 lg:grid-cols-2">
              <div className="h-[200px] w-[300px] rounded-lg lg:h-[300px] lg:w-auto">
                <iframe
                  src={location?.streetViewEmbed ?? location?.mapEmbed ?? ""}
                  width="100%"
                  height="100%"
                  title="Street View"
                  className="h-[200px] rounded-lg drop-shadow-md lg:h-[300px]"
                  style={{ border: "0" }}
                  sandbox="allow-scripts allow-popups allow-forms allow-presentation"
                ></iframe>
              </div>
              <div className="h-[200px] w-[300px] rounded-lg lg:h-[300px] lg:w-auto">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?start=${time}`}
                    width="100%"
                    height="100%"
                    title="Youtube Video"
                    className="h-[200px] rounded-lg drop-shadow-md lg:h-[300px]"
                    style={{ border: "0" }}
                    sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
                  ></iframe>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/60 text-sm">
                    Video unavailable
                  </div>
                )}
              </div>
            </div>
            <hr className="my-2 w-full" />
            <div className="grid w-full grid-cols-2 gap-2">
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">Song Title</p>
                <p>{location?.name}</p>
              </div>
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">Artist(s)</p>
                <p>{location?.artists.join(", ")}</p>
              </div>
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">Address</p>
                <p>{location?.address ?? "Not available"}</p>
              </div>
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">Location</p>
                <p>
                  {location?.lat !== null && location?.lng !== null
                    ? `${location.lat}, ${location.lng}`
                    : "Not available"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex w-full flex-row items-start justify-evenly gap-2">
              <div className="flex w-full flex-col items-start justify-start overflow-y-auto font-bold">
                <h3 className="my-1 text-base">Contributors</h3>
                <hr className="my-1 w-full text-black" />
                <h3 className="my-2">Song</h3>
                {Object.entries(location.contributors?.song ?? {}).length ===
                  0 && (
                  <div className="flex w-full flex-col items-center justify-center text-sm">
                    <p className="text-center">No song contributors found</p>
                    <a
                      className="my-2 font-normal underline"
                      href={`mailto:devon@langpal.com.hk?subject=Cantopop地圖: ${location.name} Song Contributors`}
                    >
                      Submit contributors
                    </a>
                  </div>
                )}
                <div className="grid w-full grid-cols-2 gap-2">
                  {Object.entries(location?.contributors?.song ?? {}).map(
                    ([key, value]) => (
                      <div
                        className="flex flex-col items-start justify-start"
                        key={key}
                      >
                        <p className="text-xs font-bold">
                          {humanizeRoleKey(key)} <br></br>
                        </p>
                        <div className="flex flex-col gap-1 text-left text-xs font-normal">
                          {Array.isArray(value)
                            ? value.map((name) => {
                                const displayName =
                                  getContributorDisplayName(name);
                                const instagramUrl =
                                  getContributorInstagramUrl(name);
                                if (instagramUrl) {
                                  return (
                                    <a
                                      key={displayName}
                                      href={instagramUrl}
                                      target="_blank"
                                      className="text-blue-500 underline"
                                      rel="noreferrer"
                                    >
                                      {displayName}
                                    </a>
                                  );
                                }
                                return (
                                  <span key={displayName}>{displayName}</span>
                                );
                              })
                            : null}
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <h3 className="text-md my-2">Music Video</h3>
                {Object.entries(location.contributors?.musicVideo ?? {})
                  .length === 0 && (
                  <div className="flex w-full flex-col items-center justify-center text-sm">
                    <p className="text-center">
                      No music video contributors found
                    </p>
                    <a
                      className="my-2 font-normal underline"
                      href={`mailto:devon@langpal.com.hk?subject=Cantopop地圖: ${location.name} Music Video Contributors`}
                    >
                      Submit contributors
                    </a>
                  </div>
                )}
                <div className="grid w-full grid-cols-2 gap-2">
                  {Object.entries(location?.contributors?.musicVideo ?? {}).map(
                    ([key, value]) => (
                      <div
                        className="flex w-full flex-col items-start justify-start"
                        key={key}
                      >
                        <p className="text-xs font-bold">
                          {humanizeRoleKey(key)} <br></br>
                        </p>
                        <div className="flex flex-col gap-1 text-left text-xs font-normal">
                          {value.map((name) => {
                            const displayName = getContributorDisplayName(name);
                            const instagramUrl =
                              getContributorInstagramUrl(name);
                            if (instagramUrl) {
                              return (
                                <a
                                  key={displayName}
                                  href={instagramUrl}
                                  target="_blank"
                                  className="text-blue-500 underline"
                                  rel="noreferrer"
                                >
                                  {displayName}
                                </a>
                              );
                            }
                            return <span key={displayName}>{displayName}</span>;
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DynamicHomePage location={location} />
    </div>
  );
}
