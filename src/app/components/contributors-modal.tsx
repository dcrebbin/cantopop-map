"use client";
import { useMemo } from "react";
import { useUIStore } from "../_state/ui.store";
import {
  LOCATIONS,
  humanizeRoleKey,
  type LocationItem,
} from "../common/locations";
import { ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { nameToInstagramMap } from "../common/social-media";
import { instagramIcon } from "~/lib/icons/instagramIcon";
import { SvgIcon } from "./map/PopupContent";

type Category = "song" | "musicVideo";

interface Contribution {
  location: LocationItem;
  songRoles: string[];
  musicVideoRoles: string[];
}

function getRolesForPerson(
  bucket: Record<string, string[]> | undefined,
  name: string,
): string[] {
  if (!bucket) return [];
  const roles: string[] = [];
  for (const roleKey of Object.keys(bucket)) {
    const people = bucket[roleKey] ?? [];
    if (people.includes(name)) roles.push(humanizeRoleKey(roleKey));
  }
  return roles;
}

export default function ContributorsModal() {
  const { selectedContributor, setSelectedContributor } = useUIStore();

  const contributions = useMemo<Contribution[]>(() => {
    if (!selectedContributor) return [];
    const results: Contribution[] = [];
    for (const location of LOCATIONS) {
      const contributors = (
        location as unknown as {
          contributors?: {
            song?: Record<string, string[]>;
            musicVideo?: Record<string, string[]>;
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
    window.history.replaceState({}, "", url.toString());
  }

  function removeTimeFromYoutubeUrl(url: string) {
    return url.split("?")[0];
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 text-white"
      onClick={() => {
        setSelectedContributor(null);
        removeContributorModalUrl();
      }}
    >
      <div
        className="z-10 mx-2 mt-5 flex max-h-[80vh] w-full max-w-[50rem] flex-col overflow-y-auto rounded-md border-[3px] border-white/70 bg-black/[15%] p-4 drop-shadow-md backdrop-blur-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {selectedContributor}
            </h1>
            <div className="flex items-center gap-2">
              {nameToInstagramMap[
                selectedContributor as keyof typeof nameToInstagramMap
              ] ? (
                <a
                  className="flex items-center gap-1 text-sm text-white/70 hover:underline"
                  href={`https://www.instagram.com/${nameToInstagramMap[selectedContributor as keyof typeof nameToInstagramMap]}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  @
                  {
                    nameToInstagramMap[
                      selectedContributor as keyof typeof nameToInstagramMap
                    ]
                  }
                  <SvgIcon html={instagramIcon} className="size-6" />
                </a>
              ) : null}
              {" | "}
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
              {totalCredits} {totalCredits === 1 ? "credit" : "credits"}{" "}
              across {contributions.length}{" "}
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
                    <a
                      href={c.location.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base font-semibold hover:underline"
                    >
                      {c.location.name}
                    </a>
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
                        <span className="text-white/60">Credits: </span>
                        {c.musicVideoRoles.join(", ")}
                      </div>
                    )}
                  </div>
                  <a
                    href={removeTimeFromYoutubeUrl(c.location.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <img
                      src={c.location.image}
                      alt={c.location.name}
                      className="h-20 w-auto"
                    />
                  </a>
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
