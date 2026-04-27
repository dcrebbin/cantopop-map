import { useMapStore } from "../_state/map.store";
import { useUIStore } from "../_state/ui.store";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { hidePopup } from "~/lib/custom-map";

export default function SelectedLocation() {
  const uiStore = useUIStore();
  const mapStore = useMapStore();

  function formatTitle() {
    return (
      uiStore.selectedLocation?.artists.join(", ") +
      " - " +
      uiStore.selectedLocation?.value
    );
  }

  function clearSelectedLocation() {
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
    if (mapStore.lastPopup && mapStore.lastMarker) {
      hidePopup(
        mapStore.lastPopup,
        mapStore.lastMarker,
        mapStore.selectedLocationId ?? "",
      );
    }
    mapStore.clearSelectedLocation();
  }

  if (!uiStore.selectedLocation?.value || uiStore.mobileCameraViewOpen)
    return null;

  return (
    <div className="absolute bottom-0 left-0 z-[250] m-0 mb-[2rem] ml-4 flex max-w-[50vw] flex-row items-center gap-4 rounded-lg border border-white/50 bg-white/5 p-3 pr-6 backdrop-blur-sm sm:max-w-none">
      <div className="relative min-w-0">
        <h1 className="truncate text-sm font-bold text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] sm:text-lg xl:text-xl">
          {uiStore.selectedLocation?.artists.join(", ")}
        </h1>
        <h2 className="truncate text-xs text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] sm:text-sm xl:text-base">
          {uiStore.selectedLocation?.value}
        </h2>
      </div>
      <button
        type="button"
        onClick={clearSelectedLocation}
        className="absolute -right-1 top-0 p-1 text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)]"
      >
        <XMarkIcon className="h-4 w-4 xl:h-6 xl:w-6" />
      </button>
    </div>
  );
}
