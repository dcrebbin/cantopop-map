"use client";
import { useMemo } from "react";
import { useUIStore } from "../_state/ui.store";
import {
  constructTitle,
  LOCATIONS,
  getContributorDisplayName,
  humanizeRoleKey,
  type ContributorCredit,
  type LocationItem,
} from "../common/locations";
import { ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { nameToInstagramMap } from "../common/social-media";
import { InstagramIcon } from "~/lib/icons/instagramIcon";

type Category = "song" | "musicVideo";

interface Contribution {
  location: LocationItem;
  songRoles: string[];
  musicVideoRoles: string[];
}

function getRolesForPerson(
  bucket: Record<string, ContributorCredit[]> | undefined,
  contributorDisplayName: string,
): string[] {
  if (!bucket) return [];
  const roles: string[] = [];
  for (const roleKey of Object.keys(bucket)) {
    const people = bucket[roleKey] ?? [];
    if (
      people.some(
        (person) =>
          getContributorDisplayName(person) === contributorDisplayName,
      )
    ) {
      roles.push(humanizeRoleKey(roleKey));
    }
  }
  return roles;
}

function getInstagramHandle(contributorDisplayName: string): string | null {
  const handleMatch = /\(@([^()]+)\)$/.exec(contributorDisplayName);
  if (handleMatch?.[1]) return handleMatch[1];

  return (
    nameToInstagramMap[
      contributorDisplayName as keyof typeof nameToInstagramMap
    ] ?? null
  );
}

export default function ContributorsModal() {
  const {
    selectedContributor,
    setSelectedContributor,
    setSelectedLocationCredits,
  } = useUIStore();

  const contributions = useMemo<Contribution[]>(() => {
    if (!selectedContributor) return [];
    const results: Contribution[] = [];
    for (const location of LOCATIONS) {
      const contributors = (
        location as unknown as {
          contributors?: {
            song?: Record<string, ContributorCredit[]>;
            musicVideo?: Record<string, ContributorCredit[]>;
          } | null;
        }
      ).contributors;
      if (!contributors) continue;
      const songRoles = getRolesForPerson(
        contributors.song,
        selectedContributor,
      );
      const musicVideoRoles = getRolesForPerson(
        contributors.musicVideo,
        selectedContributor,
      );
      if (songRoles.length === 0 && musicVideoRoles.length === 0) continue;
      results.push({ location, songRoles, musicVideoRoles });
    }
    return results;
  }, [selectedContributor]);

  const roleSummary = useMemo(() => {
    const summary: Record<Category, Map<string, number>> = {
      song: new Map(),
      musicVideo: new Map(),
    };
    for (const c of contributions) {
      for (const r of c.songRoles) {
        summary.song.set(r, (summary.song.get(r) ?? 0) + 1);
      }
      for (const r of c.musicVideoRoles) {
        summary.musicVideo.set(r, (summary.musicVideo.get(r) ?? 0) + 1);
      }
    }
    return summary;
  }, [contributions]);

  const totalCredits = useMemo(
    () =>
      contributions.reduce(
        (total, contribution) =>
          total +
          contribution.songRoles.length +
          contribution.musicVideoRoles.length,
        0,
      ),
    [contributions],
  );

  if (!selectedContributor) return null;

  function removeContributorModalUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("view-portfolio");
    url.searchParams.delete("selected-contributor");
    window.history.replaceState({}, "", url.toString());
  }

  function removeTimeFromYoutubeUrl(url: string) {
    return url.split("?")[0];
  }

  function showLocationCredits(location: LocationItem) {
    setSelectedLocationCredits(location);
    setSelectedContributor(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("view-portfolio");
    url.searchParams.delete("selected-contributor");
    url.searchParams.set("title", constructTitle(location));
    url.searchParams.set("view-credits", "true");
    window.history.replaceState({}, "", url.toString());
  }

  const instagramHandle = getInstagramHandle(selectedContributor);
  const instagramUrl = instagramHandle
    ? `https://www.instagram.com/${instagramHandle}`
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999999] flex items-center justify-center bg-transparent text-white">
      <div className="pointer-events-auto absolute top-14 z-10 mx-2 mt-5 flex max-h-[80vh] w-[98%] max-w-[50rem] flex-col overflow-y-auto rounded-md border-[3px] border-white/70 bg-black/[25%] p-4 drop-shadow-md backdrop-blur-lg xl:top-5 xl:w-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {selectedContributor}
            </h1>
            <div className="flex items-center gap-2">
              {instagramUrl ? (
                <a
                  className="flex items-center gap-1 text-sm text-white/70 hover:underline"
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  @{instagramHandle}
                  <InstagramIcon className="size-6" />
                </a>
              ) : null}
              {instagramUrl ? " | " : null}
              <button
                type="button"
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({
                      title: `Checkout my Cantopop地圖 portfolio`,
                      url: document.URL,
                    });
                  } else {
                    alert(
                      "Your browser does not support sharing. Please copy the link manually.",
                    );
                  }
                }}
                className="flex items-center gap-1 text-sm font-bold text-white/70 hover:underline"
              >
                <span className="text-sm">Share</span>
                <ShareIcon className="size-4" />
              </button>
            </div>
            <p className="text-sm text-white/70">
              {totalCredits} {totalCredits === 1 ? "credit" : "credits"} across{" "}
              {contributions.length}{" "}
              {contributions.length === 1 ? "song" : "songs"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-full p-1 hover:bg-white/10"
            onClick={() => {
              setSelectedContributor(null);
              removeContributorModalUrl();
            }}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {(roleSummary.song.size > 0 || roleSummary.musicVideo.size > 0) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {Array.from(roleSummary.song.entries()).map(([role, count]) => (
              <span
                key={`song-${role}`}
                className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-xs"
              >
                {role}
                {count > 1 ? ` x${count}` : ""}
              </span>
            ))}
            {Array.from(roleSummary.musicVideo.entries()).map(
              ([role, count]) => (
                <span
                  key={`mv-${role}`}
                  className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-xs"
                >
                  {role}
                  {count > 1 ? ` x${count}` : ""}
                </span>
              ),
            )}
          </div>
        )}
        <hr className="my-3 opacity-30" />
        <div className="flex-1 overflow-y-auto pr-1">
          {contributions.length === 0 ? (
            <p className="text-sm text-white/70">No credits found.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {contributions.map((c) => (
                <li
                  key={c.location.id}
                  className="flex flex-row justify-between gap-2 rounded-md border border-white/20 bg-white/5 p-3"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base xl:text-xl">{c.location.name}</h3>

                    <div className="text-xs text-white/70">
                      {c.location.artists.join(", ")}
                    </div>

                    {c.songRoles.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-white/60">Song: </span>
                        {c.songRoles.join(", ")}
                      </div>
                    )}
                    {c.musicVideoRoles.length > 0 && (
                      <div className="text-sm">
                        <span className="text-white/60">
                          {c.musicVideoRoles.length === 1 ? "Role" : "Roles"}{" "}
                          :{" "}
                        </span>
                        {c.musicVideoRoles.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={removeTimeFromYoutubeUrl(c.location.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <img
                        src={c.location.image}
                        alt={c.location.name}
                        className="aspect-video h-20 w-auto rounded object-contain"
                        style={{ aspectRatio: "16/9" }}
                      />
                    </a>
                    <button
                      type="button"
                      className="rounded-md border border-white/30 bg-white/10 px-2 py-1 text-sm hover:bg-white/20"
                      onClick={() => {
                        showLocationCredits(c.location);
                      }}
                    >
                      Credits
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-2 text-center text-sm text-white/70">
          Any errors or missing credits? Please contact at{" "}
          <a
            href="mailto:devon@langpal.com.hk?subject=Cantopop地圖"
            className="underline"
          >
            devon@langpal.com.hk
          </a>
        </div>
      </div>
    </div>
  );
}
