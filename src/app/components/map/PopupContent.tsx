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
    <div className="flex w-full flex-col items-start justify-start overflow-y-auto font-bold">
      <h3 className="my-1 text-base">Contributors</h3>
      <hr className="my-1 w-full text-black" />

      <h3>Song</h3>
      <div className="grid w-full grid-cols-2 gap-2">
        {Object.entries(data.contributors?.song ?? {}).map(([key, value]) => (
          <div className="flex flex-col items-start justify-start" key={key}>
            <p>
              {humanizeRoleKey(key)} <br></br>
            </p>
            <div className="flex flex-col gap-1 text-left text-xs font-normal">
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
                          className="text-blue-500 underline"
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
                          className="text-blue-500 underline"
                          rel="noreferrer"
                        >
                          {name}
                        </a>
                      );
                    }

                    return <span key={name}>{name}</span>;
                  })
                : null}
            </div>
          </div>
        ))}
      </div>
      <hr className="my-1 w-full text-black" />
      <h3 className="text-md">Music Video</h3>
      <div className="grid w-full grid-cols-2 gap-2">
        {Object.entries(data.contributors?.musicVideo ?? {}).map(
          ([key, value]) => (
            <div
              className="flex w-full flex-col items-start justify-start"
              key={key}
            >
              <p>
                {humanizeRoleKey(key)} <br></br>
              </p>
              <div className="flex flex-col gap-1 text-left text-xs font-normal">
                {value.map((name) => {
                  if (
                    nameToInstagramMap[name as keyof typeof nameToInstagramMap]
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
                  if (name.includes("@")) {
                    return (
                      <a
                        key={name}
                        href={`https://www.instagram.com/${name.split("@")[1]}`}
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
      {data.contributors && (
        <button
          className={`absolute right-0 top-0`}
          type="button"
          onClick={() => {
            setIsExpanded(!isExpanded);
            posthog.capture("toggle_contributor_section", {
              artists: data.artists.join(", "),
              songTitle: data.name,
            });
          }}
        >
          <SvgIcon
            html={isExpanded ? minusIcon : plusIcon}
            className={`h-6 w-6`}
          />
        </button>
      )}
    </div>
  );
}
