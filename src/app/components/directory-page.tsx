import type { ReactNode } from "react";
import type { LocationItem } from "../common/lib";
import { artistPath, locationPath } from "../common/seo";

// Plain, server-rendered layout for the crawlable directory pages
// (/browse, /artists/*, /people/*). Everything here is real HTML so search
// engines and AI tools can read it without running the map.
export function DirectoryPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#e8eaed] text-black">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        <nav className="flex flex-row flex-wrap items-center gap-4 text-sm">
          <a href="/" className="font-[Cute] text-2xl">
            cantopop地圖
          </a>
          <a href="/" className="underline">
            Map
          </a>
          <a href="/browse" className="underline">
            Browse all songs
          </a>
          <a href="/leaderboard" className="underline">
            Contributors
          </a>
        </nav>
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {intro ? (
            <div className="text-sm leading-relaxed">{intro}</div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export function LocationList({
  locations,
  note,
}: {
  locations: LocationItem[];
  note?: (location: LocationItem) => ReactNode;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {locations.map((location) => (
        <li
          key={location.id}
          className="flex flex-row gap-3 rounded-lg bg-white/60 p-3"
        >
          <img
            src={location.image}
            alt={`${location.name} music video thumbnail`}
            width={120}
            height={68}
            loading="lazy"
            className="h-[68px] w-[120px] shrink-0 rounded object-cover"
          />
          <div className="flex flex-col gap-1 text-sm">
            <a
              href={locationPath(location)}
              className="font-semibold underline"
            >
              {location.name}
            </a>
            <span>
              {location.artists.map((artist, index) => (
                <span key={artist}>
                  {index > 0 ? ", " : ""}
                  <a href={artistPath(artist)} className="underline">
                    {artist}
                  </a>
                </span>
              ))}
            </span>
            <span className="text-xs">
              Filmed at {location.address ?? "an unknown location"}
            </span>
            {note ? <span className="text-xs">{note(location)}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
