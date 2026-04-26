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
import SelectedLocation from "./components/selected-location";
import ContributorsModal from "./components/contributors-modal";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

export default function Home({ location }: { location: LocationItem }) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const hasOpenedInitialPopupRef = useRef(false);

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
    for (const location of LOCATIONS) {
      addPlace(location, newMap);
    }
  };

  useEffect(() => {
    if (!map) return;
    let initialLocation: LocationItem | null = null;
    let retryCount = 0;
    let retryTimeoutId: number | null = null;

    const tryOpenInitialPopup = (targetLocation: LocationItem) => {
      if (hasOpenedInitialPopupRef.current) return;

      const marker = useMapStore
        .getState()
        .allMarkers.find((item) => item.dataset.song === targetLocation.name);
      const clickableMarkerImage = marker?.querySelector("img");

      if (clickableMarkerImage instanceof HTMLElement) {
        clickableMarkerImage.click();
        hasOpenedInitialPopupRef.current = true;
        return;
      }

      if (retryCount >= 10) return;
      retryCount += 1;
      retryTimeoutId = window.setTimeout(() => {
        tryOpenInitialPopup(targetLocation);
      }, 100);
    };

    if (location) {
      initialLocation = location;
      map.setCenter([location.lng, location.lat]);
      map.setZoom(15);
      toast(`Zoomed to ${location.name}`);
    }

    const url = new URLSearchParams(window.location.search);
    const title = url.get("title");
    if (title) {
      const queryLocation = nameToLocation[title];
      if (queryLocation && map) {
        initialLocation = queryLocation;
        map?.flyTo({
          center: [queryLocation.lng, queryLocation.lat],
          zoom: 15,
        });
        useUIStore.getState().setSelectedLocation({
          value: queryLocation.name,
          artists: queryLocation.artists,
          streetViewEmbed: queryLocation.streetViewEmbed ?? "",
        });
      }
    }

    if (initialLocation) {
      tryOpenInitialPopup(initialLocation);
    }

    return () => {
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [map, location]);

  return (
    <div className="full-height flex w-screen flex-col overflow-hidden">
      <div className="relative flex w-[100vw] justify-center overflow-hidden">
        <ToastContainer />
        <Appbar />
        <Menu />
        <MobileCameraView />
        <PwaTutorial />
        <SelectedLocation />
        <LocationButton />
        <TaiPoModal />
        <NewLocationModal />
        <ContributorsModal />
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
