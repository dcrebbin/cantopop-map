import { useMapStore } from "../_state/map.store";

export default function LocationButton() {
  const mapStore = useMapStore();
  const map = mapStore.map;

  return (
    <button
      type="button"
      onClick={async () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(position);
            alert("test");
            if (!map) return;
            map.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 10,
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            alert(
              "Unable to get your location. Please check your permissions.",
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000,
          },
        );
      }}
      className="absolute bottom-0 right-0 z-[90] m-0 mb-4 cursor-pointer p-8"
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
  );
}
