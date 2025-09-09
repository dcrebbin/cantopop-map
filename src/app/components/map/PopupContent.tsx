"use client";

import { type LocationItem } from "~/app/common/locations";
import { youtubeIcon } from "~/lib/icons/youtubeIcon";
import { shareIcon } from "~/lib/icons/shareIcon";
import { streetViewIcon } from "~/lib/icons/streetViewIcon";
import { locationIcon } from "~/lib/icons/locationIcon";
import { closeIcon } from "~/lib/icons/closeIcon";
import { editIcon } from "~/lib/icons/editIcon";

function SvgIcon({ html, className }: { html: string; className?: string }) {
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
  return (
    <div
      className="top-24 flex h-fit min-w-[90px] max-w-[150px] flex-col items-center justify-center rounded-md bg-white p-2"
      tabIndex={-1}
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
    </div>
  );
}
