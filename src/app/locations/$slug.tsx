import { nameToLocation, type LocationItem } from "~/app/common/lib";
import { createFileRoute, notFound } from "@tanstack/react-router";
import DynamicHomePage from "~/app/components/dynamic-home-page";
import CloseButton from "~/app/components/close-button";
import { JsonLdScript } from "~/app/components/JsonLd";
import {
  absoluteUrl,
  artistJsonLd,
  artistPath,
  describeLocation,
  getLocationCredits,
  isEstimatedLocation,
  locationPath,
  personPath,
  roleLabelZh,
  videoStartSeconds,
  personJsonLd,
} from "~/app/common/seo";

import { youtubeVideoId } from "~/app/common/youtube-video-id";

// Song credits that schema.org models directly; everything else becomes a
// generic contributor Role so the job title is still machine readable.
const SONG_ROLE_PROPERTIES: Record<string, "composer" | "lyricist"> = {
  composer: "composer",
  lyricist: "lyricist",
};

export const Route = createFileRoute("/locations/$slug")({
  beforeLoad: ({ params }) => {
    if (!Object.hasOwn(nameToLocation, params.slug)) notFound({ throw: true });
  },
  head: ({ params }) => {
    const slug = params.slug;
    const location = nameToLocation[slug];
    if (!location) return {};

    const artistNames = location.artists.join(", ");
    const title = `${artistNames}《${location.name}》MV 拍攝地點 | Cantopop Map`;
    const path = locationPath(location);
    const description = `${describeLocation(location, "zh")} ${describeLocation(location)}`;
    const url = absoluteUrl(path);
    const images = location.image
      ? [location.image]
      : [absoluteUrl("/images/og-image.png")];

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
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Cantopop Map" },
        { property: "og:locale", content: "zh_HK" },
        ...images.map((image) => ({ property: "og:image", content: image })),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...images.map((image) => ({ name: "twitter:image", content: image })),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: LocationPage,
});

function LocationPage() {
  const { slug } = Route.useParams();
  const location = nameToLocation[slug];

  if (!location) return null;

  const videoId = youtubeVideoId(location.url);
  const time = videoStartSeconds(location);
  const pageUrl = absoluteUrl(locationPath(location));
  const playbackUrl = new URL(location.url);
  if (time !== null) playbackUrl.searchParams.set("t", String(time));
  const credits = getLocationCredits(location);
  const songCredits = credits.filter((credit) => credit.category === "song");
  const videoCredits = credits.filter(
    (credit) => credit.category === "musicVideo",
  );
  const asRole = (credit: (typeof credits)[number]) => ({
    "@type": "Role",
    roleName: credit.role,
    contributor: personJsonLd(credit.name, credit.instagram),
  });
  const songRoleProperties = Object.fromEntries(
    Object.values(SONG_ROLE_PROPERTIES).map((property) => [
      property,
      songCredits
        .filter((credit) => SONG_ROLE_PROPERTIES[credit.roleKey] === property)
        .map((credit) => personJsonLd(credit.name, credit.instagram)),
    ]),
  );
  const place =
    location.address && location.lat !== null && location.lng !== null
      ? {
          "@type": "Place",
          "@id": `${pageUrl}#place`,
          name: location.address,
          address: location.address,
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
        "@id": `${pageUrl}#song`,
        name: location.name,
        genre: "Cantopop",
        byArtist: location.artists.map((artist) => artistJsonLd(artist)),
        url: pageUrl,
        sameAs: [location.url],
        image: location.image,
        recordingOf: {
          "@type": "MusicComposition",
          name: location.name,
          ...songRoleProperties,
        },
        contributor: songCredits
          .filter((credit) => !SONG_ROLE_PROPERTIES[credit.roleKey])
          .map(asRole),
        potentialAction: {
          "@type": "WatchAction",
          target: location.url,
        },
      },
      {
        "@type": "VideoObject",
        "@id": `${pageUrl}#video`,
        name: `${location.name} - Music Video`,
        description: `${describeLocation(location, "zh")} ${describeLocation(location)}`,
        thumbnailUrl: location.image,
        embedUrl: videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : undefined,
        url: location.url,
        contentLocation: isEstimatedLocation(location) ? undefined : place,
        director: videoCredits
          .filter((credit) => credit.roleKey === "director")
          .map((credit) => personJsonLd(credit.name, credit.instagram)),
        contributor: videoCredits
          .filter((credit) => credit.roleKey !== "director")
          .map(asRole),
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${location.artists.join(", ")} - ${location.name} | Music Video Location`,
        description: `${describeLocation(location, "zh")} ${describeLocation(location)}`,
        inLanguage: ["zh-Hant-HK", "en"],
        about: [{ "@id": `${pageUrl}#song` }, { "@id": `${pageUrl}#video` }],
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
            name: location.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="relative h-screen w-screen">
      <div
        className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/30 px-4 py-6"
        id="location-modal"
      >
        <main className="flex max-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col items-start overflow-y-auto rounded-lg border-2 border-white/50 bg-white/95 p-4 shadow-xl">
          <JsonLdScript data={jsonLd} />
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="text-xl font-semibold">
              {location.artists.join("、")}《{location.name}》MV 拍攝地點
            </h1>
            <CloseButton />
          </div>
          <div className="flex w-full flex-col items-start justify-start px-4">
            <h2 className="mt-3 font-semibold">呢個 MV 喺邊度拍？</h2>
            <p className="mt-2 text-sm">{describeLocation(location, "zh")}</p>
            <p lang="en" className="mt-1 text-sm">
              {describeLocation(location)}
            </p>
            {isEstimatedLocation(location) && (
              <p className="mt-2 text-sm">
                此地點為估計位置，尚待確認。
                <span lang="en"> This location is an estimate.</span>
              </p>
            )}
            <nav aria-label="相關歌曲及歌手" className="mt-2 text-sm">
              更多作品 · More from{" "}
              {location.artists.map((artist, index) => (
                <span key={artist}>
                  {index > 0 ? ", " : ""}
                  <a href={artistPath(artist)} className="underline">
                    {artist}
                  </a>
                </span>
              ))}{" "}
              or{" "}
              <a href="/browse" className="underline">
                瀏覽歌曲 · Browse songs
              </a>
            </nav>
            <p className="mt-3 text-sm">
              <a
                href={playbackUrl.toString()}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                觀看來源影片 · Watch source video
                {time !== null
                  ? ` (${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")})`
                  : ""}
              </a>
              {time !== null && <span> — 播放起點 · Playback start</span>}
            </p>
            {location.streetView && (
              <a
                href={location.streetView}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-sm underline"
              >
                查看街景 · Open Street View
              </a>
            )}
            <div className="mt-4 grid w-full justify-center gap-2 lg:grid-cols-2">
              <div className="h-[200px] min-w-0 w-full rounded-lg lg:h-[300px]">
                <iframe
                  src={location?.streetViewEmbed ?? location?.mapEmbed ?? ""}
                  width="100%"
                  height="100%"
                  title={`${location.address ?? location.name} — 街景 Street View`}
                  className="h-[200px] rounded-lg drop-shadow-md lg:h-[300px]"
                  style={{ border: "0" }}
                  sandbox="allow-scripts allow-popups allow-forms allow-presentation"
                ></iframe>
              </div>
              <div className="h-[200px] min-w-0 w-full rounded-lg lg:h-[300px]">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}${time !== null ? `?start=${time}` : ""}`}
                    width="100%"
                    height="100%"
                    title={`${location.name} — 音樂錄像 Music video`}
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
                <p className="text-xs font-bold">歌曲 · Song</p>
                <p>{location?.name}</p>
              </div>
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">歌手 · Artist(s)</p>
                <p>{location?.artists.join(", ")}</p>
              </div>
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">地址 · Address</p>
                <p>{location?.address ?? "尚未收錄 · Not yet listed"}</p>
              </div>
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">座標 · Coordinates</p>
                <p>
                  {location?.lat !== null && location?.lng !== null
                    ? `${location.lat}, ${location.lng}`
                    : "尚未收錄 · Not yet listed"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid w-full gap-4 md:grid-cols-2">
              <CreditSection location={location} category="song" />
              <CreditSection location={location} category="musicVideo" />
            </div>
          </div>
        </main>
      </div>
      <DynamicHomePage location={location} />
    </div>
  );
}

function CreditSection({
  location,
  category,
}: {
  location: LocationItem;
  category: "song" | "musicVideo";
}) {
  const credits = getLocationCredits(location).filter(
    (credit) => credit.category === category,
  );
  const roles = [...new Set(credits.map((credit) => credit.roleKey))];
  return (
    <section>
      <h2 className="font-semibold">
        {category === "song"
          ? "歌曲製作名單 · Song credits"
          : "音樂錄像製作名單 · MV credits"}
      </h2>
      {credits.length === 0 ? (
        <p className="mt-2 text-sm">尚未收錄 · No credits listed yet.</p>
      ) : (
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          {roles.map((role) => (
            <div key={role}>
              <dt className="font-semibold">
                {roleLabelZh(role)}{" "}
                <span lang="en" className="text-xs">
                  {credits.find((credit) => credit.roleKey === role)?.role}
                </span>
              </dt>
              <dd className="flex flex-col gap-1">
                {credits
                  .filter((credit) => credit.roleKey === role)
                  .map((credit) => (
                    <a
                      key={credit.name}
                      href={personPath(credit.name)}
                      className="underline"
                    >
                      {credit.name}
                    </a>
                  ))}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <a
        href={`mailto:devon@langpal.com.hk?subject=${encodeURIComponent(`Cantopop地圖: ${location.name} ${category === "song" ? "Song" : "Music Video"} Contributors`)}`}
        className="mt-3 inline-block text-sm underline"
      >
        補充製作名單 · Suggest credits
      </a>
    </section>
  );
}
