"use client";

import { type MappableLocationItem } from "~/app/common/locations";
import { youtubeIcon } from "~/lib/icons/youtubeIcon";
import { shareIcon } from "~/lib/icons/shareIcon";
import { streetViewIcon } from "~/lib/icons/streetViewIcon";
import { locationIcon } from "~/lib/icons/locationIcon";
import { useState } from "react";
import posthog from "posthog-js";
import { useUIStore } from "~/app/_state/ui.store";
import { ArrowUpRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { hidePopup } from "~/lib/custom-map";
import { useMapStore } from "~/app/_state/map.store";

function buildDirectionsUrl(data: MappableLocationItem) {
  return `https://www.google.com/maps/dir//${data.lat},${data.lng}/`;
}

function buildStreetViewUrl(data: MappableLocationItem) {
  return (
    data.streetView ??
    `https://www.google.com/maps/@${data.lat},${data.lng},18z`
  );
}

async function shareLocation(data: MappableLocationItem) {
  const shareData = {
    title: `Checkout this Cantopop地圖 location from ${data.artists.join(", ")}`,
    url: document.URL,
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  const params = new URLSearchParams({
    text: shareData.title,
    url: shareData.url,
  });
  window.open(
    `https://twitter.com/intent/tweet?${params.toString()}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function SvgIcon({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center leading-none [&>svg]:h-full [&>svg]:w-full ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function PopupContent({
  data,
  onDelete: _onDelete,
  onEdit: _onEdit,
}: {
  data: MappableLocationItem;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const [isExpanded] = useState(false);

  const { setSelectedLocationCredits } = useUIStore();
  const mapStore = useMapStore();
  const uiStore = useUIStore();

  const actionButtons = (
    <div className="mt-2 flex w-full items-center justify-center gap-2 text-black">
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        aria-label="Open YouTube video"
      >
        <SvgIcon html={youtubeIcon} className="size-7" />
      </a>
      <button
        type="button"
        aria-label="Share location"
        onClick={() => void shareLocation(data)}
      >
        <SvgIcon html={shareIcon} className="size-6" />
      </button>
      <a
        href={buildStreetViewUrl(data)}
        target="_blank"
        rel="noreferrer"
        aria-label="Open Street View"
      >
        <SvgIcon html={streetViewIcon} className="size-6" />
      </a>
      <a
        href={buildDirectionsUrl(data)}
        target="_blank"
        rel="noreferrer"
        aria-label="Open directions"
      >
        <SvgIcon html={locationIcon} className="size-6" />
      </a>
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

      {actionButtons}
      <button
        className={`absolute top-0 left-0`}
        type="button"
        aria-label="Close location popup"
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
        <XMarkIcon className="size-4" />
      </button>
      {data.contributors && (
        <button
          className={`absolute top-0 right-0`}
          type="button"
          aria-label="Open location credits"
          onClick={() => {
            setSelectedLocationCredits(data);
            const url = new URL(window.location.href);
            url.searchParams.set("view-credits", "true");
            window.history.replaceState({}, "", url.toString());
            posthog.capture("toggle_contributor_section", {
              artists: data.artists.join(", "),
              songTitle: data.name,
            });
          }}
        >
          <ArrowUpRightIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
