"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { constructTitle, LOCATIONS, nameToLocation } from "./common/locations";
import type { LocationItem } from "./common/locations";
import { useMapStore } from "./_state/map.store";
import Appbar from "./components/appbar";
import Footer from "./components/footer";
import LocationButton from "./components/location-button";
import Menu from "./components/menu";
import NewLocationModal from "./components/new-location-modal";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGNyZWJiaW4iLCJhIjoiY20xMjFtYnc0MHh4ZjJrb2h2NDR5MjF6YyJ9.LOAauCyTV_pfMAYd08pTmg";

export default function Home() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  const { map, setMap } = useMapStore();

  const { setSelectedLocationId, clearSelectedLocation, addMarker } =
    useMapStore();

  const zoom = 10;
  const center = [114.16819296950341, 22.31382741410536];

  const handleMapContainerRef = (node: HTMLDivElement | null) => {
    if (!node || map) return;
    mapContainer.current = node;

    const newMap = new mapboxgl.Map({
      container: node,
      style: "mapbox://styles/mapbox/streets-v11",
      center: center as mapboxgl.LngLatLike,
      zoom: zoom,
    });

    setMap(newMap);
    LOCATIONS.forEach((location) => {
      addPlace(location, newMap);
    });
  };

  function addPlace(data: LocationItem, mapInstance?: mapboxgl.Map) {
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false,
      focusAfterOpen: false,
    });

    const targetMap = mapInstance ?? map;
    if (!targetMap) return;

    const markerElement = createCustomMarker(popup, data, targetMap);

    new mapboxgl.Marker({
      element: markerElement,
      anchor: "bottom",
    })
      .setLngLat([data.lng, data.lat])
      .addTo(targetMap);

    addMarker(markerElement);
    popup.setLngLat([data.lng, data.lat]);
  }

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const title = url.get("title");
    if (title) {
      const location = nameToLocation[title];
      if (location && map) {
        map?.flyTo({
          center: [location.lng, location.lat],
          zoom: 15,
        });
      }

      if (!map || !location) return;

      const locationData = new mapboxgl.LngLat(location.lng, location.lat);
      map?.flyTo({
        center: locationData,
        zoom: 15,
      });
    }
  }, [map]);

  function createCustomMarker(
    popup: mapboxgl.Popup,
    data: LocationItem,
    mapInstance?: mapboxgl.Map,
  ) {
    const markerElement = document.createElement("div");

    const image = document.createElement("img");
    image.src = data.image;
    image.className = "w-auto h-14 cursor-pointer mt-8 z-[1000] rounded-md";
    image.onclick = () => {
      const targetMap = mapInstance ?? map;
      if (!targetMap) return;
      const contentIsVisible = markerElement.classList.contains("visible");
      const { lastPopup: currentLastPopup, lastMarker: currentLastMarker } =
        useMapStore.getState();

      const songTitle = constructTitle(data);

      if (contentIsVisible) {
        window.history.pushState({}, "", "/");
        hidePopup(popup, markerElement);
      } else {
        if (currentLastPopup !== null && currentLastMarker !== null) {
          hidePopup(currentLastPopup, currentLastMarker);
        }
        const content = createPopupContent(data);
        popup.setDOMContent(content);
        popup.addTo(targetMap);
        markerElement.classList.add("visible");
        setSelectedLocationId(data.id);
        useMapStore.getState().setLastPopup(popup);
        useMapStore.getState().setLastMarker(markerElement);
        window.history.pushState({}, "", `/?title=${songTitle}`);
      }
    };
    markerElement.dataset.artist = data.artists.join(", ");
    markerElement.dataset.song = data.name;
    markerElement.style.marginTop = "40px";
    markerElement.appendChild(image);

    return markerElement;
  }

  function hidePopup(popup: mapboxgl.Popup, marker: HTMLDivElement) {
    popup.remove();
    marker.classList.remove("visible");
    clearSelectedLocation();
  }

  function createPopupContent(data: LocationItem) {
    const container = document.createElement("div");
    container.className =
      "max-w-[150px] min-w-[90px] h-fit rounded-md bg-white p-2 flex flex-col items-center justify-center top-24";
    container.tabIndex = -1;

    const artistName = document.createElement("p");
    artistName.className = "text-base text-center font-bold";
    artistName.style.wordWrap = "break-word";
    artistName.style.maxWidth = "100%";
    artistName.textContent = data.artists.join(", ");
    container.appendChild(artistName);

    const songTitle = document.createElement("p");
    songTitle.className = "text-xs text-center";
    songTitle.textContent = data.name;
    container.appendChild(songTitle);

    const address = document.createElement("p");
    address.className = "text-xs text-center";
    address.textContent = data.address;
    container.appendChild(address);
    const linksContainer = document.createElement("div");
    linksContainer.className = "flex items-center justify-center gap-2";

    const videoUrl = document.createElement("a");
    videoUrl.href = data.url;
    videoUrl.target = "_blank";
    const svg = document.createElement("svg");
    svg.innerHTML = `<svg height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	 viewBox="0 0 461.001 461.001" xml:space="preserve">
<g>
	<path style="fill:#F61C0D;" d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728
		c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137
		C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607
		c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z"/>
</g>
</svg>`;

    videoUrl.appendChild(svg);
    linksContainer.appendChild(videoUrl);

    const shareButton = document.createElement("button");
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    shareButton.addEventListener("click", async () => {
      await navigator.share({
        title: `Checkout this Cantopop地圖 location from ${data.artists.join(", ")}`,
        url: document.URL,
      });
    });

    const shareSvg = document.createElement("svg");
    shareSvg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
</svg>
`;
    shareButton.appendChild(shareSvg);
    linksContainer.appendChild(shareButton);

    const streetViewUrl = document.createElement("a");
    streetViewUrl.href =
      data.streetView ??
      `https://www.google.com/maps/@${data.lat},${data.lng},18z`;
    streetViewUrl.target = "_blank";
    const streetViewUrlSvg = document.createElement("svg");
    streetViewUrlSvg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
</svg>
`;
    streetViewUrl.appendChild(streetViewUrlSvg);
    linksContainer.appendChild(streetViewUrl);

    const locationUrl = document.createElement("a");
    locationUrl.href = `https://www.google.com/maps/dir//${data.lat},${data.lng}/`;
    locationUrl.target = "_blank";
    const locationSvg = document.createElement("svg");
    locationSvg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
</svg>
`;
    locationUrl.appendChild(locationSvg);
    linksContainer.appendChild(locationUrl);

    container.appendChild(linksContainer);
    return container;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <div className="relative flex h-[100vh] w-[100vw] overflow-hidden">
        <Appbar />
        <Menu />
        <LocationButton />
        <NewLocationModal />
        <Footer />
        <div ref={handleMapContainerRef} className="map-container relative" />
        <style jsx>{`
          .map-container {
            height: 100vh;
            width: 100vw;
          }
        `}</style>
      </div>
    </div>
  );
}
