import { UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { humanizeRoleKey, type LocationItem } from "../common/locations";
import { nameToInstagramMap } from "../common/social-media";
import { useUIStore } from "../_state/ui.store";
import { instagramIcon } from "~/lib/icons/instagramIcon";
import { SvgIcon } from "./map/PopupContent";

export default function CreditsModal() {
  const {
    selectedLocationCredits,
    setSelectedLocationCredits,
    setSelectedContributor,
  } = useUIStore();

  if (!selectedLocationCredits) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] flex items-center justify-center bg-transparent text-white">
      <div className="pointer-events-auto absolute top-14 z-10 mx-2 mt-5 flex max-h-[60vh] min-h-[20rem] w-[98%] max-w-[50rem] flex-col overflow-y-auto rounded-md border-[3px] border-white/70 bg-black/[25%] p-4 drop-shadow-md backdrop-blur-lg xl:top-5 xl:w-full">
        <div className="z-30 flex items-start justify-between gap-2">
          <div className="w-full border-b border-white/70 pb-2">
            <h1 className="font-serif text-2xl font-bold">
              {selectedLocationCredits?.artists.join(", ")}
              {" - "}
              {selectedLocationCredits?.name}
            </h1>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-full p-1 hover:bg-white/10"
            onClick={() => {
              setSelectedLocationCredits(null as unknown as LocationItem);
            }}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="z-30 flex w-full flex-col items-start justify-start overflow-y-auto overflow-x-hidden font-bold">
          <h3>Song</h3>
          <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-2">
            {Object.entries(
              selectedLocationCredits?.contributors?.song ?? {},
            ).map(([key, value]) => (
              <div
                className="flex min-w-0 flex-col items-start justify-start"
                key={key}
              >
                <p className="min-w-0 break-words">
                  {humanizeRoleKey(key)} <br></br>
                </p>
                <div className="min-w-0 max-w-full text-left text-xs font-normal">
                  {value.map((name) => {
                    return (
                      <span
                        key={name}
                        className="flex min-w-0 max-w-full flex-wrap items-center gap-1 break-words"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContributor(name);
                            setSelectedLocationCredits(
                              null as unknown as LocationItem,
                            );
                          }}
                        >
                          <UserCircleIcon className="h-5 w-5" />
                        </button>
                        {nameToInstagramMap[
                          name as keyof typeof nameToInstagramMap
                        ] ? (
                          <a
                            href={`https://www.instagram.com/${nameToInstagramMap[name as keyof typeof nameToInstagramMap]}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <SvgIcon
                              html={instagramIcon}
                              className="mb-2 h-4 w-auto"
                            />
                          </a>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <hr className="my-1 w-full text-black" />
          <h3 className="text-md">Music Video</h3>
          <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-2">
            {Object.entries(
              selectedLocationCredits?.contributors?.musicVideo ?? {},
            ).map(([key, value]) => (
              <div
                className="flex w-full min-w-0 flex-col items-start justify-start"
                key={key}
              >
                <p className="min-w-0 break-words">
                  {humanizeRoleKey(key)} <br></br>
                </p>
                <div className="min-w-0 max-w-full text-left text-xs font-normal">
                  {value.map((name) => {
                    return (
                      <span
                        key={name}
                        className="flex min-w-0 max-w-full flex-wrap items-center gap-1 break-words"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContributor(name);
                            setSelectedLocationCredits(
                              null as unknown as LocationItem,
                            );
                          }}
                        >
                          <UserCircleIcon className="h-5 w-5" />
                        </button>
                        {nameToInstagramMap[
                          name as keyof typeof nameToInstagramMap
                        ] ? (
                          <a
                            href={`https://www.instagram.com/${nameToInstagramMap[name as keyof typeof nameToInstagramMap]}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <SvgIcon
                              html={instagramIcon}
                              className="mb-2 h-4 w-auto"
                            />
                          </a>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
