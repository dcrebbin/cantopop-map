/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LOCATIONS } from "../common/locations";
import { useUIStore } from "../_state/ui.store";
import { SvgIcon } from "./map/PopupContent";
import { closeIcon } from "~/lib/icons/closeIcon";

export default function StreetView() {
  const options = LOCATIONS.filter((location) => location.streetViewEmbed)
    .map((location) => ({
      value: location.name,
      label: location.name,
      artists: location.artists,
      streetViewEmbed: location.streetViewEmbed,
    }))
    .toSorted((a, b) => a.artists[0]?.localeCompare(b.artists[0] ?? "") ?? 0);
  const guessInputRef = useRef<HTMLSelectElement>(null);
  const {
    selectedLocation,
    setSelectedLocation,
    setGameOpen,
    setGameScore,
    setTotalLocations,
    totalLocations,
    gameScore,
  } = useUIStore();

  function handleGuessLocation() {
    const guess = guessInputRef.current?.value;
    if (!guess) return;
    setTotalLocations(totalLocations + 1);

    if (guess === selectedLocation?.value) {
      alert("Correct");
      setGameScore(gameScore + 1);
    } else {
      alert("Incorrect");
    }
    determineNewLocation();
  }

  function determineNewLocation() {
    const randomIndex = Math.floor(Math.random() * options.length);
    const randomLocation = options[randomIndex];
    if (randomLocation) {
      setSelectedLocation({
        value: randomLocation.value,
        artists: randomLocation.artists,
        streetViewEmbed: randomLocation.streetViewEmbed ?? "",
      });
    }
  }

  useEffect(() => {
    if (options.length > 0) {
      determineNewLocation();
    }
  }, []);

  return (
    <div className="fixed bottom-0 right-0 z-[90] flex h-full w-full items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 mb-0 flex h-auto w-full flex-col items-center gap-4 rounded-lg bg-white p-4 lg:mb-28 lg:w-[55rem]">
        <div className="flex w-full flex-row items-center justify-between">
          <h1>Cantopop地圖 Guesser</h1>
          <button type="button" onClick={() => setGameOpen(false)}>
            <SvgIcon html={closeIcon} className="h-6 w-6 text-black" />
          </button>
        </div>
        <iframe
          src={selectedLocation?.streetViewEmbed ?? ""}
          width="100%"
          height="100%"
          className="h-[20rem] rounded-lg drop-shadow-md lg:h-[30rem]"
          style={{ border: "0" }}
          allowFullScreen
          title="Street View"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
        <select
          ref={guessInputRef}
          className="mx-4 w-full rounded-lg bg-black p-2 text-white"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.artists.join(", ")} - {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleGuessLocation}
          className="rounded-lg bg-black p-2 text-white"
        >
          Guess Location
        </button>
        <p>
          Score: {gameScore}/{totalLocations}
        </p>
      </div>
    </div>
  );
}
