import mapboxgl from "mapbox-gl";
import { useMapStore } from "../_state/map.store";
import { SvgIcon } from "./map/PopupContent";
import { phoneIcon } from "~/lib/icons/phoneIcon";
import { useUIStore } from "../_state/ui.store";

export default function PhoneButton() {
  const mapStore = useMapStore();
  const { setMobileCameraViewOpen, mobileCameraViewOpen } = useUIStore();

  return (
    <div className="absolute right-0 bottom-0 z-120 m-0 mb-4 flex flex-row items-center gap-4 p-8">
      <button
        type="button"
        className="cursor-pointer transition-transform duration-300 hover:scale-110 md:hidden"
        onClick={() => {
          setMobileCameraViewOpen(!mobileCameraViewOpen);
        }}
      >
        <SvgIcon html={phoneIcon} className="size-6 text-white" />{" "}
      </button>
    </div>
  );
}
