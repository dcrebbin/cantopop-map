import { useEffect } from "react";
import { useMapStore } from "../_state/map.store";
import { useUIStore } from "../_state/ui.store";
import {
  ARTISTS,
  constructTitle,
  nameToLocation,
  SONGS,
} from "../common/locations";
import { useIsOnMobile } from "../hooks/useIsOnMobile";

export default function Menu() {
  const {
    menuOpen,
    setMenuOpen,
    searchRef,
    selectedArtists,
    setSelectedArtists,
    filteredArtists,
    setFilteredArtists,
    filteredSongs,
    setFilteredSongs,
    setNewLocationModalOpen,
  } = useUIStore();

  const { allMarkers, map } = useMapStore();
  const isOnMobile = useIsOnMobile();

  function handleArtistCheckboxChange(artist: string) {
    const newSelectedArtists = selectedArtists.includes(artist)
      ? selectedArtists.filter((a) => a !== artist)
      : [...selectedArtists, artist];

    setSelectedArtists(newSelectedArtists);

    allMarkers.forEach((marker) => {
      const markerArtists = marker.dataset.artist?.split(", ") ?? [];

      if (newSelectedArtists.length === 0) {
        marker.style.display = "block";
      } else {
        const hasSelectedArtist = newSelectedArtists.some((selectedArtist) =>
          markerArtists.includes(selectedArtist),
        );
        marker.style.display = hasSelectedArtist ? "block" : "none";
      }
    });
  }

  function handleSearchChange(search: string) {
    const artists = ARTISTS.filter((artist) => artist.includes(search));
    const songs = SONGS.filter(
      (song) =>
        song.name.includes(search) ||
        song.artists.some((artist) => artist.includes(search)),
    );
    setFilteredArtists(artists);
    setFilteredSongs(songs);
  }

  function handleSongSelection(song: { name: string; artists: string[] }) {
    const title = constructTitle(song);

    if (isOnMobile) {
      setMenuOpen(false);
    }
    const location = nameToLocation[title];
    if (location) {
      if (!map) return;
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: 15,
      });
    }
  }

  useEffect(() => {
    if (selectedArtists.length === 0) {
      allMarkers.forEach((marker) => {
        marker.style.display = "block";
      });
    }
  }, [allMarkers, selectedArtists]);

  const artistsToShow = Array.from(
    new Set([
      ...filteredArtists,
      ...filteredSongs.flatMap((song) => song.artists),
    ]),
  );

  return (
    <div className="absolute right-0 top-0 z-[100] m-0 p-8">
      <button
        type="button"
        className="absolute right-0 top-0 z-20 mr-3"
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
      <div
        className={`${menuOpen ? "block" : "hidden"} absolute right-0 top-0 z-10 w-[100vw] rounded-md bg-black/10 p-2 backdrop-blur-md lg:max-h-[45rem] lg:w-[30rem]`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <input
            type="text"
            placeholder="Search"
            ref={searchRef}
            className="w-full rounded-md border-none p-2"
            onChange={(e) => handleSearchChange(e.target.value)}
          />

          <div className="flex h-[89vh] w-full flex-col gap-2 overflow-y-auto pb-20">
            {artistsToShow.map((artist: string) => {
              const songsForArtist = filteredSongs.filter((song) =>
                song.artists.includes(artist),
              );
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
                        className="h-4 w-4 cursor-pointer rounded-full border-none p-2"
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
                        <span className="truncate text-sm">{song.name}</span>
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
          <button
            type="button"
            onClick={() => {
              setNewLocationModalOpen(true);
              setMenuOpen(false);
            }}
            className="w-fit rounded-md bg-white p-2 text-black"
          >
            Add New Location
          </button>
        </div>
      </div>
    </div>
  );
}
