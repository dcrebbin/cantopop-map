import { createFileRoute } from "@tanstack/react-router";
import { JsonLdScript } from "~/app/components/JsonLd";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { LOCATIONS } from "~/app/common/lib";
import {
  ARTIST_INDEX,
  PEOPLE_INDEX,
  absoluteUrl,
  artistPath,
  locationPath,
  personPath,
} from "~/app/common/seo";

const title = "廣東歌 MV 拍攝地點目錄｜歌手及幕後製作名單 | Cantopop Map";
const description = `瀏覽 ${LOCATIONS.length} 首廣東歌 MV、${ARTIST_INDEX.size} 位歌手及組合，以及歌曲和音樂錄像的幕後製作名單，探索香港及海外拍攝地點。Browse Cantopop filming locations, artists and credits.`;

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
    name: "廣東歌 MV 拍攝地點目錄 · Cantopop filming locations",
    description,
    inLanguage: ["zh-Hant-HK", "en"],
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
    <main className="jobs-map-shell min-h-dvh text-white">
      <JsonLdScript data={jsonLd} />
      <div className="min-h-dvh bg-black/35 pb-12">
        <header className="border-b border-white/20 bg-black/25 backdrop-blur-md">
          <nav
            aria-label="主要導覽"
            className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-7"
          >
            <a
              href="/"
              className="font-[Cute] text-2xl leading-none text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] md:text-4xl"
            >
              cantopop地圖 <span className="text-white/65">BROWSE</span>
            </a>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <a
                href="/"
                className="rounded-full border border-white/40 bg-white/10 px-4 py-2.5 transition hover:bg-white hover:text-black"
              >
                地圖 · Map
              </a>
              <a
                href="/DSCVR"
                className="rounded-full border border-white/40 bg-white/10 px-4 py-2.5 transition hover:bg-white hover:text-black"
              >
                DSCVR ↗
              </a>
              <a
                href="/browse"
                aria-current="page"
                className="rounded-full border border-white bg-white px-4 py-2.5 text-black"
              >
                Browse
              </a>
            </div>
          </nav>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-7">
          <header className="flex flex-wrap items-end justify-between gap-5 py-8 sm:py-11">
            <div>
              <p
                lang="en"
                className="mb-2 text-xs font-bold tracking-[0.2em] text-white/70"
              >
                THE CANTOPOP DIRECTORY
              </p>
              <h1 className="font-serif text-3xl leading-tight sm:text-5xl">
                歌曲及取景地
              </h1>
              <p lang="en" className="mt-2 text-sm text-white/75">
                The songs. The artists. The places behind the videos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <a
                href="#artists"
                className="rounded-full border border-white/40 bg-black/35 px-4 py-2.5 backdrop-blur-md transition hover:bg-white hover:text-black"
              >
                {LOCATIONS.length} 首 MV
              </a>
              <a
                href="#artists"
                className="rounded-full border border-white/40 bg-black/35 px-4 py-2.5 backdrop-blur-md transition hover:bg-white hover:text-black"
              >
                {ARTIST_INDEX.size} 位歌手及組合
              </a>
              <a
                href="#people"
                className="rounded-full border border-white/40 bg-black/35 px-4 py-2.5 backdrop-blur-md transition hover:bg-white hover:text-black"
              >
                幕後團隊 ↓
              </a>
            </div>
          </header>
          <p className="sr-only">{description}</p>

          <section
            id="artists"
            className="scroll-mt-6"
            aria-labelledby="artists-heading"
          >
            <h2
              id="artists-heading"
              className="mb-4 text-sm font-bold text-white/85"
            >
              歌手及組合{" "}
              <span lang="en" className="font-normal text-white/60">
                / Artists
              </span>
            </h2>
            <ul className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
              {artists.map((artist) => (
                <li
                  key={artist.slug}
                  className="overflow-hidden rounded-[2rem] border-2 border-white/45 bg-black/85 shadow-[0_1rem_3rem_rgba(0,0,0,.25)]"
                >
                  <a
                    href={artistPath(artist.name)}
                    className="group relative block overflow-hidden"
                  >
                    <img
                      src={
                        artist.locations[0]?.highResImage ??
                        artist.locations[0]?.image
                      }
                      alt=""
                      width={640}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/15 to-black" />
                    <span className="absolute top-4 right-4 rounded-full border border-white/40 bg-black/45 px-3 py-1 text-xs font-bold backdrop-blur-md">
                      {artist.locations.length} MV
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-5 pt-10 pb-4">
                      <h3 className="min-w-0 wrap-anywhere font-serif text-2xl leading-tight">
                        {artist.name}
                      </h3>
                      <ArrowUpRightIcon
                        aria-hidden="true"
                        className="mb-1 size-5 shrink-0 text-white/75 transition group-hover:text-white"
                      />
                    </div>
                  </a>
                  <ul className="divide-y divide-white/15 px-4 pb-3">
                    {artist.locations.map((location) => (
                      <li key={location.id}>
                        <a
                          href={locationPath(location)}
                          className="group flex items-center gap-3 rounded-xl px-1 py-3 transition hover:bg-white/10"
                        >
                          <img
                            src={location.image}
                            alt=""
                            width={80}
                            height={45}
                            loading="lazy"
                            decoding="async"
                            className="aspect-video w-20 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="wrap-anywhere text-sm font-semibold leading-snug">
                              {location.name}
                            </p>
                            <p className="mt-1 flex items-start gap-1 text-xs leading-relaxed text-white/65">
                              <MapPinIcon
                                aria-hidden="true"
                                className="mt-0.5 size-3 shrink-0"
                              />
                              <span className="wrap-anywhere">
                                {location.address ?? "拍攝地點尚未收錄"}
                              </span>
                            </p>
                          </div>
                          <ArrowUpRightIcon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-white/40 transition group-hover:text-white"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="people"
            className="mt-10 scroll-mt-6"
            aria-labelledby="people-heading"
          >
            <details className="group overflow-hidden rounded-[2rem] border-2 border-white/45 bg-black/80 shadow-[0_1rem_3rem_rgba(0,0,0,.25)] backdrop-blur-md">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-6 sm:px-7 [&::-webkit-details-marker]:hidden">
                <div>
                  <h2 id="people-heading" className="font-serif text-2xl">
                    幕後人員及製作團隊
                  </h2>
                  <p lang="en" className="mt-1 text-sm text-white/65">
                    People & organizations ·{" "}
                    {people.length.toLocaleString("en-HK")} profiles
                  </p>
                </div>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 transition group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <ul className="grid grid-cols-2 gap-2 border-t border-white/20 p-5 sm:grid-cols-3 sm:p-7 lg:grid-cols-4">
                {people.map((person) => (
                  <li key={person.slug} className="min-w-0">
                    <a
                      href={personPath(person.name)}
                      className="block wrap-anywhere rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm transition hover:border-white/50 hover:bg-white/15"
                    >
                      {person.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        </div>
      </div>
    </main>
  );
}
