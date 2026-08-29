import mapboxgl from "mapbox-gl";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import {
  constructTitle,
  extractContributorNamesFromLocation,
  type MappableLocationItem,
} from "~/app/common/lib";
import { useMapStore } from "~/app/_state/map.store";
import { useNewLocationStore } from "~/app/_state/new-location.store";
import { useUIStore } from "~/app/_state/ui.store";
import { PopupContent } from "~/app/components/map/PopupContent";
import posthog from "posthog-js";

const markerRoots = new WeakMap<HTMLDivElement, Root>();
const popupRoots = new WeakMap<mapboxgl.Popup, Root>();
const elementRoots = new WeakMap<HTMLElement, Root>();

const CLUSTER_RADIUS_PX = 28;
const MAX_CLUSTER_ZOOM = 18;

interface MarkerEntry {
  data: MappableLocationItem;
  element: HTMLDivElement;
  marker: mapboxgl.Marker;
  manager: ClusterManager;
}

interface MarkerGroup {
  entries: MarkerEntry[];
  x: number;
  y: number;
}

interface ClusterManager {
  map: mapboxgl.Map;
  entries: MarkerEntry[];
  clusterMarkers: mapboxgl.Marker[];
  animationFrame: number | null;
  update: () => void;
}

const clusterManagers = new WeakMap<mapboxgl.Map, ClusterManager>();
const markerEntries = new WeakMap<HTMLDivElement, MarkerEntry>();

function createClusterElement(group: MarkerGroup, targetMap: mapboxgl.Map) {
  const representative = group.entries[0];
  if (!representative) return null;

  const hiddenMarkerCount = group.entries.length - 1;
  const element = document.createElement("button");
  element.type = "button";
  element.className = "cantopop-cluster-marker";
  element.setAttribute(
    "aria-label",
    `${group.entries.length} locations. Zoom in to reveal them.`,
  );

  const thumbnail = document.createElement("img");
  thumbnail.src = representative.data.image;
  thumbnail.alt = "";
  thumbnail.className = "image-skeleton cantopop-cluster-thumbnail";
  element.appendChild(thumbnail);

  const count = document.createElement("span");
  count.className = "cantopop-cluster-count";
  count.textContent = `+${hiddenMarkerCount}`;
  count.setAttribute("aria-hidden", "true");
  element.appendChild(count);

  element.addEventListener("click", (event) => {
    event.stopPropagation();
    const bounds = new mapboxgl.LngLatBounds();
    for (const entry of group.entries) {
      bounds.extend([entry.data.lng, entry.data.lat]);
    }

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const containsOneCoordinate =
      northEast.lng === southWest.lng && northEast.lat === southWest.lat;

    if (containsOneCoordinate) {
      targetMap.easeTo({
        center: [representative.data.lng, representative.data.lat],
        zoom: Math.min(targetMap.getZoom() + 2, MAX_CLUSTER_ZOOM + 1),
      });
      return;
    }

    targetMap.fitBounds(bounds, {
      padding: 96,
      maxZoom: MAX_CLUSTER_ZOOM + 1,
    });
  });

  return element;
}

function renderClusters(manager: ClusterManager) {
  manager.animationFrame = null;
  for (const clusterMarker of manager.clusterMarkers) clusterMarker.remove();
  manager.clusterMarkers = [];

  const visibleEntries = manager.entries.filter(
    (entry) => entry.element.dataset.filterHidden !== "true",
  );

  for (const entry of manager.entries) {
    entry.element.style.display =
      entry.element.dataset.filterHidden === "true" ? "none" : "block";
  }

  if (manager.map.getZoom() > MAX_CLUSTER_ZOOM) return;

  const groups: MarkerGroup[] = [];
  for (const entry of visibleEntries) {
    if (entry.element.classList.contains("visible")) continue;
    const point = manager.map.project([entry.data.lng, entry.data.lat]);
    let closestGroup: MarkerGroup | undefined;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const group of groups) {
      const distance = Math.hypot(point.x - group.x, point.y - group.y);
      if (distance <= CLUSTER_RADIUS_PX && distance < closestDistance) {
        closestGroup = group;
        closestDistance = distance;
      }
    }

    if (!closestGroup) {
      groups.push({ entries: [entry], x: point.x, y: point.y });
      continue;
    }

    closestGroup.entries.push(entry);
    const groupSize = closestGroup.entries.length;
    closestGroup.x += (point.x - closestGroup.x) / groupSize;
    closestGroup.y += (point.y - closestGroup.y) / groupSize;
  }

  for (const group of groups) {
    if (group.entries.length < 2) continue;
    for (const entry of group.entries) entry.element.style.display = "none";

    const element = createClusterElement(group, manager.map);
    if (!element) continue;
    const center = group.entries.reduce(
      (result, entry) => ({
        lng: result.lng + entry.data.lng / group.entries.length,
        lat: result.lat + entry.data.lat / group.entries.length,
      }),
      { lng: 0, lat: 0 },
    );
    const clusterMarker = new mapboxgl.Marker({ element, anchor: "center" })
      .setLngLat([center.lng, center.lat])
      .addTo(manager.map);
    // Mapbox labels custom marker elements as images by default. This one is
    // interactive, so restore its native button semantics after construction.
    element.setAttribute("role", "button");
    manager.clusterMarkers.push(clusterMarker);
  }
}

function scheduleClusterUpdate(manager: ClusterManager) {
  if (manager.animationFrame !== null) return;
  manager.animationFrame = window.requestAnimationFrame(() => {
    renderClusters(manager);
  });
}

function getClusterManager(map: mapboxgl.Map) {
  const existingManager = clusterManagers.get(map);
  if (existingManager) return existingManager;

  const manager: ClusterManager = {
    map,
    entries: [],
    clusterMarkers: [],
    animationFrame: null,
    update: () => scheduleClusterUpdate(manager),
  };
  clusterManagers.set(map, manager);
  map.on("moveend", manager.update);
  map.on("resize", manager.update);
  return manager;
}

export function refreshMarkerClusters(map?: mapboxgl.Map | null) {
  if (!map) return;
  const manager = clusterManagers.get(map);
  if (manager) scheduleClusterUpdate(manager);
}

export function showPopup(
  currentLastPopup: mapboxgl.Popup | null,
  currentLastMarker: HTMLDivElement | null,
  id: string,
  data: MappableLocationItem,
  targetMap: mapboxgl.Map,
  markerElement: HTMLDivElement,
  popup: mapboxgl.Popup,
) {
  const songTitle = constructTitle(data);

  markerElement?.classList.add("z-[2000]");

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
  const markerEntry = markerEntries.get(markerElement);
  if (markerEntry) scheduleClusterUpdate(markerEntry.manager);
  useMapStore.getState().setSelectedLocationId(data.id);
  useMapStore.getState().setLastPopup(popup);
  useMapStore.getState().setLastMarker(markerElement);
  useUIStore.getState().setSelectedLocation({
    value: data.name,
    artists: data.artists,
    streetViewEmbed: data.streetViewEmbed ?? "",
  });
  const params = new URLSearchParams(window.location.search);

  params.set("title", songTitle);
  const query = params.toString();
  const newUrl = `${window.location.pathname}?${query}`;
  window.history.pushState({}, "", newUrl);
}

function createCustomMarker(
  popup: mapboxgl.Popup,
  data: MappableLocationItem,
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
        "image-skeleton mt-8 h-14 w-24 cursor-pointer rounded-md object-cover hover:scale-110 z-[1000]",
      onClick: () => {
        const targetMap = mapInstance;
        if (!targetMap) return;
        const contentIsVisible = markerElement.classList.contains("visible");
        const { lastPopup: currentLastPopup, lastMarker: currentLastMarker } =
          useMapStore.getState();

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
          showPopup(
            currentLastPopup,
            currentLastMarker,
            id,
            data,
            targetMap,
            markerElement,
            popup,
          );
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

export function addPlace(
  data: MappableLocationItem,
  mapInstance?: mapboxgl.Map,
) {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    closeOnMove: false,
    focusAfterOpen: false,
  });

  const targetMap = mapInstance;
  if (!targetMap) return;

  const markerElement = createCustomMarker(popup, data, targetMap);

  const marker = new mapboxgl.Marker({
    element: markerElement,
    anchor: "bottom",
  })
    .setLngLat([data.lng, data.lat])
    .addTo(targetMap);

  const manager = getClusterManager(targetMap);
  const entry = { data, element: markerElement, marker, manager };
  manager.entries.push(entry);
  markerEntries.set(markerElement, entry);
  scheduleClusterUpdate(manager);

  useMapStore.getState().addMarker(markerElement);
  popup.setLngLat([data.lng, data.lat]);
}

export function hidePopup(
  popup: mapboxgl.Popup,
  marker: HTMLDivElement,
  _id: string,
) {
  const root = popupRoots.get(popup);
  if (root) {
    root.unmount();
    popupRoots.delete(popup);
  }
  popup.remove();
  marker.classList.remove("visible");
  const markerEntry = markerEntries.get(marker);
  if (markerEntry) scheduleClusterUpdate(markerEntry.manager);
  marker?.classList.remove("z-[2000]");
  useMapStore.getState().clearSelectedLocation();
}

function createPopupContent(data: MappableLocationItem) {
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

function editPlace(data: MappableLocationItem) {
  useNewLocationStore.getState().setEditLocation(data);
  useUIStore.getState().setNewLocationModalOpen(true);
}

function deletePlace(data: MappableLocationItem) {
  const marker = document.querySelector(`[data-song="${data.name}"]`);
  if (marker && marker instanceof HTMLDivElement) {
    const entry = markerEntries.get(marker);
    if (entry) {
      entry.manager.entries = entry.manager.entries.filter(
        (candidate) => candidate !== entry,
      );
      entry.marker.remove();
      scheduleClusterUpdate(entry.manager);
      markerEntries.delete(marker);
    }
    const markerRoot = markerRoots.get(marker);
    if (markerRoot && typeof markerRoot.unmount === "function")
      markerRoot.unmount();
    if (!entry) marker.remove();
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
