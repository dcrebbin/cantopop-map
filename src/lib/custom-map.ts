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
import { ChevronUpIcon } from "@heroicons/react/24/solid";

const markerRoots = new WeakMap<HTMLDivElement, Root>();
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
  currentLastMarker: HTMLDivElement | null,
  data: MappableLocationItem,
  markerElement: HTMLDivElement,
) {
  const songTitle = constructTitle(data);

  markerElement?.classList.add("z-[2000]");

  if (currentLastMarker !== null && currentLastMarker !== markerElement) {
    hidePopup(currentLastMarker);
  }
  posthog.capture("view_location", {
    artists: data.artists.join(", "),
    songTitle: data.name,
  });
  markerElement.classList.add("visible");
  const markerEntry = markerEntries.get(markerElement);
  if (markerEntry) scheduleClusterUpdate(markerEntry.manager);
  useMapStore.getState().setSelectedLocationId(data.id);
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
  data: MappableLocationItem,
  mapInstance?: mapboxgl.Map,
) {
  const markerElement = document.createElement("div");
  markerElement.classList.add("group");

  const markerRoot = createRoot(markerElement);
  markerRoots.set(markerElement, markerRoot);
  const id = `${data.artists.join(", ")}-${data.name}`;
  const closeMarker = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("title");
    const query = params.toString();
    const newUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    window.history.pushState({}, "", newUrl);
    useUIStore.getState().setSelectedLocation({
      value: "",
      artists: [],
      streetViewEmbed: "",
    });
    hidePopup(markerElement);
  };
  markerRoot.render(
    createElement(
      "div",
      {
        className:
          "flex w-[5.25rem] flex-col overflow-hidden rounded-[0.65rem] bg-transparent drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-[width,filter] duration-[260ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none group-[.visible]:w-40 group-[.visible]:drop-shadow-[0_9px_14px_rgba(0,0,0,0.28)]",
      },
      createElement(
        "div",
        {
          className:
            "max-h-0 w-full origin-bottom translate-y-3 overflow-hidden opacity-0 transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none group-[.visible]:max-h-64 group-[.visible]:translate-y-0 group-[.visible]:opacity-100",
        },
        createElement(PopupContent, {
          data,
          onClose: closeMarker,
          onDelete: () => deletePlace(data),
          onEdit: () => editPlace(data),
        }),
      ),
      createElement(
        "button",
        {
          type: "button",
          id,
          className:
            "relative block h-16 w-[4.75rem] cursor-pointer self-center overflow-hidden rounded-[inherit] border-0 bg-transparent p-0 transition-[width,height,transform] duration-[260ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:scale-[1.04] focus-visible:scale-[1.04] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(17,24,39,0.45)] motion-reduce:transition-none group-[.visible]:h-32 group-[.visible]:w-full group-[.visible]:rounded-t-none group-[.visible]:rounded-b-[0.65rem] group-[.visible]:hover:scale-100",
          "data-marker-trigger": "",
          "aria-label": `Show ${data.name} by ${data.artists.join(", ")}`,
          onClick: () => {
            const targetMap = mapInstance;
            if (!targetMap) return;
            const contentIsVisible =
              markerElement.classList.contains("visible");
            const { lastMarker: currentLastMarker } = useMapStore.getState();

            if (contentIsVisible) {
              return;
            } else {
              showPopup(currentLastMarker, data, markerElement);
            }
          },
        },
        createElement("img", {
          src: data.image,
          alt: "",
          className:
            "image-skeleton relative z-[1] block size-full rounded-[0.42rem] object-cover group-[.visible]:rounded-t-none group-[.visible]:rounded-b-[0.65rem]",
        }),
        createElement(
          "div",
          {
            className:
              "pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pt-8 pb-2 text-left text-white opacity-0 transition-opacity duration-200 group-[.visible]:opacity-100",
          },
          createElement(
            "p",
            { className: "break-words text-xs leading-tight font-bold" },
            data.artists.join(", "),
          ),
          createElement(
            "p",
            { className: "break-words text-[0.65rem] leading-tight" },
            data.name,
          ),
        ),
        createElement(ChevronUpIcon, {
          "aria-hidden": true,
          className:
            "pointer-events-none absolute top-0 left-3 z-[3] size-5 -translate-x-1/2 text-white drop-shadow-[0_5px_6px_rgba(0,0,0,0.9)] transition-opacity duration-200 group-[.visible]:opacity-0",
        }),
      ),
    ),
  );
  markerElement.dataset.artist = data.artists.join(", ");
  markerElement.dataset.song = data.name;
  const contributorNames = extractContributorNamesFromLocation(data);
  if (contributorNames.length > 0) {
    markerElement.dataset.contributors = contributorNames.join(", ");
  }
  return markerElement;
}

export function addPlace(
  data: MappableLocationItem,
  mapInstance?: mapboxgl.Map,
) {
  const targetMap = mapInstance;
  if (!targetMap) return;

  const markerElement = createCustomMarker(data, targetMap);

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
}

export function hidePopup(marker: HTMLDivElement) {
  marker.classList.remove("visible");
  const markerEntry = markerEntries.get(marker);
  if (markerEntry) scheduleClusterUpdate(markerEntry.manager);
  marker?.classList.remove("z-[2000]");
  useMapStore.getState().clearSelectedLocation();
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
}
