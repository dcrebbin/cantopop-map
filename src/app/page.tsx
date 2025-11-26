"use client";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  type LocationItem,
  LOCATIONS,
  nameToLocation,
} from "./common/locations";
import { useMapStore } from "./_state/map.store";
import Appbar from "./components/appbar";
import Footer from "./components/footer";
import LocationButton from "./components/location-button";
import Menu from "./components/menu";
import NewLocationModal from "./components/new-location-modal";
import { addPlace } from "~/lib/custom-map";
import StreetView from "./components/street-view";
import { useUIStore } from "./_state/ui.store";
import PwaTutorial from "./components/pwa-tutorial";
import MobileCameraView from "./components/mobile-camera-view";
import TaiPoModal from "./components/modals/tai-po";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGNyZWJiaW4iLCJhIjoiY20xMjFtYnc0MHh4ZjJrb2h2NDR5MjF6YyJ9.LOAauCyTV_pfMAYd08pTmg";

export default function Home({ location }: { location: LocationItem }) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  const { gameOpen, setTaiPoModalHasSeen } = useUIStore();

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
    if (!map) return;
    if (location) {
      map.setCenter([location.lng, location.lat]);
      map.setZoom(15);
      toast(`Zoomed to ${location.name}`);
    }

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
  }, [map, location]);

  function TaiOWarning() {
    return (
      <div className="absolute bottom-14 z-[90] mx-4 mt-4 flex h-fit w-auto flex-col items-center justify-start rounded-lg bg-red-500 p-4 text-sm">
        <button
          type="button"
          className="flex flex-row items-center justify-start gap-2 hover:drop-shadow-lg"
          onClick={() => {
            setTaiPoModalHasSeen(false);
          }}
        >
          <ExclamationTriangleIcon className="h-4 w-4 text-white" />
          <h1 className="font-bold text-white">Tai Po Fire Resources</h1>
        </button>
      </div>
    );
  }

  return (
    <div className="full-height flex w-screen flex-col overflow-hidden">
      <div className="relative flex w-[100vw] justify-center overflow-hidden">
        <ToastContainer />
        <Appbar />
        <TaiOWarning />
        <Menu />
        <MobileCameraView />
        <PwaTutorial />
        <LocationButton />
        <TaiPoModal />
        <NewLocationModal />
        <Footer />
        {gameOpen && <StreetView />}

        <div ref={handleMapContainerRef} className="map-container relative" />
        <style jsx>{`
          .map-container {
            height: 100dvh;
            min-height: 100vh;
            width: 100vw;
          }
        `}</style>
      </div>
    </div>
  );
}
