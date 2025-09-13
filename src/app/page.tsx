"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LOCATIONS, nameToLocation } from "./common/locations";
import { useMapStore } from "./_state/map.store";
import Appbar from "./components/appbar";
import Footer from "./components/footer";
import LocationButton from "./components/location-button";
import Menu from "./components/menu";
import NewLocationModal from "./components/new-location-modal";
import { addPlace } from "~/lib/custom-map";
import StreetView from "./components/street-view";
import { useUIStore } from "./_state/ui.store";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGNyZWJiaW4iLCJhIjoiY20xMjFtYnc0MHh4ZjJrb2h2NDR5MjF6YyJ9.LOAauCyTV_pfMAYd08pTmg";

export default function Home() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  const { gameOpen } = useUIStore();

  const { map, setMap } = useMapStore();

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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <div className="relative flex h-[100vh] w-[100vw] overflow-hidden">
        <Appbar />
        <Menu />
        <LocationButton />
        <NewLocationModal />
        <Footer />
        {gameOpen && <StreetView />}

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
