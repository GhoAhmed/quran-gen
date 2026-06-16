import type { BackgroundConfig, CaptionStyle } from "../../constants/studio";
import type { VerseTiming } from "./timing";

interface DrawFrameArgs {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  background: BackgroundConfig;
  bgMediaEl: HTMLImageElement | HTMLVideoElement | null;
  captionStyle: CaptionStyle;
  timings: VerseTiming[];
  currentTime: number;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawFrame({
  ctx,
  width,
  height,
  background,
  bgMediaEl,
  captionStyle,
  timings,
  currentTime,
}: DrawFrameArgs) {
  // 1. Background
  ctx.clearRect(0, 0, width, height);

  if (background.type === "color" || !bgMediaEl) {
    ctx.fillStyle = background.color || "#0b1320";
    ctx.fillRect(0, 0, width, height);
  } else {
    // Cover-fit the media element into the canvas
    const mediaW =
      bgMediaEl instanceof HTMLVideoElement
        ? bgMediaEl.videoWidth
        : bgMediaEl.naturalWidth;
    const mediaH =
      bgMediaEl instanceof HTMLVideoElement
        ? bgMediaEl.videoHeight
        : bgMediaEl.naturalHeight;

    if (mediaW && mediaH) {
      const scale = Math.max(width / mediaW, height / mediaH);
      const drawW = mediaW * scale;
      const drawH = mediaH * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;
      ctx.drawImage(bgMediaEl, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = "#0b1320";
      ctx.fillRect(0, 0, width, height);
    }

    // Darken overlay for caption legibility
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Find the active verse for the given time
  const active =
    timings.find((t) => currentTime >= t.start && currentTime < t.end) ??
    timings[timings.length - 1];

  if (!active) return;

  const padding = width * 0.08;
  const maxWidth = width - padding * 2;

  const scaleFactor = width / 1080;
  const arabicFontSize = captionStyle.fontSize * scaleFactor;
  const translationFontSize = captionStyle.translationFontSize * scaleFactor;

  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.font = `${arabicFontSize}px ${captionStyle.fontFamily}`;
  const arabicLines = wrapText(ctx, active.verse.text, maxWidth);

  ctx.direction = "ltr";
  ctx.font = `${translationFontSize}px Inter, sans-serif`;
  const translationLines =
    captionStyle.showTranslation && active.verse.translation
      ? wrapText(ctx, active.verse.translation, maxWidth)
      : [];

  const lineHeightAr = arabicFontSize * 1.5;
  const lineHeightTr = translationFontSize * 1.4;
  const gap = 20 * scaleFactor;

  const blockHeight =
    arabicLines.length * lineHeightAr +
    (translationLines.length
      ? gap + translationLines.length * lineHeightTr
      : 0);

  let startY: number;
  if (captionStyle.position === "top") {
    startY = padding + lineHeightAr * 0.8;
  } else if (captionStyle.position === "bottom") {
    startY = height - padding - blockHeight + lineHeightAr * 0.8;
  } else {
    startY = (height - blockHeight) / 2 + lineHeightAr * 0.8;
  }

  // Subtle text shadow for legibility on any background
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 14 * scaleFactor;

  ctx.direction = "rtl";
  ctx.font = `${arabicFontSize}px ${captionStyle.fontFamily}`;
  ctx.fillStyle = captionStyle.highlightColor;
  arabicLines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeightAr);
  });

  if (translationLines.length) {
    const trStartY = startY + arabicLines.length * lineHeightAr + gap;
    ctx.direction = "ltr";
    ctx.font = `${translationFontSize}px Inter, sans-serif`;
    ctx.fillStyle = captionStyle.textColor;
    translationLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, trStartY + i * lineHeightTr);
    });
  }

  ctx.shadowBlur = 0;

  // Verse reference badge
  ctx.font = `${16 * scaleFactor}px Inter, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.direction = "ltr";
  ctx.fillText(
    `${active.verse.surahName} · ${active.verse.numberInSurah}`,
    width / 2,
    height - padding * 0.5,
  );
}
