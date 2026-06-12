import {
  ShareIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getContributorDisplayName,
  getContributorInstagram,
  getContributorName,
  humanizeRoleKey,
  type ContributorCredit,
  type LocationItem,
} from "../common/locations";
import { nameToInstagramMap } from "../common/social-media";
import { useUIStore } from "../_state/ui.store";
import { InstagramIcon } from "~/lib/icons/instagramIcon";

function removeCreditsModalUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("view-credits");
  window.history.replaceState({}, "", url.toString());
}

function getInstagram(contributor: ContributorCredit) {
  const name = getContributorName(contributor);
  return (
    getContributorInstagram(contributor) ??
    nameToInstagramMap[name as keyof typeof nameToInstagramMap]
  );
}

export default function CreditsModal() {
  const {
    selectedLocationCredits,
    setSelectedLocationCredits,
    setSelectedContributor,
  } = useUIStore();

  if (!selectedLocationCredits) return null;

  function showContributorPortfolio(contributor: string) {
    setSelectedContributor(contributor);
    setSelectedLocationCredits(null as unknown as LocationItem);

    const url = new URL(window.location.href);
    url.searchParams.delete("title");
    url.searchParams.delete("view-credits");
    url.searchParams.set("selected-contributor", contributor);
    url.searchParams.set("view-portfolio", "true");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999999] flex items-center justify-center bg-transparent text-white">
      <div className="pointer-events-auto absolute top-14 z-10 mx-2 mt-5 flex max-h-[76vh] min-h-[20rem] w-[98%] max-w-[50rem] flex-col overflow-y-auto rounded-md border-[3px] border-white/50 bg-black/[25%] p-4 drop-shadow-md backdrop-blur-lg xl:top-5 xl:max-h-[65vh] xl:w-full">
        <div className="z-30 flex items-start justify-between gap-2">
          <div className="w-full border-b border-white/70 pb-2">
            <h1 className="font-serif text-2xl font-bold drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]">
              {selectedLocationCredits?.name}
            </h1>
            <h2 className="text-xl text-white/70 drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]">
              {selectedLocationCredits?.artists.join(", ")}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-full p-1 hover:bg-white/10"
            onClick={() => {
              setSelectedLocationCredits(null as unknown as LocationItem);
              removeCreditsModalUrl();
            }}
          >
            <XMarkIcon className="h-9 w-9 drop-shadow-[0_0_4px_rgba(0,0,0,1)] xl:h-6 xl:w-6" />
          </button>
        </div>
        <div className="z-30 flex w-full flex-col items-center justify-start overflow-x-hidden overflow-y-auto font-bold">
          <h3 className="text-center">Song</h3>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))]">
            {Object.entries(
              selectedLocationCredits?.contributors?.song ?? {},
            ).map(([key, value]) => (
              <div
                className="flex min-w-0 flex-col items-start justify-start"
                key={key}
              >
                <p className="min-w-0 text-base break-words xl:text-sm">
                  {humanizeRoleKey(key)} <br></br>
                </p>
                <div className="max-w-full min-w-0 text-left text-xs font-normal">
                  {value.map((name) => {
                    const displayName = getContributorDisplayName(name);
                    const instagram = getInstagram(name);
                    return (
                      <span
                        key={displayName}
                        className="flex max-w-full min-w-0 flex-wrap items-center gap-1 text-base break-words xl:text-sm"
                      >
                        {displayName}
                        <button
                          type="button"
                          onClick={() => {
                            showContributorPortfolio(displayName);
                          }}
                        >
                          <UserCircleIcon className="h-8 w-8 xl:h-5 xl:w-5" />
                        </button>
                        {instagram ? (
                          <a
                            href={`https://www.instagram.com/${instagram}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <InstagramIcon className="h-8 w-auto xl:h-5 xl:w-auto" />
                          </a>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <hr className="my-1 w-full text-white" />
          <h3 className="text-md text-center">Music Video</h3>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))]">
            {Object.entries(
              selectedLocationCredits?.contributors?.musicVideo ?? {},
            ).map(([key, value]) => (
              <div
                className="flex w-full min-w-0 flex-col items-start justify-start"
                key={key}
              >
                <p className="min-w-0 text-base break-words xl:text-sm">
                  {humanizeRoleKey(key)} <br></br>
                </p>
                <div className="max-w-full min-w-0 text-left font-normal xl:text-xs">
                  {value.map((name) => {
                    const displayName = getContributorDisplayName(name);
                    const instagram = getInstagram(name);
                    return (
                      <span
                        key={displayName}
                        className="flex max-w-full min-w-0 flex-wrap items-center gap-1 text-base break-words xl:text-sm"
                      >
                        {displayName}
                        <button
                          type="button"
                          onClick={() => {
                            showContributorPortfolio(displayName);
                          }}
                        >
                          <UserCircleIcon className="h-8 w-8 xl:h-5 xl:w-5" />
                        </button>
                        {instagram ? (
                          <a
                            href={`https://www.instagram.com/${instagram}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <InstagramIcon className="h-8 w-auto xl:h-5 xl:w-auto" />
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
        <div className="flex flex-col items-center justify-center">
          <div className="mt-2 text-center text-sm text-white/70">
            Any errors or missing credits? Please contact at{" "}
            <a
              href="mailto:devon@langpal.com.hk?subject=Cantopop地圖"
              className="underline"
            >
              devon@langpal.com.hk
            </a>
          </div>
          <button
            className="pointer-events-auto absolute right-8 bottom-0 m-4 cursor-pointer"
            type="button"
            onClick={async () => {
              if (navigator.share) {
                await navigator.share({
                  title: ``,
                  url: document.URL,
                });
              } else {
                alert(
                  "Your browser does not support sharing. Please copy the link manually.",
                );
              }
            }}
          >
            <ShareIcon className="h-9 w-9 drop-shadow-[0_0_4px_rgba(0,0,0,1)] xl:h-6 xl:w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
