"use client";

import { useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LOCATIONS } from "./common/locations";
import type { LocationItem } from "./common/locations";
import { useMapStore } from "./_state/map.store";
mapboxgl.accessToken =
  "pk.eyJ1IjoiZGNyZWJiaW4iLCJhIjoiY20xMjFtYnc0MHh4ZjJrb2h2NDR5MjF6YyJ9.LOAauCyTV_pfMAYd08pTmg";

//

export default function Home() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { selectedLocationId, setSelectedLocationId, clearSelectedLocation } =
    useMapStore();

  const zoom = 4.5;
  const center = [121.81339247320467, 25.69196539319919];

  const handleMapContainerRef = (node: HTMLDivElement | null) => {
    if (!node || map.current) return;
    mapContainer.current = node;
    map.current = new mapboxgl.Map({
      container: node,
      style: "mapbox://styles/mapbox/streets-v11",
      center: center as mapboxgl.LngLatLike,
      zoom: zoom,
    });

    LOCATIONS.forEach((location) => {
      addPlace(location);
    });
  };

  function addPlace(data: LocationItem) {
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false,
      focusAfterOpen: false,
    });

    if (!map.current) return;

    new mapboxgl.Marker({
      element: createCustomMarker(popup, data),
      anchor: "bottom",
    })
      .setLngLat([data.lng, data.lat])
      .addTo(map.current);

    popup.setLngLat([data.lng, data.lat]);
  }

  function createCustomMarker(popup: mapboxgl.Popup, data: LocationItem) {
    const markerElement = document.createElement("div");

    const image = document.createElement("img");
    image.src = data.image;
    image.className = "w-auto h-14 cursor-pointer mt-8 z-[1000] rounded-md";
    image.onclick = () => {
      if (!map.current) return;
      const contentIsVisible = markerElement.classList.contains("visible");
      if (contentIsVisible) {
        popup.remove();
        markerElement.classList.remove("visible");
        clearSelectedLocation();
      } else {
        const container = createPopupContent(data);
        popup.setDOMContent(container);
        popup.addTo(map.current);
        markerElement.classList.add("visible");
        setSelectedLocationId(data.id);
      }
    };
    markerElement.style.marginTop = "40px";
    markerElement.appendChild(image);
    return markerElement;
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
    artistName.textContent = data.artist;
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

    const locationUrl = document.createElement("a");
    locationUrl.href = `https://www.google.com/maps/@${data.lat},${data.lng},18z`;
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
        <div className="absolute z-[999999] flex h-14 w-full flex-col items-start justify-start bg-transparent">
          <h1 className="flex items-center justify-center p-3 pb-2 text-center font-[Cute] text-3xl leading-none text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] sm:pb-4">
            cantopop地圖
          </h1>
        </div>
        <div className="absolute bottom-0 z-[999999] flex h-14 w-full items-center justify-center bg-transparent">
          <a
            href="https://github.com/dcrebbin/cantopop-map/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-0 p-3 font-[Cute] text-xl text-white underline drop-shadow-[0_0_4px_rgba(0,0,0,1)]"
          >
            Request locations here
          </a>
        </div>
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
