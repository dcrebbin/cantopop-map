import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

type MenuAnimationState = {
  rendered: boolean;
  animatedOpen: boolean;
};

type MenuAnimationAction =
  | { type: "OPEN_START" }
  | { type: "OPEN_ANIMATE" }
  | { type: "CLOSE_START" }
  | { type: "CLOSE_COMPLETE" };

function menuAnimationReducer(
  state: MenuAnimationState,
  action: MenuAnimationAction,
): MenuAnimationState {
  switch (action.type) {
    case "OPEN_START":
      return { rendered: true, animatedOpen: false };
    case "OPEN_ANIMATE":
      return { ...state, animatedOpen: true };
    case "CLOSE_START":
      return { ...state, animatedOpen: false };
    case "CLOSE_COMPLETE":
      return { rendered: false, animatedOpen: false };
    default:
      return state;
  }
}
import { searchCatalog, normalizeSearch } from "../common/search";
import { useMapStore } from "../_state/map.store";
import { useUIStore } from "../_state/ui.store";
import {
  ARTISTS,
  CONTRIBUTORS,
  constructTitle,
  nameToLocation,
} from "../common/lib";
import { setMarkerFilters } from "~/lib/custom-map";
import { useIsOnMobile } from "../hooks/useIsOnMobile";
import { SvgIcon } from "./map/PopupContent";
import { arrowIcon } from "~/lib/icons/arrowIcon";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getDisplayMode } from "../hooks/getDisplayMode";

const ContributorsList = lazy(() => import("./ContributorsList"));

const ARTISTS_SET = new Set(ARTISTS);
const CONTRIBUTORS_SET = new Set(CONTRIBUTORS);
const MENU_ANIMATION_MS = 300;

const SearchInput = memo(function SearchInput({
  searchRef,
  onSearchChange,
  value,
}: {
  searchRef: React.RefObject<HTMLInputElement> | null;
  onSearchChange: (search: string) => void;
  value: string;
}) {
  return (
    <input
      type="text"
      placeholder="Search"
      aria-label="Search roles, songs, artists, and people"
      ref={searchRef}
      value={value}
      className="z-200 w-full rounded-md border-2 border-white p-2 text-white"
      onChange={(e) => {
        const nextValue = e.target.value;
        onSearchChange(nextValue);
      }}
    />
  );
});

export default function Menu() {
  const {
    menuOpen,
    setMenuOpen,
    searchRef,
    selectedArtists,
    setSelectedArtists,
    selectedContributors,
    setSelectedContributors,
    setNewLocationModalOpen,
    songsAndArtistsOpen,
    setSongsAndArtistsOpen,
    contributorsOpen,
    setContributorsOpen,
    setIsPwaTutorialVisible,
    combinedFilters,
    setCombinedFilters,
    mobileCameraViewOpen,
    selectedContributor,
    setSelectedContributor,
    setSelectedLocationCredits,
  } = useUIStore();

  const map = useMapStore((state) => state.map);
  const isOnMobile = useIsOnMobile();
  const hasAppliedUrlFiltersRef = useRef(false);
  const [menuAnimation, dispatchMenuAnimation] = useReducer(
    menuAnimationReducer,
    menuOpen,
    (open) => ({ rendered: open, animatedOpen: open }),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchChange = useCallback(
    (query: string) => {
      if (!normalizeSearch(searchQuery) && normalizeSearch(query)) {
        setSongsAndArtistsOpen(true);
        setContributorsOpen(true);
      }
      setSearchQuery(query);
    },
    [searchQuery, setSongsAndArtistsOpen, setContributorsOpen],
  );
  const searchResults = useMemo(
    () => searchCatalog(searchQuery),
    [searchQuery],
  );
  const updateMarkerVisibility = useCallback(
    (nextSelectedArtists: string[], nextSelectedContributors: string[]) => {
      setMarkerFilters(map, nextSelectedArtists, nextSelectedContributors);
    },
    [map],
  );

  const syncFiltersToUrl = useCallback(
    (artists: string[], contributors: string[]) => {
      const params = new URLSearchParams(window.location.search);
      const title = params.get("title");

      const shouldShowPortfolio = Boolean(selectedContributor);
      if (shouldShowPortfolio) {
        params.set("view-portfolio", "true");
      } else {
        params.delete("view-portfolio");
      }

      if (artists.length > 0) {
        params.set("artists", artists.join(","));
      } else {
        params.delete("artists");
      }

      if (contributors.length > 0) {
        params.set("contributors", contributors.join(","));
      } else {
        params.delete("contributors");
      }

      if (title) {
        params.set("title", title);
      }

      const query = params.toString();
      const newUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    },
    [selectedContributor],
  );

  const syncSelectedSongToUrl = useCallback(
    (title: string, shouldShowCredits: boolean) => {
      const params = new URLSearchParams(window.location.search);
      params.set("title", title);
      if (shouldShowCredits) {
        params.set("view-credits", "true");
      } else {
        params.delete("view-credits");
      }

      const query = params.toString();
      const newUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.pushState({}, "", newUrl);
    },
    [],
  );

  function handleArtistCheckboxChange(artist: string) {
    const newSelectedArtists = selectedArtists.includes(artist)
      ? selectedArtists.filter((a) => a !== artist)
      : [...selectedArtists, artist];
    setSelectedArtists(newSelectedArtists);
    updateMarkerVisibility(newSelectedArtists, selectedContributors);
  }

  const handleContributorCheckboxChange = useCallback(
    (contributor: string) => {
      const newSelectedContributors = selectedContributors.includes(contributor)
        ? selectedContributors.filter((c) => c !== contributor)
        : [...selectedContributors, contributor];
      setSelectedContributors(newSelectedContributors);
      updateMarkerVisibility(selectedArtists, newSelectedContributors);
    },
    [
      selectedContributors,
      selectedArtists,
      setSelectedContributors,
      updateMarkerVisibility,
    ],
  );

  useEffect(() => {
    if (menuOpen) {
      dispatchMenuAnimation({ type: "OPEN_START" });
      let openFrame = 0;
      const startFrame = requestAnimationFrame(() => {
        openFrame = requestAnimationFrame(() =>
          dispatchMenuAnimation({ type: "OPEN_ANIMATE" }),
        );
      });
      return () => {
        cancelAnimationFrame(startFrame);
        cancelAnimationFrame(openFrame);
      };
    }

    dispatchMenuAnimation({ type: "CLOSE_START" });
  }, [menuOpen]);

  function handleMenuTransitionEnd(
    event: React.TransitionEvent<HTMLDivElement>,
  ) {
    if (event.target !== event.currentTarget) return;
    if (!menuOpen) {
      dispatchMenuAnimation({ type: "CLOSE_COMPLETE" });
    }
  }

  function handleSongSelection(song: { name: string; artists: string[] }) {
    const title = constructTitle(song);

    if (isOnMobile) {
      setMenuOpen(false);
    }
    const location = nameToLocation[title];
    if (location) {
      if (location.lat === null || location.lng === null) {
        syncSelectedSongToUrl(title, true);
        setSelectedLocationCredits(location);
        return;
      }
      syncSelectedSongToUrl(title, false);
      if (!map) return;
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: 15,
      });
    }
  }

  useEffect(() => {
    updateMarkerVisibility(selectedArtists, selectedContributors);
  }, [map, selectedArtists, selectedContributors, updateMarkerVisibility]);

  useEffect(() => {
    if (!hasAppliedUrlFiltersRef.current) return;
    syncFiltersToUrl(selectedArtists, selectedContributors);
  }, [selectedArtists, selectedContributors, syncFiltersToUrl]);

  useEffect(() => {
    const nextCombined = [
      ...selectedArtists.map((name) => ({ type: "artist" as const, name })),
      ...selectedContributors.map((name) => ({
        type: "contributor" as const,
        name,
      })),
    ];
    setCombinedFilters(nextCombined);
  }, [selectedArtists, selectedContributors, setCombinedFilters]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const artistsParam = params.get("artists");
    const contributorsParam = params.get("contributors");
    const selectedContributorParam = params.get("selected-contributor");
    const viewPortfolioParam = params.get("view-portfolio");

    const urlFilters: {
      artists?: string[];
      contributors?: string[];
      selectedContributor?: string;
    } = {};

    if (artistsParam) {
      const nextArtists = artistsParam.split(",").flatMap((segment) => {
        const trimmed = segment.trim();
        return trimmed && ARTISTS_SET.has(trimmed) ? [trimmed] : [];
      });
      if (nextArtists.length > 0) {
        urlFilters.artists = nextArtists;
      }
    }

    if (contributorsParam) {
      const nextContributors = contributorsParam
        .split(",")
        .flatMap((segment) => {
          const trimmed = segment.trim();
          return trimmed && CONTRIBUTORS_SET.has(trimmed) ? [trimmed] : [];
        });
      if (nextContributors.length > 0) {
        urlFilters.contributors = nextContributors;
      }
    }

    if (
      viewPortfolioParam &&
      selectedContributorParam &&
      CONTRIBUTORS_SET.has(selectedContributorParam)
    ) {
      urlFilters.selectedContributor = selectedContributorParam;
    }

    useUIStore.getState().applyUrlFiltersFromParams(urlFilters);
    hasAppliedUrlFiltersRef.current = true;
  }, []);

  const { artistsToShow, songsByArtist } = useMemo(() => {
    const nextArtistsToShow = new Set(searchResults.artists);
    const nextSongsByArtist = new Map<
      string,
      { name: string; artists: string[] }[]
    >();

    for (const song of searchResults.songs) {
      for (const artist of song.artists) {
        nextArtistsToShow.add(artist);
        const songs = nextSongsByArtist.get(artist);
        if (songs) {
          songs.push(song);
        } else {
          nextSongsByArtist.set(artist, [song]);
        }
      }
    }

    return {
      artistsToShow: Array.from(nextArtistsToShow).sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { sensitivity: "base" }),
      ),

      songsByArtist: nextSongsByArtist,
    };
  }, [searchResults]);

  return (
    <div
      className="absolute top-0 right-0 m-0 flex flex-row gap-4"
      style={{ zIndex: menuAnimation.rendered ? 999999 : 90 }}
    >
      <div
        className="h-full w-fit"
        style={{ opacity: mobileCameraViewOpen ? 0 : 1 }}
      >
        <button
          type="button"
          disabled={mobileCameraViewOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="relative z-20 mr-3 transition-transform duration-300 hover:scale-110"
          onClick={() => {
            setMenuOpen(!menuOpen);
            if (!menuOpen) {
              setTimeout(() => {
                searchRef?.current?.focus();
              }, MENU_ANIMATION_MS);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="white"
            className={
              "m-2 size-10 drop-shadow-[0_0_2px_rgba(0,0,0,1)] " +
              (menuOpen ? "rotate-90 transition-transform duration-300" : "")
            }
          >
            <title>Menu</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </button>
        {combinedFilters.length > 0 && (
          <div className="absolute top-0 right-0 z-30 mt-1 mr-[0.9rem] flex h-auto w-6 items-center justify-center rounded-full bg-blue-500 text-center text-white">
            {combinedFilters.length}
          </div>
        )}
      </div>
      {menuAnimation.rendered && (
        <div
          className={`absolute top-0 right-0 z-10 -mt-1 max-h-screen w-screen rounded-md border-[3px] border-white bg-black/40 p-2 drop-shadow-md backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none lg:max-h-180 lg:w-120 ${
            menuAnimation.animatedOpen
              ? "translate-x-0"
              : "pointer-events-none translate-x-full motion-reduce:translate-x-0"
          }`}
          style={{ opacity: mobileCameraViewOpen ? 0 : undefined }}
          onTransitionEnd={handleMenuTransitionEnd}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <SearchInput
              searchRef={searchRef}
              onSearchChange={handleSearchChange}
              value={searchQuery}
            />

            <div className="flex h-[83vh] w-full flex-col gap-2 overflow-x-hidden overflow-y-auto pb-20 lg:h-[60vh]">
              <h3 className="text-white">Selected Filters</h3>
              {combinedFilters.length === 0 && (
                <p className="my-1 text-center text-white">
                  No selected filters
                </p>
              )}
              <div>
                {combinedFilters.map((filter) => (
                  <button
                    onClick={() => {
                      if (filter.type === "artist") {
                        const next = selectedArtists.filter(
                          (a) => a !== filter.name,
                        );
                        setSelectedArtists(next);
                        updateMarkerVisibility(next, selectedContributors);
                      } else {
                        const next = selectedContributors.filter(
                          (c) => c !== filter.name,
                        );
                        setSelectedContributors(next);
                        updateMarkerVisibility(selectedArtists, next);
                      }
                    }}
                    type="button"
                    className="mx-2 flex items-center justify-between gap-1 rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
                    key={`${filter.type}:${filter.name}`}
                  >
                    <span>{filter.name}</span>
                    <XMarkIcon className="size-6" />
                  </button>
                ))}
              </div>
              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full flex-row items-center justify-between gap-2">
                  <h2 className="text-white">Artists & Songs</h2>
                  <button
                    type="button"
                    aria-label={
                      songsAndArtistsOpen
                        ? "Collapse artists and songs"
                        : "Expand artists and songs"
                    }
                    className={`text-white ${songsAndArtistsOpen ? "" : "rotate-180"}`}
                    onClick={() => setSongsAndArtistsOpen(!songsAndArtistsOpen)}
                  >
                    <ChevronDownIcon className="size-6" />
                  </button>
                </div>
                {songsAndArtistsOpen && (
                  <div className="flex w-full flex-col gap-2">
                    {artistsToShow.length === 0 && (
                      <p className="py-4 text-center text-sm text-white/70">
                        No songs or artists found.
                      </p>
                    )}
                    {artistsToShow.map((artist: string) => {
                      const songsForArtist = songsByArtist.get(artist) ?? [];
                      return (
                        <div
                          key={artist}
                          className="flex w-full flex-col pr-2 text-white"
                        >
                          <div className="flex w-full flex-row items-center justify-between gap-2 pr-2">
                            <span className="text-base">{artist}</span>
                            <button
                              type="button"
                              className="flex cursor-pointer items-center gap-2 text-left"
                              onClick={() => handleArtistCheckboxChange(artist)}
                            >
                              <input
                                type="checkbox"
                                aria-label={artist}
                                className="size-4 cursor-pointer rounded-full border-none p-2"
                                checked={selectedArtists.includes(artist)}
                                readOnly
                              />
                            </button>
                          </div>
                          <div className="mt-1 mr-1 flex flex-col gap-1 px-6">
                            {songsForArtist.map((song) => (
                              <button
                                key={`${artist}-${song.name}`}
                                type="button"
                                className="flex w-full cursor-pointer items-center justify-between text-left underline"
                                onClick={() => handleSongSelection(song)}
                              >
                                <span className="truncate text-sm">
                                  {song.name}
                                </span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="white"
                                  className="size-5"
                                >
                                  <title>Select</title>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                  />
                                </svg>
                              </button>
                            ))}
                          </div>
                          <hr className="my-1 opacity-30" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full flex-row items-center justify-between gap-2">
                  <h2 className="text-white">Contributors</h2>
                  <button
                    type="button"
                    aria-label={
                      contributorsOpen
                        ? "Collapse contributors"
                        : "Expand contributors"
                    }
                    className={`text-white ${contributorsOpen ? "" : "rotate-180"}`}
                    onClick={() => setContributorsOpen(!contributorsOpen)}
                  >
                    <SvgIcon html={arrowIcon} className="size-6" />
                  </button>
                </div>

                {contributorsOpen && (
                  <Suspense
                    fallback={
                      <div className="flex w-full items-center justify-center py-4 text-white">
                        <div className="animate-pulse">
                          Loading contributors…
                        </div>
                      </div>
                    }
                  >
                    <ContributorsList
                      groups={searchResults.contributorGroups}
                      selectedContributors={selectedContributors}
                      handleContributorCheckboxChange={
                        handleContributorCheckboxChange
                      }
                    />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
