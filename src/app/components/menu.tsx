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
    const songs = SONGS.filter((song) => song.name.includes(search));
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
        className={`${menuOpen ? "block" : "hidden"} absolute right-0 top-0 z-10 w-[100vw] overflow-y-auto rounded-md bg-black/10 p-2 backdrop-blur-md lg:h-[50rem] lg:w-[30rem]`}
      >
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search"
            ref={searchRef}
            className="w-full rounded-md border-none p-2"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <h1 className="text-2xl text-white">Artists</h1>
          <div className="flex h-auto max-h-[18rem] flex-col gap-2 overflow-y-auto lg:max-h-[20rem]">
            <hr className="my-1" />
            {filteredArtists.map((artist: string) => (
              <div
                key={artist}
                className="flex w-full flex-row items-center justify-between gap-2 pr-4 text-white"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between text-left"
                  onClick={() => handleArtistCheckboxChange(artist)}
                >
                  {artist}{" "}
                  <input
                    type="checkbox"
                    aria-label={artist}
                    className="h-4 w-4 cursor-pointer rounded-full border-none"
                    checked={selectedArtists.includes(artist)}
                  />
                </button>
              </div>
            ))}
          </div>
          <h1 className="text-2xl text-white">Songs</h1>
          <div className="flex h-auto max-h-[18rem] flex-col gap-2 overflow-y-auto lg:max-h-[20rem]">
            <hr className="my-1" />
            {filteredSongs.map((song: { name: string; artists: string[] }) => (
              <div
                key={song.name}
                className="flex w-full flex-col items-center justify-between gap-4 pr-4 text-white"
              >
                <button
                  type="button"
                  className="my-1 flex w-full cursor-pointer items-center justify-between text-left underline"
                  onClick={() => handleSongSelection(song)}
                >
                  {" "}
                  {song.name}{" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="white"
                    className="size-6"
                  >
                    <title>Select</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
