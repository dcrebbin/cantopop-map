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
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  setMenuOpen: (open: boolean) => set({ menuOpen: open }),
  searchRef: null,
  selectedArtists: [],
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
}));
