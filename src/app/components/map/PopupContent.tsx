/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { humanizeRoleKey, type LocationItem } from "~/app/common/locations";
import { youtubeIcon } from "~/lib/icons/youtubeIcon";
import { shareIcon } from "~/lib/icons/shareIcon";
import { streetViewIcon } from "~/lib/icons/streetViewIcon";
import { locationIcon } from "~/lib/icons/locationIcon";
import { closeIcon } from "~/lib/icons/closeIcon";
import { editIcon } from "~/lib/icons/editIcon";
import { useState } from "react";
import { plusIcon } from "~/lib/icons/plusIcon";
import { minusIcon } from "~/lib/icons/minusIcon";
import { nameToInstagramMap } from "~/app/common/social-media";
import posthog from "posthog-js";
import { useUIStore } from "~/app/_state/ui.store";
import { ArrowUpRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { hidePopup } from "~/lib/custom-map";
import { useMapStore } from "~/app/_state/map.store";

export function SvgIcon({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function PopupContent({
  data,
  onDelete,
  onEdit,
}: {
  data: LocationItem;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { setSelectedLocationCredits } = useUIStore();
  const mapStore = useMapStore();
  const uiStore = useUIStore();

  const actionButtons = (
    <div className="flex items-center justify-center gap-2">
      <a href={data.url} target="_blank" rel="noreferrer">
        <SvgIcon html={youtubeIcon} className="h-[28px] w-auto" />
      </a>

      <button
        type="button"
        onClick={() =>
          navigator.share({
            title: `Checkout this Cantopop地圖 location from ${data.artists.join(", ")}`,
            url: document.URL,
          })
        }
      >
        <SvgIcon html={shareIcon} className="h-6 w-6" />
      </button>

      {data.streetView && (
        <a
          href={
            data.streetView ||
            `https://www.google.com/maps/@${data.lat},${data.lng},18z`
          }
          target="_blank"
          rel="noreferrer"
        >
          <SvgIcon html={streetViewIcon} className="h-6 w-6" />
        </a>
      )}

      <a
        href={`https://www.google.com/maps/dir//${data.lat},${data.lng}/`}
        target="_blank"
        rel="noreferrer"
      >
        <SvgIcon html={locationIcon} className="h-6 w-6" />
      </a>
    </div>
  );
  const contributorSection = (
    <div className="flex w-full flex-col items-start justify-start overflow-y-auto overflow-x-hidden font-bold">
      <h3 className="my-1 text-base">Contributors</h3>
      <hr className="my-1 w-full text-black" />
      <h3>Song</h3>
      <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-2">
        {Object.entries(data.contributors?.song ?? {}).map(([key, value]) => (
          <div
            className="min-w-0 flex flex-col items-start justify-start"
            key={key}
          >
            <p className="min-w-0 break-words">
              {humanizeRoleKey(key)} <br></br>
            </p>
            <div className="min-w-0 max-w-full text-left text-xs font-normal">
              {Array.isArray(value)
                ? value.map((name) => {
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
                          className="break-words text-blue-500 underline"
                          rel="noreferrer"
                        >
                          {name}
                        </a>
                      );
                    }
                    if (typeof name === "string" && name.includes("@")) {
                      return (
                        <a
                          key={name}
                          href={`https://www.instagram.com/${name.split("@")[1]}`}
                          target="_blank"
                          className="break-words text-blue-500 underline"
                          rel="noreferrer"
                        >
                          {name}
                        </a>
                      );
                    }

                    return (
                      <span className="break-words" key={name}>
                        {name}
                      </span>
                    );
                  })
                : null}
            </div>
          </div>
        ))}
      </div>
      <hr className="my-1 w-full text-black" />
      <h3 className="text-md">Music Video</h3>
      <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-2">
        {Object.entries(data.contributors?.musicVideo ?? {}).map(
          ([key, value]) => (
            <div
              className="min-w-0 flex w-full flex-col items-start justify-start"
              key={key}
            >
              <p className="min-w-0 break-words">
                {humanizeRoleKey(key)} <br></br>
              </p>
              <div className="min-w-0 max-w-full text-left text-xs font-normal">
                {value.map((name) => {
                  if (
                    nameToInstagramMap[name as keyof typeof nameToInstagramMap]
                  ) {
                    return (
                      <a
                        key={name}
                        href={`https://www.instagram.com/${nameToInstagramMap[name as keyof typeof nameToInstagramMap]}`}
                        target="_blank"
                        className="break-words text-blue-500 underline"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    );
                  }
                  if (name.includes("@")) {
                    return (
                      <a
                        key={name}
                        href={`https://www.instagram.com/${name.split("@")[1]}`}
                        target="_blank"
                        className="break-words text-blue-500 underline"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    );
                  }
                  return (
                    <span className="break-words" key={name}>
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
  return (
    <div
      className="relative top-0 flex h-fit w-[150px] flex-col items-center justify-start rounded-md bg-white p-2"
      tabIndex={-1}
      style={{
        maxHeight: isExpanded ? "none" : "150px",
        height: isExpanded ? "350px" : "100%",
        width: isExpanded ? "350px" : "150px",
      }}
      data-song={`popup-${data.name}`}
    >
      <p className="text-center text-base font-bold">
        {data.artists.join(", ")}
      </p>
      <p className="text-center text-xs">{data.name}</p>
      <p className="text-center text-xs">{data.address}</p>
      {data?.isCustom && (
        <>
          <button
            type="button"
            className="absolute right-0 top-0"
            onClick={onDelete}
          >
            <SvgIcon html={closeIcon} className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute left-0 top-0"
            onClick={onEdit}
          >
            <SvgIcon html={editIcon} className="h-6 w-6" />
          </button>
        </>
      )}
      {isExpanded && contributorSection}
      {actionButtons}
      <button
        className={`absolute left-0 top-0`}
        type="button"
        onClick={() => {
          const { lastPopup, lastMarker } = useMapStore.getState();
          if (lastPopup && lastMarker) {
            uiStore.setSelectedLocation({
              value: "",
              artists: [],
              streetViewEmbed: "",
            });
            const params = new URLSearchParams(window.location.search);
            params.delete("title");
            const query = params.toString();
            const newUrl = query
              ? `${window.location.pathname}?${query}`
              : window.location.pathname;
            window.history.replaceState({}, "", newUrl);
            if (mapStore.lastPopup && mapStore.lastMarker) {
              hidePopup(
                mapStore.lastPopup,
                mapStore.lastMarker,
                mapStore.selectedLocationId ?? "",
              );
            }
            mapStore.clearSelectedLocation();
          }
        }}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
      {data.contributors && (
        <button
          className={`absolute right-0 top-0`}
          type="button"
          onClick={() => {
            setSelectedLocationCredits(data);
            posthog.capture("toggle_contributor_section", {
              artists: data.artists.join(", "),
              songTitle: data.name,
            });
          }}
        >
          <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
