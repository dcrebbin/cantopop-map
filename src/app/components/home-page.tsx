"use client";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  type LocationItem,
  MAP_LOCATIONS,
  nameToLocation,
} from "../common/locations";
import { useMapStore } from "../_state/map.store";
import Appbar from "./appbar";
import LocationButton from "./location-button";
import Menu from "./menu";
import NewLocationModal from "./new-location-modal";
import { addPlace } from "~/lib/custom-map";
import StreetView from "./street-view";
import { useUIStore } from "../_state/ui.store";
import PwaTutorial from "./pwa-tutorial";
import MobileCameraView from "./mobile-camera-view";
import SelectedLocation from "./selected-location";
import ContributorsModal from "./contributors-modal";
import CreditsModal from "./credits-modal";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

function hasValidCoordinates(
  location: LocationItem | null | undefined,
): location is LocationItem & { lat: number; lng: number } {
  return (
    typeof location?.lat === "number" &&
    Number.isFinite(location.lat) &&
    typeof location.lng === "number" &&
    Number.isFinite(location.lng)
  );
}

export default function HomePage({ location }: { location?: LocationItem }) {
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
    for (const location of MAP_LOCATIONS) {
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

    if (hasValidCoordinates(location)) {
      initialLocation = location;
      map.setCenter([location.lng, location.lat]);
      map.setZoom(15);
      toast(`Zoomed to ${location.name}`);
    } else if (location) {
      useUIStore.getState().setSelectedLocationCredits(location);
    }

    const url = new URLSearchParams(window.location.search);
    const title = url.get("title");
    if (title) {
      const queryLocation = nameToLocation[title];
      if (queryLocation && map && hasValidCoordinates(queryLocation)) {
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
      } else if (queryLocation) {
        initialLocation = queryLocation;
        useUIStore.getState().setSelectedLocationCredits(queryLocation);
      }
      const viewCredits = url.get("view-credits");
      if (viewCredits && initialLocation) {
        useUIStore
          .getState()
          .setSelectedLocationCredits(
            initialLocation as unknown as LocationItem,
          );
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
        <NewLocationModal />
        <ContributorsModal />
        <CreditsModal />
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
