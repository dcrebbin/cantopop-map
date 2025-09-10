import mapboxgl from "mapbox-gl";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import {
  constructTitle,
  extractContributorNamesFromLocation,
  type LocationItem,
} from "~/app/common/locations";
import { useMapStore } from "~/app/_state/map.store";
import { useNewLocationStore } from "~/app/_state/new-location.store";
import { useUIStore } from "~/app/_state/ui.store";
import { PopupContent } from "~/app/components/map/PopupContent";
import posthog from "posthog-js";

const markerRoots = new WeakMap<HTMLDivElement, Root>();
const popupRoots = new WeakMap<mapboxgl.Popup, Root>();
const elementRoots = new WeakMap<HTMLElement, Root>();

function createCustomMarker(
  popup: mapboxgl.Popup,
  data: LocationItem,
  mapInstance?: mapboxgl.Map,
) {
  const markerElement = document.createElement("div");

  const markerRoot = createRoot(markerElement);
  markerRoots.set(markerElement, markerRoot);

  const id = `${data.artists.join(", ")}-${data.name}`;
  markerRoot.render(
    createElement("img", {
      src: data.image,
      id,
      className:
        "w-auto h-14 cursor-pointer mt-8 z-[1000] rounded-md hover:scale-110",
      onClick: () => {
        const targetMap = mapInstance;
        if (!targetMap) return;
        const contentIsVisible = markerElement.classList.contains("visible");
        const { lastPopup: currentLastPopup, lastMarker: currentLastMarker } =
          useMapStore.getState();

        const songTitle = constructTitle(data);

        if (contentIsVisible) {
          const params = new URLSearchParams(window.location.search);
          params.delete("title");
          const query = params.toString();
          const newUrl = query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname;
          window.history.pushState({}, "", newUrl);
          hidePopup(popup, markerElement, id);
        } else {
          if (currentLastPopup !== null && currentLastMarker !== null) {
            hidePopup(currentLastPopup, currentLastMarker, id);
          }
          const { container, root } = createPopupContent(data);
          posthog.capture("view_location", {
            artists: data.artists.join(", "),
            songTitle: data.name,
          });
          popup.setDOMContent(container);
          popupRoots.set(popup, root);
          popup.addTo(targetMap);
          markerElement.classList.add("visible");
          useMapStore.getState().setSelectedLocationId(data.id);
          useMapStore.getState().setLastPopup(popup);
          useMapStore.getState().setLastMarker(markerElement);
          const params = new URLSearchParams(window.location.search);
          params.set("title", songTitle);
          const query = params.toString();
          const newUrl = `${window.location.pathname}?${query}`;
          window.history.pushState({}, "", newUrl);
        }
      },
    }),
  );
  markerElement.dataset.artist = data.artists.join(", ");
  markerElement.dataset.song = data.name;
  const contributorNames = extractContributorNamesFromLocation(data);
  if (contributorNames.length > 0) {
    markerElement.dataset.contributors = contributorNames.join(", ");
  }
  markerElement.style.marginTop = "40px";

  return markerElement;
}

export function addPlace(data: LocationItem, mapInstance?: mapboxgl.Map) {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    closeOnMove: false,
    focusAfterOpen: false,
  });

  const targetMap = mapInstance;
  if (!targetMap) return;

  const markerElement = createCustomMarker(popup, data, targetMap);

  new mapboxgl.Marker({
    element: markerElement,
    anchor: "bottom",
  })
    .setLngLat([data.lng, data.lat])
    .addTo(targetMap);

  useMapStore.getState().addMarker(markerElement);
  popup.setLngLat([data.lng, data.lat]);
}

function hidePopup(popup: mapboxgl.Popup, marker: HTMLDivElement, id: string) {
  const root = popupRoots.get(popup);
  if (root) {
    root.unmount();
    popupRoots.delete(popup);
  }
  popup.remove();
  marker.classList.remove("visible");
  useMapStore.getState().clearSelectedLocation();
}

function createPopupContent(data: LocationItem) {
  const container = document.createElement("div");
  const root = createRoot(container);
  root.render(
    createElement(PopupContent, {
      data,
      onDelete: () => deletePlace(data),
      onEdit: () => editPlace(data),
    }),
  );
  elementRoots.set(container, root);
  return { container, root };
}

function editPlace(data: LocationItem) {
  useNewLocationStore.getState().setEditLocation(data);
  useUIStore.getState().setNewLocationModalOpen(true);
}

function deletePlace(data: LocationItem) {
  const marker = document.querySelector(`[data-song="${data.name}"]`);
  if (marker && marker instanceof HTMLDivElement) {
    const markerRoot = markerRoots.get(marker);
    if (markerRoot && typeof markerRoot.unmount === "function")
      markerRoot.unmount();
    marker.remove();
  }
  const popupContent = document.querySelector(
    `[data-song="popup-${data.name}"]`,
  );
  if (popupContent) {
    const container = popupContent.parentElement as HTMLDivElement;
    const root = elementRoots.get(container);
    if (root && typeof root.unmount === "function") root.unmount();
    const popupEl = popupContent.parentElement
      ?.parentElement as HTMLDivElement | null;
    if (popupEl) popupEl.remove();
  }
}
