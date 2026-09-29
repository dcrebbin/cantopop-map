"use client";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  type LocationItem,
  type MappableLocationItem,
  MAP_LOCATIONS,
  nameToLocation,
} from "../common/lib";
import { useMapStore } from "../_state/map.store";
import Appbar from "./appbar";
import LocationButton from "./location-button";
import Menu from "./menu";
import NewLocationModal from "./new-location-modal";
import { addPlace, openLocationPopup } from "~/lib/custom-map";
import StreetView from "./street-view";
import { useUIStore } from "../_state/ui.store";
import PwaTutorial from "./pwa-tutorial";
import MobileCameraView from "./mobile-camera-view";
import SelectedLocation from "./selected-location";
import ContributorsModal from "./contributors-modal";
import CreditsModal from "./credits-modal";

const mapboxAccessToken = import.meta.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
if (mapboxAccessToken) {
  mapboxgl.accessToken = mapboxAccessToken;
}

const MAP_CENTER = [114.16819296950341, 22.31382741410536] as const;
const MAP_ZOOM = 10;

function hasValidCoordinates(
  location: LocationItem | null | undefined,
): location is MappableLocationItem {
  return (
    typeof location?.address === "string" &&
    typeof location?.lat === "number" &&
    Number.isFinite(location.lat) &&
    typeof location.lng === "number" &&
    Number.isFinite(location.lng) &&
    location.hidden === false
  );
}

export default function HomePage({ location }: { location?: LocationItem }) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const hasOpenedInitialPopupRef = useRef(false);

  const gameOpen = useUIStore((state) => state.gameOpen);

  const map = useMapStore((state) => state.map);
  const setMap = useMapStore((state) => state.setMap);

  useEffect(() => {
    hasOpenedInitialPopupRef.current = false;
    const node = mapContainer.current;
    if (!node) return;
    if (!mapboxAccessToken) return;

    const newMap = new mapboxgl.Map({
      container: node,
      style: "mapbox://styles/mapbox/streets-v11",
      center: MAP_CENTER as mapboxgl.LngLatLike,
      zoom: MAP_ZOOM,
      fadeDuration: 0,
    });

    setMap(newMap);
    for (const location of MAP_LOCATIONS) {
      addPlace(location, newMap);
    }
    return () => {
      newMap.remove();
      useMapStore.setState({
        map: null,
        markerDebugStats: null,
        lastMarker: null,
        selectedLocationId: null,
        personalMarker: null,
      });
    };
  }, [setMap]);

  useEffect(() => {
    if (!map) return;
    let initialLocation: MappableLocationItem | null = null;
    let creditsLocation: LocationItem | null = null;
    const tryOpenInitialPopup = (targetLocation: MappableLocationItem) => {
      if (hasOpenedInitialPopupRef.current) return;
      openLocationPopup(targetLocation, map);
      hasOpenedInitialPopupRef.current = true;
    };

    if (hasValidCoordinates(location)) {
      initialLocation = location;
      map.setCenter([location.lng, location.lat]);
      map.setZoom(15);
      toast(`Zoomed to ${location.name}`);
    } else if (location) {
      creditsLocation = location;
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
        creditsLocation = queryLocation;
        useUIStore.getState().setSelectedLocationCredits(queryLocation);
      }
      const viewCredits = url.get("view-credits");
      const locationForCredits = creditsLocation ?? initialLocation;
      if (viewCredits && locationForCredits) {
        useUIStore.getState().setSelectedLocationCredits(locationForCredits);
      }
    }

    if (initialLocation) {
      tryOpenInitialPopup(initialLocation);
    }

    return undefined;
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

        <div ref={mapContainer} className="map-container relative" />
      </div>
    </div>
  );
}
