import {
  lazy,
  memo,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMapStore } from "../_state/map.store";
import { useUIStore } from "../_state/ui.store";
import {
  ARTISTS,
  CONTRIBUTORS,
  CONTRIBUTOR_ROLE_GROUPS,
  constructTitle,
  nameToLocation,
  SONGS,
} from "../common/locations";
import { useIsOnMobile } from "../hooks/useIsOnMobile";
import { SvgIcon } from "./map/PopupContent";
import { arrowIcon } from "~/lib/icons/arrowIcon";
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getDisplayMode } from "../hooks/getDisplayMode";

const ContributorsList = lazy(() => import("./ContributorsList"));

const ARTISTS_LOWER = ARTISTS.map((a) => a.toLowerCase());
const SONGS_LOWER = SONGS.map((s) => ({
  name: s.name.toLowerCase(),
  artists: s.artists.map((a) => a.toLowerCase()),
}));
const CONTRIBUTORS_LOWER = CONTRIBUTORS.map((c) => c.toLowerCase());
const CONTRIBUTOR_ROLE_GROUPS_LOWER = CONTRIBUTOR_ROLE_GROUPS.map((g) => ({
  categoryTitle: g.category === "musicVideo" ? "music video" : "song",
  title: g.title.toLowerCase(),
  names: g.names,
}));

const SearchInput = memo(function SearchInput({
  searchRef,
  onSearchChange,
}: {
  searchRef: React.RefObject<HTMLInputElement> | null;
  onSearchChange: (search: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <input
      type="text"
      placeholder="Search"
      aria-label="Search songs, artists, and contributors"
      ref={searchRef}
      value={value}
      className="z-[200] w-full rounded-md border-none p-2"
      onChange={(e) => {
        const nextValue = e.target.value;
        setValue(nextValue);
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

  const { allMarkers, map } = useMapStore();
  const isOnMobile = useIsOnMobile();
  const hasAppliedUrlFiltersRef = useRef(false);
  const [searchResults, setSearchResults] = useState(() => ({
    artists: ARTISTS,
    songs: SONGS,
    contributors: CONTRIBUTORS,
  }));
  const updateMarkerVisibility = useCallback(
    (nextSelectedArtists: string[], nextSelectedContributors: string[]) => {
      for (const marker of allMarkers) {
        const markerArtists = marker.dataset.artist?.split(", ") ?? [];
        const markerContributors =
          marker.dataset.contributors?.split(", ") ?? [];

        const hasArtistFilter = nextSelectedArtists.length > 0;
        const hasContributorFilter = nextSelectedContributors.length > 0;

        const artistMatch =
          hasArtistFilter &&
          nextSelectedArtists.some((a) => markerArtists.includes(a));

        const contributorMatch =
          hasContributorFilter &&
          nextSelectedContributors.some((c) => markerContributors.includes(c));

        const hasAnyFilter = hasArtistFilter || hasContributorFilter;
        const shouldShow = !hasAnyFilter || artistMatch || contributorMatch;
        marker.style.display = shouldShow ? "block" : "none";
      }
    },
    [allMarkers],
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

  function handleContributorCheckboxChange(contributor: string) {
    const newSelectedContributors = selectedContributors.includes(contributor)
      ? selectedContributors.filter((c) => c !== contributor)
      : [...selectedContributors, contributor];
    setSelectedContributors(newSelectedContributors);
    updateMarkerVisibility(selectedArtists, newSelectedContributors);
  }

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchFrameRef = useRef<number | null>(null);

  const runSearch = useCallback(
    (search: string) => {
      const q = search.toLowerCase();

      if (q.length === 0) {
        startTransition(() => {
          setSearchResults({
            artists: ARTISTS,
            songs: SONGS,
            contributors: CONTRIBUTORS,
          });
        });
        return;
      }

      const artists: string[] = [];
      for (let i = 0; i < ARTISTS.length; i++) {
        if (ARTISTS_LOWER[i]!.includes(q)) artists.push(ARTISTS[i]!);
      }

      const songs: { name: string; artists: string[] }[] = [];
      for (let i = 0; i < SONGS.length; i++) {
        const lower = SONGS_LOWER[i]!;
        if (lower.name.includes(q)) {
          songs.push(SONGS[i]!);
          continue;
        }
        for (const artist of lower.artists) {
          if (artist.includes(q)) {
            songs.push(SONGS[i]!);
            break;
          }
        }
      }

      const contributorsSet = new Set<string>();
      for (let i = 0; i < CONTRIBUTORS.length; i++) {
        if (CONTRIBUTORS_LOWER[i]!.includes(q)) {
          contributorsSet.add(CONTRIBUTORS[i]!);
        }
      }
      for (const group of CONTRIBUTOR_ROLE_GROUPS_LOWER) {
        if (group.title.includes(q) || group.categoryTitle.includes(q)) {
          const names = group.names;
          for (const name of names) contributorsSet.add(name);
        }
      }

      const contributors = Array.from(contributorsSet);

      startTransition(() => {
        setSearchResults({ artists, songs, contributors });
      });
    },
    [setSearchResults],
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (searchFrameRef.current !== null) {
        cancelAnimationFrame(searchFrameRef.current);
        searchFrameRef.current = null;
      }
      searchDebounceRef.current = setTimeout(() => {
        searchFrameRef.current = requestAnimationFrame(() => {
          searchFrameRef.current = requestAnimationFrame(() => {
            runSearch(search);
            searchFrameRef.current = null;
          });
        });
      }, 120);
    },
    [runSearch],
  );

  useEffect(() => {
    const debounceRef = searchDebounceRef;
    const frameRef = searchFrameRef;

    return () => {
      const timeoutId = debounceRef.current;
      const frameId = frameRef.current;
      if (timeoutId) clearTimeout(timeoutId);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

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
    if (selectedArtists.length === 0 && selectedContributors.length === 0) {
      for (const marker of allMarkers) {
        marker.style.display = "block";
      }
    } else {
      updateMarkerVisibility(selectedArtists, selectedContributors);
    }
  }, [
    allMarkers,
    selectedArtists,
    selectedContributors,
    updateMarkerVisibility,
  ]);

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

    if (artistsParam) {
      const nextArtists = artistsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((a) => ARTISTS.includes(a));
      if (nextArtists.length > 0) {
        setSelectedArtists(nextArtists);
      }
    }

    if (contributorsParam) {
      const nextContributors = contributorsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((c) => CONTRIBUTORS.includes(c));
      if (nextContributors.length > 0) {
        setSelectedContributors(nextContributors);
      }
    }

    if (
      viewPortfolioParam &&
      selectedContributorParam &&
      CONTRIBUTORS.includes(selectedContributorParam)
    ) {
      setSelectedContributor(selectedContributorParam);
    }

    hasAppliedUrlFiltersRef.current = true;
  }, [setSelectedArtists, setSelectedContributors, setSelectedContributor]);

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
      artistsToShow: Array.from(nextArtistsToShow),
      songsByArtist: nextSongsByArtist,
    };
  }, [searchResults]);

  const isPWA = getDisplayMode() !== "browser";
  const MemoizedArrowDownTrayIcon = memo(ArrowDownTrayIcon);

  return (
    <div
      className="absolute right-0 top-0 m-0 flex flex-row gap-4"
      style={{ zIndex: menuOpen ? 999999 : 90 }}
    >
      {!isPWA && (
        <button
          type="button"
          name="Download PWA Tutorial"
          className="drop-shadow-[0_0_2px_rgba(0,0,0,1)] md:hidden"
          onClick={() => {
            setIsPwaTutorialVisible(true);
          }}
        >
          <MemoizedArrowDownTrayIcon className="block size-9 text-white" />
        </button>
      )}
      <div
        className="h-full w-fit"
        style={{ opacity: mobileCameraViewOpen ? 0 : 1 }}
      >
        <button
          type="button"
          disabled={mobileCameraViewOpen}
          className="relative z-20 mr-3 transition-transform duration-300 hover:scale-110"
          onClick={() => {
            setMenuOpen(!menuOpen);
            setTimeout(() => {
              searchRef?.current?.focus();
            }, 100);
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
          <div className="absolute right-0 top-0 z-30 mr-[0.9rem] mt-1 flex h-auto w-6 items-center justify-center rounded-full bg-blue-500 text-center text-white">
            {combinedFilters.length}
          </div>
        )}
      </div>
      <div
        className={`${menuOpen ? "block" : "hidden"} absolute right-0 top-0 z-10 -mt-1 max-h-[100vh] w-[100vw] rounded-md border-[3px] border-white/70 bg-black/20 p-2 drop-shadow-md backdrop-blur-md lg:max-h-[45rem] lg:w-[30rem] lg:bg-neutral-900/95 lg:backdrop-blur-none`}
        style={{ opacity: mobileCameraViewOpen ? 0 : 1 }}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <SearchInput
            searchRef={searchRef}
            onSearchChange={handleSearchChange}
          />

          <div className="flex h-[83vh] w-full flex-col gap-2 overflow-y-auto overflow-x-hidden pb-20 lg:h-[60vh]">
            <h3 className="text-white">Selected Filters</h3>
            {combinedFilters.length === 0 && (
              <p className="my-1 text-center text-white">No selected filters</p>
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
                  className={`text-white ${songsAndArtistsOpen ? "" : "rotate-180"}`}
                  onClick={() => setSongsAndArtistsOpen(!songsAndArtistsOpen)}
                >
                  <ChevronDownIcon className="size-6" />
                </button>
              </div>
              {songsAndArtistsOpen && (
                <div className="flex w-full flex-col gap-2">
                  {artistsToShow.map((artist: string) => {
                    const songsForArtist = songsByArtist.get(artist) ?? [];
                    if (songsForArtist.length === 0) return null;
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
                        <div className="mr-1 mt-1 flex flex-col gap-1 px-6">
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
                    filteredContributors={searchResults.contributors}
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
    </div>
  );
}
