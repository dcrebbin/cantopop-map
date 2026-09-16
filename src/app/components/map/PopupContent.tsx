"use client";

import { type MappableLocationItem } from "~/app/common/lib";
import { youtubeIcon } from "~/lib/icons/youtubeIcon";
import { shareIcon } from "~/lib/icons/shareIcon";
import { streetViewIcon } from "~/lib/icons/streetViewIcon";
import { locationIcon } from "~/lib/icons/locationIcon";
import posthog from "posthog-js";
import { useUIStore } from "~/app/_state/ui.store";
import { ArrowUpRightIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

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
  onClose,
  onDelete: _onDelete,
  onEdit: _onEdit,
}: {
  data: MappableLocationItem;
  onClose?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const { setSelectedLocationCredits } = useUIStore();

  const actionButtons = (
    <div className="mt-7 flex h-2 w-full items-center justify-center gap-2 text-black">
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
        <SvgIcon html={shareIcon} className="size-6 cursor-pointer" />
      </button>
      <a
        hidden={!data.streetView}
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
      className="relative flex w-full flex-col items-center justify-start gap-1 bg-white px-1 pt-1 pb-2"
      tabIndex={-1}
      data-song={`popup-${data.name}`}
    >
      <div className="absolute top-0 left-0 flex w-full items-center justify-between gap-2 p-2 text-black">
        <button
          type="button"
          aria-label="Collapse location details"
          onClick={onClose}
        >
          <ChevronDownIcon className="size-4 cursor-pointer" />
        </button>
        {data.contributors && (
          <button
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
            <ArrowUpRightIcon className="size-4 cursor-pointer" />
          </button>
        )}
      </div>
      {actionButtons}
      <div className="flex w-full flex-col items-center justify-center">
        <p className="text-center text-[0.6rem] leading-none tracking-tight pt-2">
          {data.address}
        </p>
      </div>
    </div>
  );
}
