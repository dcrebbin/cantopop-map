import { create } from "zustand";
import { ARTISTS, SONGS, CONTRIBUTORS } from "../common/locations";

interface UIState {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  searchRef: React.RefObject<HTMLInputElement> | null;
  selectedArtists: string[];
  setSelectedArtists: (artists: string[]) => void;
  selectedContributors: string[];
  setSelectedContributors: (contributors: string[]) => void;
  selectedSongs: { name: string; artists: string[] }[];
  setSelectedSongs: (songs: { name: string; artists: string[] }[]) => void;
  filteredArtists: string[];
  setFilteredArtists: (artists: string[]) => void;
  filteredSongs: { name: string; artists: string[] }[];
  setFilteredSongs: (songs: { name: string; artists: string[] }[]) => void;
  filteredContributors: string[];
  setFilteredContributors: (contributors: string[]) => void;
  newLocationModalOpen: boolean;
  setNewLocationModalOpen: (open: boolean) => void;
  songsAndArtistsOpen: boolean;
  setSongsAndArtistsOpen: (open: boolean) => void;
  contributorsOpen: boolean;
  setContributorsOpen: (open: boolean) => void;
  mobileCameraViewOpen: boolean;
  setMobileCameraViewOpen: (open: boolean) => void;
  gameOpen: boolean;
  gameScore: number;
  totalLocations: number;
  setGameScore: (score: number) => void;
  setTotalLocations: (total: number) => void;
  setGameOpen: (open: boolean) => void;
  selectedLocation: {
    value: string;
    artists: string[];
    streetViewEmbed: string;
  } | null;
  setSelectedLocation: (location: {
    value: string;
    artists: string[];
    streetViewEmbed: string;
  }) => void;
  isPwaTutorialVisible: boolean;
  setIsPwaTutorialVisible: (visible: boolean) => void;
  combinedFilters: { type: "artist" | "contributor"; name: string }[];
  setCombinedFilters: (
    filters: { type: "artist" | "contributor"; name: string }[],
  ) => void;
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  setMenuOpen: (open: boolean) => set({ menuOpen: open }),
  searchRef: null,
  selectedArtists: [],
  mobileCameraViewOpen: false,
  setMobileCameraViewOpen: (open: boolean) =>
    set({ mobileCameraViewOpen: open }),
  setSelectedArtists: (artists: string[]) => set({ selectedArtists: artists }),
  selectedContributors: [],
  setSelectedContributors: (contributors: string[]) =>
    set({ selectedContributors: contributors }),
  selectedSongs: [],
  setSelectedSongs: (songs: { name: string; artists: string[] }[]) =>
    set({ selectedSongs: songs }),
  filteredArtists: ARTISTS,
  setFilteredArtists: (artists: string[]) => set({ filteredArtists: artists }),
  filteredSongs: SONGS,
  setFilteredSongs: (songs: { name: string; artists: string[] }[]) =>
    set({ filteredSongs: songs }),
  filteredContributors: CONTRIBUTORS,
  setFilteredContributors: (contributors: string[]) =>
    set({ filteredContributors: contributors }),
  newLocationModalOpen: false,
  setNewLocationModalOpen: (open: boolean) =>
    set({ newLocationModalOpen: open }),
  songsAndArtistsOpen: true,
  setSongsAndArtistsOpen: (open: boolean) => set({ songsAndArtistsOpen: open }),
  contributorsOpen: true,
  setContributorsOpen: (open: boolean) => set({ contributorsOpen: open }),
  gameOpen: false,
  setGameOpen: (open: boolean) => set({ gameOpen: open }),
  gameScore: 0,
  totalLocations: 0,
  setTotalLocations: (total: number) => set({ totalLocations: total }),
  setGameScore: (score: number) => set({ gameScore: score }),
  selectedLocation: null,
  setSelectedLocation: (location: {
    value: string;
    artists: string[];
    streetViewEmbed: string;
  }) => set({ selectedLocation: location }),
  isPwaTutorialVisible: false,
  setIsPwaTutorialVisible: (visible: boolean) =>
    set({ isPwaTutorialVisible: visible }),
  combinedFilters: [],
  setCombinedFilters: (
    filters: { type: "artist" | "contributor"; name: string }[],
  ) => set({ combinedFilters: filters }),
}));
