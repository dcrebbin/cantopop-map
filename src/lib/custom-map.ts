import mapboxgl from "mapbox-gl";
import { createElement, type SyntheticEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import posthog from "posthog-js";
import {
  constructTitle,
  extractContributorNamesFromLocation,
  type MappableLocationItem,
} from "~/app/common/lib";
import { useMapStore } from "~/app/_state/map.store";
import { useUIStore } from "~/app/_state/ui.store";
import { PopupContent } from "~/app/components/map/PopupContent";

const SOURCE = "cantopop-locations";
const CLUSTERS = "cantopop-clusters";
const CLUSTER_BADGES = "cantopop-cluster-badges";
const COUNTS = "cantopop-cluster-counts";
const POINTS = "cantopop-points";
const THUMBNAIL_WIDTH = 76;
const THUMBNAIL_HEIGHT = 64;
const THUMBNAIL_PIXEL_RATIO = 2;
const MAX_IMAGE_LOADS = 8;

type Props = { locationId: string; selected: boolean; thumbnail: string };
interface Manager {
  map: mapboxgl.Map;
  locations: Map<string, MappableLocationItem>;
  visibleIds: Set<string> | null;
  marker: mapboxgl.Marker | null;
  element: HTMLDivElement | null;
  root: Root | null;
  frame: number | null;
  viewportFrame: number | null;
  ready: boolean;
  disposed: boolean;
  queuedImages: Set<string>;
  pendingImages: Set<string>;
  loadedImages: Set<string>;
  imageLayoutFrame: number | null;
  imageQueue: MappableLocationItem[];
  activeImageLoads: number;
  skeletonFrame: number | null;
  lastSkeletonPaint: number;
}
const managers = new WeakMap<mapboxgl.Map, Manager>();
const elementManagers = new WeakMap<HTMLDivElement, Manager>();

function thumbnailId(location: MappableLocationItem) {
  return `cantopop-thumbnail-${location.id}`;
}

function data(
  manager: Manager,
): GeoJSON.FeatureCollection<GeoJSON.Point, Props> {
  const selected = useMapStore.getState().selectedLocationId;
  return {
    type: "FeatureCollection",
    features: [...manager.locations.values()]
      .filter(
        (location) =>
          manager.visibleIds === null || manager.visibleIds.has(location.id),
      )
      .map((location) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [location.lng, location.lat] },
        properties: {
          locationId: location.id,
          selected: location.id === selected,
          thumbnail: thumbnailId(location),
        },
      })),
  };
}

function drawThumbnail(image?: CanvasImageSource) {
  const scale = THUMBNAIL_PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_WIDTH * scale;
  canvas.height = THUMBNAIL_HEIGHT * scale;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return new ImageData(canvas.width, canvas.height);

  context.scale(scale, scale);
  context.beginPath();
  context.roundRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, 7);
  context.clip();
  context.fillStyle = "#d1d5db";
  context.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  if (image) {
    const sourceWidth =
      image instanceof HTMLImageElement
        ? image.naturalWidth
        : image instanceof ImageBitmap
          ? image.width
          : THUMBNAIL_WIDTH;
    const sourceHeight =
      image instanceof HTMLImageElement
        ? image.naturalHeight
        : image instanceof ImageBitmap
          ? image.height
          : THUMBNAIL_HEIGHT;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = THUMBNAIL_WIDTH / THUMBNAIL_HEIGHT;
    const cropWidth =
      sourceRatio > targetRatio ? sourceHeight * targetRatio : sourceWidth;
    const cropHeight =
      sourceRatio > targetRatio ? sourceHeight : sourceWidth / targetRatio;
    context.drawImage(
      image,
      (sourceWidth - cropWidth) / 2,
      (sourceHeight - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      THUMBNAIL_WIDTH,
      THUMBNAIL_HEIGHT,
    );
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function drawSkeleton(progress: number) {
  const scale = THUMBNAIL_PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_WIDTH * scale;
  canvas.height = THUMBNAIL_HEIGHT * scale;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return new ImageData(canvas.width, canvas.height);

  context.scale(scale, scale);
  context.beginPath();
  context.roundRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, 7);
  context.clip();
  context.fillStyle = "#d1d5db";
  context.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  const bandCenter = -THUMBNAIL_WIDTH + progress * THUMBNAIL_WIDTH * 3;
  const gradient = context.createLinearGradient(
    bandCenter - THUMBNAIL_WIDTH,
    0,
    bandCenter + THUMBNAIL_WIDTH,
    0,
  );
  gradient.addColorStop(0, "rgb(209 213 219 / 0%)");
  gradient.addColorStop(0.5, "rgb(243 244 246 / 85%)");
  gradient.addColorStop(1, "rgb(209 213 219 / 0%)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function registerThumbnails(manager: Manager) {
  const skeleton = drawSkeleton(0);
  for (const location of manager.locations.values()) {
    const id = thumbnailId(location);
    if (manager.map.hasImage(id)) continue;
    // Keep the symbol's image identity and dimensions stable while it loads.
    manager.map.addImage(id, skeleton, {
      pixelRatio: THUMBNAIL_PIXEL_RATIO,
    });
    manager.pendingImages.add(id);
  }
}

function animateSkeleton(manager: Manager, time: number) {
  manager.skeletonFrame = null;
  if (manager.disposed) return;
  if (time - manager.lastSkeletonPaint >= 80) {
    manager.lastSkeletonPaint = time;
    const skeleton = drawSkeleton((time % 1400) / 1400);
    for (const id of manager.queuedImages) {
      if (manager.pendingImages.has(id) && manager.map.hasImage(id)) {
        manager.map.updateImage(id, skeleton);
      }
    }
    manager.map.triggerRepaint();
  }
  if (manager.imageQueue.length > 0 || manager.activeImageLoads > 0) {
    manager.skeletonFrame = requestAnimationFrame((nextTime) =>
      animateSkeleton(manager, nextTime),
    );
  }
}

function startSkeleton(manager: Manager) {
  manager.skeletonFrame ??= requestAnimationFrame((time) =>
    animateSkeleton(manager, time),
  );
}

function loadThumbnail(location: MappableLocationItem) {
  return new Promise<ImageData>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        resolve(drawThumbnail(image));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Invalid thumbnail"));
      }
    };
    image.onerror = () => reject(new Error(`Unable to load ${location.image}`));
    image.src = location.image;
  });
}

function scheduleThumbnailLayout(manager: Manager) {
  manager.imageLayoutFrame ??= requestAnimationFrame(() => {
    manager.imageLayoutFrame = null;
    if (manager.disposed || !manager.ready) return;
    // Explicitly change the symbol's image reference. Updating placeholder
    // pixels leaves worker/cached tile snapshots able to retain the old image.
    const image: mapboxgl.ExpressionSpecification = [
      "case",
      ["in", ["get", "thumbnail"], ["literal", [...manager.loadedImages]]],
      ["concat", ["get", "thumbnail"], "-loaded"],
      ["get", "thumbnail"],
    ];
    for (const layer of [CLUSTERS, POINTS]) {
      manager.map.setLayoutProperty(layer, "icon-image", image);
    }
  });
}

function pumpImageQueue(manager: Manager) {
  while (
    !manager.disposed &&
    manager.activeImageLoads < MAX_IMAGE_LOADS &&
    manager.imageQueue.length > 0
  ) {
    const location = manager.imageQueue.shift()!;
    const id = thumbnailId(location);
    manager.activeImageLoads++;
    void loadThumbnail(location)
      .then((image) => {
        if (!manager.disposed && manager.map.hasImage(id)) {
          // Loaded photos are immutable atlas entries, separate from placeholders.
          manager.map.addImage(`${id}-loaded`, image, {
            pixelRatio: THUMBNAIL_PIXEL_RATIO,
          });
          manager.loadedImages.add(id);
          scheduleThumbnailLayout(manager);
          manager.pendingImages.delete(id);
          manager.map.triggerRepaint();
        }
      })
      .catch(() => {
        // Leave the placeholder visible when an image fails. A
        // later map initialization can retry instead of caching a false success.
        // Keep this attempt recorded so idle events do not retry indefinitely.
      })
      .finally(() => {
        manager.activeImageLoads--;
        pumpImageQueue(manager);
      });
  }
}

function queueThumbnail(manager: Manager, location: MappableLocationItem) {
  const id = thumbnailId(location);
  if (manager.queuedImages.has(id) || !manager.pendingImages.has(id)) return;
  manager.queuedImages.add(id);
  manager.imageQueue.push(location);
  startSkeleton(manager);
  pumpImageQueue(manager);
}

function queueVisibleThumbnails(manager: Manager) {
  if (!manager.ready || manager.disposed) return;
  const visibleThumbnailIds = new Set(
    manager.map
      .queryRenderedFeatures({ layers: [CLUSTERS, POINTS] })
      .map((feature) => String(feature.properties?.thumbnail ?? ""))
      .filter(Boolean),
  );

  for (const location of manager.locations.values()) {
    if (visibleThumbnailIds.has(thumbnailId(location))) {
      queueThumbnail(manager, location);
    }
  }
}

function scheduleVisibleThumbnails(manager: Manager) {
  manager.viewportFrame ??= requestAnimationFrame(() => {
    manager.viewportFrame = null;
    queueVisibleThumbnails(manager);
  });
}

function debug(manager: Manager) {
  if (import.meta.env.VITE_REACT_SCAN !== "true" || !manager.ready) return;
  const canvas = manager.map.getCanvas();
  const features = manager.map.queryRenderedFeatures(
    [
      [0, 0],
      [canvas.clientWidth, canvas.clientHeight],
    ],
    { layers: [CLUSTERS, POINTS] },
  );
  let clusterMarkers = 0;
  let clusteredLocations = 0;
  let standaloneMarkers = 0;
  for (const feature of features) {
    const count = Number(feature.properties?.point_count ?? 0);
    if (count) {
      clusterMarkers++;
      clusteredLocations += count;
    } else standaloneMarkers++;
  }
  useMapStore.setState({
    markerDebugStats: {
      totalLocations: manager.locations.size,
      filteredLocations: manager.visibleIds?.size ?? manager.locations.size,
      standaloneMarkers,
      clusterMarkers,
      clusteredLocations,
      renderedMarkers: features.length,
      zoom: manager.map.getZoom(),
    },
  });
}

function update(manager: Manager) {
  manager.frame = null;
  if (!manager.ready || manager.disposed) return;
  registerThumbnails(manager);
  manager.map.getSource<mapboxgl.GeoJSONSource>(SOURCE)?.setData(data(manager));
}
function schedule(manager: Manager) {
  manager.frame ??= requestAnimationFrame(() => update(manager));
}

function initialize(manager: Manager) {
  if (manager.ready || manager.map.getSource(SOURCE)) return;
  registerThumbnails(manager);
  manager.map.addSource(SOURCE, {
    type: "geojson",
    data: data(manager),
    cluster: true,
    clusterRadius: 36,
    clusterMaxZoom: 18,
    clusterProperties: {
      thumbnail: [
        ["coalesce", ["accumulated"], ["get", "thumbnail"]],
        ["get", "thumbnail"],
      ],
    },
  });
  const thumbnailImage: mapboxgl.ExpressionSpecification = ["get", "thumbnail"];
  manager.map.addLayer({
    id: CLUSTERS,
    type: "symbol",
    source: SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "icon-image": thumbnailImage,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
  manager.map.addLayer({
    id: CLUSTER_BADGES,
    type: "circle",
    source: SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#111827",
      "circle-radius": 11,
      "circle-stroke-color": "#000000",
      "circle-stroke-width": 1.5,
      "circle-translate": [29, -24],
      "circle-translate-anchor": "viewport",
    },
  });
  manager.map.addLayer({
    id: COUNTS,
    type: "symbol",
    source: SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "text-field": [
        "concat",
        "+",
        ["to-string", ["-", ["get", "point_count"], 1]],
      ],
      "text-size": 12,
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#fff", "text-translate": [29, -24] },
  });
  manager.map.addLayer({
    id: POINTS,
    type: "symbol",
    source: SOURCE,
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "selected"], false],
    ],
    layout: {
      "icon-image": thumbnailImage,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
  manager.ready = true;
  manager.map.on("click", CLUSTERS, (event) => {
    const feature = event.features?.[0];
    const clusterId = Number(feature?.properties?.cluster_id);
    if (!feature || !Number.isFinite(clusterId)) return;
    const source = manager.map.getSource<mapboxgl.GeoJSONSource>(SOURCE)!;
    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || zoom == null) return;
      manager.map.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ],
        zoom,
      });
    });
  });
  manager.map.on("click", POINTS, (event) => {
    const location = manager.locations.get(
      String(event.features?.[0]?.properties?.locationId ?? ""),
    );
    if (location) openLocationPopup(location, manager.map);
  });
  for (const layer of [CLUSTERS, POINTS]) {
    manager.map.on("mouseenter", layer, () => {
      manager.map.getCanvas().style.cursor = "pointer";
    });
    manager.map.on("mouseleave", layer, () => {
      manager.map.getCanvas().style.cursor = "";
    });
  }
  // moveend can precede the worker's new zoom tiles and symbol placement.
  // Check again once those symbols are actually rendered, without rebuilding
  // the source (which used to make clicking a marker unstick image loading).
  manager.map.on("idle", () => {
    queueVisibleThumbnails(manager);
    debug(manager);
  });
  manager.map.on("moveend", () => {
    queueVisibleThumbnails(manager);
    debug(manager);
  });
  // Discover newly placed symbols even while another image keeps the shimmer
  // repainting, which prevents Mapbox from reaching idle.
  manager.map.on("render", () => scheduleVisibleThumbnails(manager));
  manager.map.on("resize", () => {
    queueVisibleThumbnails(manager);
    debug(manager);
  });
  schedule(manager);
}

function getManager(map: mapboxgl.Map) {
  const found = managers.get(map);
  if (found) return found;
  const manager: Manager = {
    map,
    locations: new Map(),
    visibleIds: null,
    marker: null,
    element: null,
    root: null,
    frame: null,
    viewportFrame: null,
    ready: false,
    disposed: false,
    queuedImages: new Set(),
    pendingImages: new Set(),
    loadedImages: new Set(),
    imageLayoutFrame: null,
    imageQueue: [],
    activeImageLoads: 0,
    skeletonFrame: null,
    lastSkeletonPaint: 0,
  };
  managers.set(map, manager);
  if (map.isStyleLoaded()) initialize(manager);
  else map.once("load", () => initialize(manager));
  map.once("remove", () => {
    manager.disposed = true;
    if (manager.frame !== null) cancelAnimationFrame(manager.frame);
    if (manager.viewportFrame !== null)
      cancelAnimationFrame(manager.viewportFrame);
    if (manager.imageLayoutFrame !== null)
      cancelAnimationFrame(manager.imageLayoutFrame);
    if (manager.skeletonFrame !== null)
      cancelAnimationFrame(manager.skeletonFrame);
    manager.root?.unmount();
    manager.marker?.remove();
    managers.delete(map);
    useMapStore.setState({ markerDebugStats: null });
  });
  return manager;
}

export function refreshMarkerClusters(map?: mapboxgl.Map | null) {
  if (!map) return;
  const manager = managers.get(map);
  if (manager) schedule(manager);
}

export function setMarkerFilters(
  map: mapboxgl.Map | null,
  artists: string[],
  contributors: string[],
) {
  if (!map) return;
  const manager = getManager(map);
  if (!artists.length && !contributors.length) manager.visibleIds = null;
  else {
    const artistSet = new Set(artists);
    const contributorSet = new Set(contributors);
    manager.visibleIds = new Set(
      [...manager.locations.values()]
        .filter(
          (location) =>
            location.artists.some((name) => artistSet.has(name)) ||
            extractContributorNamesFromLocation(location).some((name) =>
              contributorSet.has(name),
            ),
        )
        .map((location) => location.id),
    );
  }
  schedule(manager);
}

function selectedElement(location: MappableLocationItem, manager: Manager) {
  const element = document.createElement("div");
  element.className =
    "z-[2000] w-40 overflow-hidden rounded-[0.65rem] drop-shadow-[0_9px_14px_rgba(0,0,0,0.28)]";
  element.dataset.song = location.name;
  const root = createRoot(element);
  const close = () => {
    const params = new URLSearchParams(locationSearch());
    params.delete("title");
    history.pushState(
      {},
      "",
      params.size
        ? `${window.location.pathname}?${params}`
        : window.location.pathname,
    );
    useUIStore
      .getState()
      .setSelectedLocation({ value: "", artists: [], streetViewEmbed: "" });
    hidePopup(element);
  };
  root.render(
    createElement(
      "div",
      {
        className:
          "flex w-40 flex-col overflow-hidden rounded-[0.65rem] bg-transparent",
      },
      createElement(PopupContent, { data: location, onClose: close }),
      createElement(
        "div",
        {
          className: "relative h-32 w-full overflow-hidden rounded-b-[0.65rem]",
        },
        createElement("img", {
          src: location.image,
          alt: "",
          draggable: false,
          className: "image-skeleton absolute inset-0 size-full object-cover",
          onLoad: (event: SyntheticEvent<HTMLImageElement>) => {
            event.currentTarget.classList.remove("image-skeleton");
          },
        }),
        createElement(
          "div",
          {
            className:
              "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pt-8 pb-2 text-white",
            "data-popup-selectable": "",
          },
          createElement(
            "p",
            { className: "text-xs leading-tight font-bold" },
            location.artists.join(", "),
          ),
          createElement(
            "p",
            { className: "text-[0.65rem] leading-tight" },
            location.name,
          ),
        ),
      ),
    ),
  );
  manager.element = element;
  manager.root = root;
  elementManagers.set(element, manager);
  return element;
}

function locationSearch() {
  return window.location.search;
}

export function openLocationPopup(
  location: MappableLocationItem,
  map?: mapboxgl.Map | null,
) {
  if (!map) return;
  const manager = getManager(map);
  if (manager.element) hidePopup(manager.element);
  const element = selectedElement(location, manager);
  manager.marker = new mapboxgl.Marker({
    element,
    anchor: "bottom",
    offset: [0, 35],
  })
    .setLngLat([location.lng, location.lat])
    .addTo(map);
  posthog.capture("view_location", {
    artists: location.artists.join(", "),
    songTitle: location.name,
  });
  useMapStore.setState({
    selectedLocationId: location.id,
    lastMarker: element,
  });
  useUIStore.getState().setSelectedLocation({
    value: location.name,
    artists: location.artists,
    streetViewEmbed: location.streetViewEmbed ?? "",
  });
  const params = new URLSearchParams(locationSearch());
  params.set("title", constructTitle(location));
  history.pushState({}, "", `${window.location.pathname}?${params}`);
  schedule(manager);
}

export function addPlace(location: MappableLocationItem, map?: mapboxgl.Map) {
  if (!map) return;
  const manager = getManager(map);
  manager.locations.set(location.id, location);
  schedule(manager);
}

export function hidePopup(element: HTMLDivElement) {
  const manager = elementManagers.get(element);
  if (!manager) return;
  elementManagers.delete(element);
  manager.marker?.remove();
  manager.root?.unmount();
  manager.marker = manager.element = manager.root = null;
  useMapStore.getState().clearSelectedLocation();
  schedule(manager);
}
