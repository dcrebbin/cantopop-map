"use client";

import { type MappableLocationItem } from "~/app/common/lib";
import { youtubeIcon } from "~/lib/icons/youtubeIcon";
import { shareIcon } from "~/lib/icons/shareIcon";
import posthog from "posthog-js";
import { useUIStore } from "~/app/_state/ui.store";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

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
    <div className="mt-4 z-1 flex h-2 left-2 w-full items-center justify-center gap-2 text-black">
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
        <img
          src="/images/streetview.png"
          alt="Street View"
          className="size-6 mb-2"
        />
      </a>
      <a
        href={buildDirectionsUrl(data)}
        target="_blank"
        rel="noreferrer"
        aria-label="Open directions"
      >
        <img
          src="/images/gmaps.png"
          alt="Google Maps"
          className="size-6 mb-2"
        />
      </a>
      {data.contributors && (
        <button
          type="button"
          className="w-10 mb-1 relative bg-blue-500 rounded-lg  text-white flex items-center justify-center"
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
          <span className="cursor-pointer text-sm font-bold">幕後</span>
        </button>
      )}
    </div>
  );

  return (
    <div
      className="relative flex w-full select-text flex-col items-center justify-start gap-0 bg-white px-1 pb-2"
      tabIndex={-1}
      data-song={`popup-${data.name}`}
      data-popup-selectable=""
    >
      {actionButtons}
      <div className="flex w-full absolute top-8 z-10 flex-col items-center justify-center">
        {data.optionalActions && data.optionalActions.length > 0 && (
          <div className="flex w-full flex-col items-center justify-center gap-2 text-xs">
            {data.optionalActions.map((action) => (
              <div
                key={`${action.name}-${action.url}`}
                className="flex items-center justify-center text-blue-500 underline text-xs py-1"
              >
                <a
                  href={action.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={action.name}
                >
                  {action.name}
                </a>
                <GlobeAltIcon className="size-4" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
