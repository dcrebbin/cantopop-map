import mapboxgl from "mapbox-gl";
import { useMapStore } from "../_state/map.store";
import { SvgIcon } from "./map/PopupContent";
import { phoneIcon } from "~/lib/icons/phoneIcon";
import { useUIStore } from "../_state/ui.store";

export default function LocationButton() {
  const mapStore = useMapStore();
  const map = mapStore.map;
  const { setMobileCameraViewOpen, mobileCameraViewOpen } = useUIStore();

  return (
    <div className="absolute bottom-0 right-0 z-[120] m-0 mb-4 flex flex-row items-center gap-4 p-8">
      <button
        type="button"
        className="cursor-pointer transition-transform duration-300 hover:scale-110 md:hidden"
        onClick={() => {
          setMobileCameraViewOpen(!mobileCameraViewOpen);
        }}
      >
        <SvgIcon html={phoneIcon} className="h-6 w-6 text-white" />{" "}
      </button>
      {!mobileCameraViewOpen && (
        <button
          type="button"
          onClick={async () => {
            if (typeof window === "undefined") return;

            if (!("geolocation" in navigator)) {
              alert(
                "Geolocation is not supported in this browser. Try opening in Safari or Chrome.",
              );
              return;
            }

            if (!window.isSecureContext) {
              alert(
                "Location requires HTTPS. On iOS, open this site over https in Safari and allow location.",
              );
              return;
            }

            try {
              const result = await (
                navigator as Navigator & { permissions?: Permissions }
              ).permissions?.query?.({ name: "geolocation" as PermissionName });
              if (result?.state === "denied") {
                alert(
                  "Location permission is denied. On iOS: Settings > Privacy & Security > Location Services > Safari Websites > While Using the App, and enable Precise Location. Then reload.",
                );
                return;
              }
            } catch {
              console.error("Geolocation permission query failed");
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                if (!map) return;
                map.flyTo({
                  center: [position.coords.longitude, position.coords.latitude],
                  zoom: 16,
                });

                if (useMapStore.getState().personalMarker) {
                  useMapStore.getState()?.personalMarker?.remove();
                }
                const personalMarker = new mapboxgl.Marker({
                  color: "black",
                })
                  .setLngLat([
                    position.coords.longitude,
                    position.coords.latitude,
                  ])
                  .addTo(map);

                useMapStore.getState().addPersonalMarker(personalMarker);
              },
              (error) => {
                console.error("Geolocation error:", error);
                const base = "Unable to get your location.";
                let message = base;
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    message = `${base} Please allow location access. On iOS: Settings > Privacy & Security > Location Services > Safari Websites > While Using the App, and enable Precise Location.`;
                    break;
                  case error.POSITION_UNAVAILABLE:
                    message = `${base} Position unavailable. Try moving to an open area and ensure Location Services are enabled.`;
                    break;
                  case error.TIMEOUT:
                    message = `${base} Request timed out. Try again.`;
                    break;
                  default:
                    message = `${base} Please check your permissions.`;
                }
                alert(message);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 600000,
              },
            );
          }}
          className="bottom-0 right-0 z-[90] flex cursor-pointer items-center justify-center hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="white"
            className="size-10 drop-shadow-[0_0_2px_rgba(0,0,0,1)]"
          >
            <title>Clear Filters</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
