import type { SelectedVerse, Reciter } from "./quran";

export type BackgroundType = "color" | "image" | "video";

export interface BackgroundConfig {
  type: BackgroundType;
  color: string; // used when type === "color"
  url?: string; // object URL, used when type === "image" | "video"
  fileName?: string;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number; // px at 1080p reference
  textColor: string;
  highlightColor: string; // color applied to the active verse/word
  showTranslation: boolean;
  translationFontSize: number;
  position: "top" | "center" | "bottom";
}

export interface AudioConfig {
  reciter: Reciter | null;
  customAudioUrl?: string;
  customAudioName?: string;
  volume: number; // 0 - 1
}

export interface AspectRatioOption {
  id: "9:16" | "16:9" | "1:1";
  label: string;
  width: number;
  height: number;
}

export interface StudioProject {
  verses: SelectedVerse[];
  background: BackgroundConfig;
  audio: AudioConfig;
  captionStyle: CaptionStyle;
  aspectRatio: AspectRatioOption["id"];
}

export interface RenderState {
  status: "idle" | "preparing" | "recording" | "done" | "error";
  progress: number; // 0 - 100
  downloadUrl?: string;
  fileExtension?: "mp4" | "webm";
  error?: string;
}
