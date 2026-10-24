import { MapPinIcon } from "@heroicons/react/24/solid";
import { useMapStore } from "../_state/map.store";
import { useUIStore } from "../_state/ui.store";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { hidePopup } from "~/lib/custom-map";

export default function SelectedLocation() {
  const uiStore = useUIStore();

  function clearSelectedLocation(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const selectedMarker = useMapStore.getState().lastMarker;
    if (selectedMarker) hidePopup(selectedMarker);
    uiStore.setSelectedLocation({
      value: "",
      artists: [],
      streetViewEmbed: "",
    });
    const params = new URLSearchParams(window.location.search);
    params.delete("title");
    const query = params.toString();
    const newUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
    useMapStore.getState().clearSelectedLocation();
  }

  if (!uiStore.selectedLocation?.address || uiStore.mobileCameraViewOpen)
    return null;

  return (
    <div className="absolute  bottom-0 left-0 z-[250] m-0 mb-[2rem] ml-2 flex max-w-[min(24rem,calc(100vw-7rem))] flex-row items-center gap-4 rounded-lg border border-white/50 bg-white/5 p-3 pr-8 backdrop-blur-sm xl:ml-4">
      <div className="relative min-w-0">
        <div className="relative min-w-0">
          <p className="wrap-anywhere text-xs leading-snug font-semibold text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)] sm:text-sm xl:text-base">
            {uiStore.selectedLocation.artists.join(", ")}
          </p>
        </div>
        <div className="relative min-w-0">
          <p className="wrap-anywhere text-xs leading-snug font-semibold text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)] sm:text-sm xl:text-base">
            🎵 {uiStore.selectedLocation.value}
          </p>
        </div>
        <p className="wrap-anywhere flex items-center gap-1 text-xs leading-snug font-semibold text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)] sm:text-sm xl:text-base">
          <MapPinIcon className="size-4" /> {uiStore.selectedLocation.address}
        </p>
      </div>
      <button
        type="button"
        aria-label="Clear selected location"
        onClick={clearSelectedLocation}
        className="absolute -right-1 top-0 p-1 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]"
      >
        <XMarkIcon className="h-6 w-6 xl:h-6 xl:w-6" />
      </button>
    </div>
  );
}
