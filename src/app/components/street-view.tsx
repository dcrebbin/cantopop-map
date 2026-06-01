/** biome-ignore-all lint/correctness/useExhaustiveDependencies: mount-only game initialization */
import { useCallback, useEffect, useRef } from "react";
import { LOCATIONS } from "../common/locations";
import { useUIStore } from "../_state/ui.store";
import { SvgIcon } from "./map/PopupContent";
import { closeIcon } from "~/lib/icons/closeIcon";

const STREET_VIEW_OPTIONS = (() => {
  const options = [];
  for (const location of LOCATIONS) {
    if (!location.streetViewEmbed) continue;
    options.push({
      value: location.name,
      label: location.name,
      artists: location.artists,
      streetViewEmbed: location.streetViewEmbed,
    });
  }
  return options.toSorted(
    (a, b) => a.artists[0]?.localeCompare(b.artists[0] ?? "") ?? 0,
  );
})();

const STREET_VIEW_IFRAME_SANDBOX =
  "allow-scripts allow-popups allow-forms allow-presentation";

export default function StreetView() {
  const guessInputRef = useRef<HTMLSelectElement>(null);
  const {
    selectedLocation,
    setSelectedLocation,
    setGameOpen,
    totalLocations,
    gameScore,
  } = useUIStore();

  const pickRandomLocation = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * STREET_VIEW_OPTIONS.length);
    const randomLocation = STREET_VIEW_OPTIONS[randomIndex];
    if (randomLocation) {
      setSelectedLocation({
        value: randomLocation.value,
        artists: randomLocation.artists,
        streetViewEmbed: randomLocation.streetViewEmbed ?? "",
      });
    }
  }, [setSelectedLocation]);

  function handleGuessLocation() {
    const guess = guessInputRef.current?.value;
    if (!guess) return;

    const store = useUIStore.getState();
    useUIStore.setState({
      totalLocations: store.totalLocations + 1,
    });

    if (guess === selectedLocation?.value) {
      alert("Correct");
      useUIStore.setState({
        gameScore: store.gameScore + 1,
      });
    } else {
      alert("Incorrect");
    }
    pickRandomLocation();
  }

  useEffect(() => {
    if (STREET_VIEW_OPTIONS.length > 0) {
      pickRandomLocation();
    }
  }, [pickRandomLocation]);

  return (
    <div className="fixed bottom-0 right-0 z-[90] flex h-full w-full items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 mb-0 flex h-auto w-full flex-col items-center gap-4 rounded-lg bg-white p-4 lg:mb-28 lg:w-[55rem]">
        <div className="flex w-full flex-row items-center justify-between">
          <h1>Cantopop地圖 Guesser</h1>
          <button
            type="button"
            aria-label="Close guesser game"
            onClick={() => setGameOpen(false)}
          >
            <SvgIcon html={closeIcon} className="size-6 text-black" />
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
          sandbox={STREET_VIEW_IFRAME_SANDBOX}
        ></iframe>
        <select
          ref={guessInputRef}
          aria-label="Guess the filming location"
          className="mx-4 w-full rounded-lg bg-zinc-950 p-2 text-white"
        >
          {STREET_VIEW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.artists.join(", ")} - {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleGuessLocation}
          className="rounded-lg bg-zinc-950 p-2 text-white"
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
