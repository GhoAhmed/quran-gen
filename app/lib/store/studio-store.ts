import { create } from "zustand";
import type { SelectedVerse } from "../../constants/quran";
import type {
  AudioConfig,
  BackgroundConfig,
  CaptionStyle,
} from "../../constants/studio";

interface StudioState {
  verses: SelectedVerse[];
  background: BackgroundConfig;
  audio: AudioConfig;
  captionStyle: CaptionStyle;
  aspectRatio: "9:16" | "16:9" | "1:1";

  setVerses: (verses: SelectedVerse[]) => void;
  setBackground: (background: Partial<BackgroundConfig>) => void;
  setAudio: (audio: Partial<AudioConfig>) => void;
  setCaptionStyle: (style: Partial<CaptionStyle>) => void;
  setAspectRatio: (ratio: "9:16" | "16:9" | "1:1") => void;
}

const defaultCaptionStyle: CaptionStyle = {
  fontFamily: "'Amiri Quran', serif",
  fontSize: 52,
  textColor: "#ffffff",
  highlightColor: "#facc15",
  showTranslation: true,
  translationFontSize: 26,
  position: "center",
};

const defaultBackground: BackgroundConfig = {
  type: "color",
  color: "#0b1320",
};

const defaultAudio: AudioConfig = {
  reciter: null,
  volume: 1,
};

export const useStudioStore = create<StudioState>((set) => ({
  verses: [],
  background: defaultBackground,
  audio: defaultAudio,
  captionStyle: defaultCaptionStyle,
  aspectRatio: "9:16",

  setVerses: (verses) => set({ verses }),
  setBackground: (background) =>
    set((s) => ({ background: { ...s.background, ...background } })),
  setAudio: (audio) => set((s) => ({ audio: { ...s.audio, ...audio } })),
  setCaptionStyle: (style) =>
    set((s) => ({ captionStyle: { ...s.captionStyle, ...style } })),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
}));
