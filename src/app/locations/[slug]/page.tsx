import {
  constructTitle,
  humanizeRoleKey,
  nameToLocation,
} from "~/app/common/locations";
import { nameToInstagramMap } from "~/app/common/social-media";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "~/app/page";
import { SvgIcon } from "~/app/components/map/PopupContent";
import { arrowRightIcon } from "~/lib/icons/arrowRightIcon";

export function generateStaticParams() {
  return Object.keys(nameToLocation).map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const slug = decodeURIComponent(params.slug);
  const location = nameToLocation[slug];
  if (!location) return {};

  const title = `${location.name} by ${location.artists.join(", ")} - Music Video Location`;
  const description = `${location.name} by ${location.artists.join(", ")} — filmed at ${location.address}. View Street View and watch the MV.`;
  const images = location.image ? [location.image] : ["/images/og-image.png"];

  return {
    title,
    description,
    alternates: {
      canonical: `/locations/${encodeURIComponent(params.slug)}`,
    },
    openGraph: {
      title,
      description,
      images,
      type: "article",
      url: `/locations/${encodeURIComponent(params.slug)}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default function LocationPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const location = nameToLocation[slug];

  if (!location) {
    return notFound();
  }
  const title = constructTitle(location);

  const videoId = location?.url.includes("youtu.be")
    ? location?.url.split("youtu.be/")[1]?.split("?")[0]
    : location?.url.split("v=")[1]?.split("&")[0];

  if (!videoId) {
    return notFound();
  }

  return (
    <div className="relative h-screen w-screen">
      <div
        className="fixed z-[99999] flex h-screen w-screen flex-col items-center justify-center bg-black/50"
        id="location-modal"
      >
        <div className="my-10 flex h-screen w-[90%] flex-col items-start justify-start overflow-y-auto rounded-lg border-2 border-white/50 bg-white/50 p-4 backdrop-blur-md lg:w-[90rem]">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="text-xl font-bold">
              {location?.artists.join(", ")} - {location?.name} | Music Video
              Location
            </h1>
            <a href={`/?title=${title}`}>
              <SvgIcon html={arrowRightIcon} className="h-6 w-6 text-black" />
            </a>
          </div>
          <div className="flex w-full flex-col items-start justify-start px-4">
            <div className="mt-4 flex w-full flex-row items-start justify-evenly gap-2">
              <div className="h-[200px] w-[300px] rounded-lg lg:h-[300px] lg:w-[600px]">
                <iframe
                  src={location?.streetViewEmbed ?? location?.mapEmbed ?? ""}
                  width="100%"
                  height="100%"
                  title="Street View"
                  className="h-[200px] rounded-lg drop-shadow-md lg:h-[300px]"
                  style={{ border: "0" }}
                ></iframe>
              </div>
              <div className="h-[200px] w-[300px] rounded-lg lg:h-[300px] lg:w-[600px]">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  width="100%"
                  height="100%"
                  title="Youtube Video"
                  className="h-[200px] rounded-lg drop-shadow-md lg:h-[300px]"
                  style={{ border: "0" }}
                ></iframe>
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
                <p>{location?.address}</p>
              </div>
              <div className="flex w-full flex-col items-start justify-start">
                <p className="text-xs font-bold">Location</p>
                <p>
                  {location?.lat}, {location?.lng}
                </p>
              </div>
            </div>
            <div className="mt-4 flex w-full flex-row items-start justify-evenly gap-2">
              <div className="flex w-full flex-col items-start justify-start overflow-y-auto font-bold">
                <h3 className="my-1 text-base">Contributors</h3>
                <hr className="my-1 w-full text-black" />
                <h3 className="my-2">Song</h3>
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
                          {value.map((name) => {
                            if (
                              nameToInstagramMap[
                                name as keyof typeof nameToInstagramMap
                              ]
                            ) {
                              return (
                                <a
                                  key={name}
                                  href={`https://www.instagram.com/${nameToInstagramMap[name as keyof typeof nameToInstagramMap]}`}
                                  target="_blank"
                                  className="text-blue-500 underline"
                                  rel="noreferrer"
                                >
                                  {name}
                                </a>
                              );
                            }
                            return <span key={name}>{name}</span>;
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <hr className="my-1 w-full text-black" />
                <h3 className="text-md my-2">Music Video</h3>
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
                            if (
                              nameToInstagramMap[
                                name as keyof typeof nameToInstagramMap
                              ]
                            ) {
                              return (
                                <a
                                  key={name}
                                  href={`https://www.instagram.com/${nameToInstagramMap[name as keyof typeof nameToInstagramMap]}`}
                                  target="_blank"
                                  className="text-blue-500 underline"
                                  rel="noreferrer"
                                >
                                  {name}
                                </a>
                              );
                            }
                            return <span key={name}>{name}</span>;
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
      <Home />
    </div>
  );
}
