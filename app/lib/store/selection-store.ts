import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SelectedVerse, Surah } from "../../constants/quran";

interface SelectionState {
  surah: Surah | null;
  verses: SelectedVerse[];
  setSurah: (surah: Surah | null) => void;
  setVerses: (verses: SelectedVerse[]) => void;
  reset: () => void;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      surah: null,
      verses: [],
      setSurah: (surah) => set({ surah, verses: [] }),
      setVerses: (verses) => set({ verses }),
      reset: () => set({ surah: null, verses: [] }),
    }),
    { name: "quran-studio-selection" },
  ),
);
