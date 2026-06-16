import { create } from "zustand";
import type { SelectedVerse, Surah } from "../../constants/quran";

interface SelectionState {
  surah: Surah | null;
  verses: SelectedVerse[];
  setSurah: (surah: Surah) => void;
  setVerses: (verses: SelectedVerse[]) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  surah: null,
  verses: [],
  setSurah: (surah) => set({ surah }),
  setVerses: (verses) => set({ verses }),
}));
