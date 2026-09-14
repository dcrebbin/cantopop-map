import { create } from "zustand";

interface MapState {
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string) => void;
  clearSelectedLocation: () => void;
  lastMarker: HTMLDivElement | null;
  setLastMarker: (marker: HTMLDivElement) => void;
  allMarkers: HTMLDivElement[];
  addMarker: (marker: HTMLDivElement) => void;
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
  map: null,
  setMap: (map: mapboxgl.Map) => set({ map }),
  personalMarker: null,
  addPersonalMarker: (marker: mapboxgl.Marker) =>
    set({ personalMarker: marker }),
}));
