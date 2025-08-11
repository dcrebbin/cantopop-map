import { create } from "zustand";

interface MapState {
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string) => void;
  clearSelectedLocation: () => void;
  lastPopup: mapboxgl.Popup | null;
  lastMarker: HTMLDivElement | null;
  setLastPopup: (popup: mapboxgl.Popup) => void;
  setLastMarker: (marker: HTMLDivElement) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedLocationId: null,
  setSelectedLocationId: (id: string) => set({ selectedLocationId: id }),
  clearSelectedLocation: () => set({ selectedLocationId: null }),
  lastPopup: null,
  setLastPopup: (popup: mapboxgl.Popup) => set({ lastPopup: popup }),
  lastMarker: null,
  setLastMarker: (marker: HTMLDivElement) => set({ lastMarker: marker }),
}));
