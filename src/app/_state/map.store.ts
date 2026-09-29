import { create } from "zustand";

export interface MarkerDebugStats {
  totalLocations: number;
  filteredLocations: number;
  standaloneMarkers: number;
  clusterMarkers: number;
  clusteredLocations: number;
  renderedMarkers: number;
  zoom: number;
}

interface MapState {
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string) => void;
  clearSelectedLocation: () => void;
  lastMarker: HTMLDivElement | null;
  setLastMarker: (marker: HTMLDivElement) => void;
  allMarkers: HTMLDivElement[];
  addMarker: (marker: HTMLDivElement) => void;
  markerDebugStats: MarkerDebugStats | null;
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map) => void;
  personalMarker: mapboxgl.Marker | null;
  addPersonalMarker: (marker: mapboxgl.Marker) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedLocationId: null,
  setSelectedLocationId: (id: string) => set({ selectedLocationId: id }),
  clearSelectedLocation: () =>
    set({ selectedLocationId: null, lastMarker: null }),
  lastMarker: null,
  setLastMarker: (marker: HTMLDivElement) => set({ lastMarker: marker }),
  allMarkers: [],
  addMarker: (marker: HTMLDivElement) =>
    set((state) => ({ allMarkers: [...state.allMarkers, marker] })),
  markerDebugStats: null,
  map: null,
  setMap: (map: mapboxgl.Map) => set({ map }),
  personalMarker: null,
  addPersonalMarker: (marker: mapboxgl.Marker) =>
    set({ personalMarker: marker }),
}));
