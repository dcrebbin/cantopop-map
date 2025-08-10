"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Image from "next/image";
import { LOCATIONS } from "./common/locations";
mapboxgl.accessToken =
  "pk.eyJ1IjoiZGNyZWJiaW4iLCJhIjoiY20xMjFtYnc0MHh4ZjJrb2h2NDR5MjF6YyJ9.LOAauCyTV_pfMAYd08pTmg";

interface SearchResult {
  artist: string;
  name: string;
  url: string;
  image: string;
  address: string;
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const zoom = 3;
  const center = [103.98641487138919, 1.3559609211311883];

  function requestLocation() {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      map.current?.setCenter([longitude, latitude]);
      map.current?.setZoom(9);
    });
  }

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: center as mapboxgl.LngLatLike,
      zoom: zoom,
    });

    LOCATIONS.forEach((location) => {
      addPlace(location.coordinates[1]!, location.coordinates[0]!, location);
    });

    requestLocation();
  }, []);

  function addPlace(longitude: number, latitude: number, data: SearchResult) {
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false,
    });

    const marker = new mapboxgl.Marker({
      element: createCustomMarker(popup, data),
      anchor: "bottom",
    })
      .setLngLat([longitude, latitude])
      .addTo(map.current!);

    popup.setLngLat([longitude, latitude]);
  }

  function createCustomMarker(popup: mapboxgl.Popup, data: SearchResult) {
    const markerElement = document.createElement("div");

    const duck = document.createElement("img");
    duck.src = data.image;
    duck.alt = "Duck";
    duck.className = "w-auto h-14 cursor-pointer mt-8 z-[1000] rounded-md";
    duck.onclick = () => {
      const contentIsVisible = markerElement.classList.contains("visible");
      if (contentIsVisible) {
        popup.remove();
        markerElement.classList.remove("visible");
      } else {
        popup.setDOMContent(createPopupContent(data));
        popup.addTo(map.current!);
        markerElement.classList.add("visible");
      }
    };
    markerElement.style.marginTop = "40px";
    markerElement.appendChild(duck);
    return markerElement;
  }

  function createPopupContent(data: SearchResult) {
    const container = document.createElement("div");
    container.className =
      "max-w-[150px] min-w-[90px] h-fit rounded-md bg-white p-2 flex flex-col items-center justify-center top-24";

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

    const url = document.createElement("a");
    url.href = data.url;
    url.target = "_blank";
    const svg = document.createElement("svg");
    svg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
</svg>`;
    url.appendChild(svg);
    container.appendChild(url);

    return container;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <div className="relative flex h-[100vh] w-[100vw] overflow-hidden">
        <div className="absolute z-[999999] flex h-14 w-full bg-transparent">
          <h1 className="left-0 top-0 flex items-center justify-center p-3 pb-2 text-center font-[Cute] text-3xl leading-none text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] sm:pb-4">
            cantopop地圖
          </h1>
        </div>
        <div ref={mapContainer} className="map-container relative" />
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
