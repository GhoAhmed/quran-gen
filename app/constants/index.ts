import type { AspectRatioOption } from "./studio";

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "9:16", label: "Reels / TikTok / Shorts", width: 1080, height: 1920 },
  { id: "16:9", label: "YouTube / Landscape", width: 1920, height: 1080 },
  { id: "1:1", label: "Square / Feed", width: 1080, height: 1080 },
];

export const FONT_OPTIONS = [
  { label: "Amiri Quran", value: "'Amiri Quran', serif" },
  { label: "Noto Naskh Arabic", value: "'Noto Naskh Arabic', serif" },
  { label: "Scheherazade New", value: "'Scheherazade New', serif" },
];

export const CAPTION_COLORS = [
  "#ffffff",
  "#facc15",
  "#34d399",
  "#60a5fa",
  "#f472b6",
];
