import { useCallback, useRef, useState } from "react";
import { ASPECT_RATIOS } from "../../constants";
import type { BackgroundConfig, CaptionStyle } from "../../constants/studio";
import type { VerseTiming } from "./timing";
import { drawFrame } from "./canvas-renderer";

interface ExportOptions {
  aspectRatio: "9:16" | "16:9" | "1:1";
  background: BackgroundConfig;
  captionStyle: CaptionStyle;
  timings: VerseTiming[];
  audioUrl: string | null;
  audioStartTime?: number;
  durationSeconds: number;
}

type ExportStatus = "idle" | "preparing" | "recording" | "done" | "error";

interface ExportState {
  status: ExportStatus;
  progress: number;
  downloadUrl?: string;
  error?: string;
}

export function useVideoExport() {
  const [state, setState] = useState<ExportState>({
    status: "idle",
    progress: 0,
  });
  const recorderRef = useRef<MediaRecorder | null>(null);

  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0 });
  }, []);

  const exportVideo = useCallback(async (opts: ExportOptions) => {
    const {
      aspectRatio,
      background,
      captionStyle,
      timings,
      audioUrl,
      audioStartTime = 0,
      durationSeconds,
    } = opts;
    const ratio = ASPECT_RATIOS.find((r) => r.id === aspectRatio)!;

    setState({ status: "preparing", progress: 0 });

    try {
      // ── 1. Off-screen canvas ──────────────────────────────────────────
      const canvas = document.createElement("canvas");
      canvas.width = ratio.width;
      canvas.height = ratio.height;
      const ctx = canvas.getContext("2d")!;

      // ── 2. Preload background media ───────────────────────────────────
      let bgMediaEl: HTMLImageElement | HTMLVideoElement | null = null;
      if (background.type === "image" && background.url) {
        const img = new Image();
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("Background image failed to load"));
          img.src = background.url!;
        });
        bgMediaEl = img;
      } else if (background.type === "video" && background.url) {
        const vid = document.createElement("video");
        vid.src = background.url;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        await vid.play();
        bgMediaEl = vid;
      }

      // ── 3. Set up audio ───────────────────────────────────────────────
      let audioContext: AudioContext | null = null;
      let audioEl: HTMLAudioElement | null = null;
      let audioDestStream: MediaStream | null = null;

      if (audioUrl) {
        audioEl = new Audio();
        // Do NOT set crossOrigin for cdn.islamic.network — it blocks Origin headers
        audioEl.src = audioUrl;
        audioEl.preload = "auto";

        await new Promise<void>((res) => {
          const timeout = setTimeout(() => res(), 6000); // always resolve after 6s
          audioEl!.addEventListener(
            "canplaythrough",
            () => {
              clearTimeout(timeout);
              res();
            },
            { once: true },
          );
          audioEl!.addEventListener(
            "error",
            () => {
              clearTimeout(timeout);
              res(); // resolve anyway — play() will handle it
            },
            { once: true },
          );
          audioEl!.load();
        });

        audioContext = new AudioContext({ sampleRate: 44100 });
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const source = audioContext.createMediaElementSource(audioEl);
        const dest = audioContext.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioContext.destination);

        audioDestStream = dest.stream;
      }

      // ── 4. Combine streams ────────────────────────────────────────────
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioDestStream?.getAudioTracks() ?? []),
      ]);

      // ── 5. Codec selection ────────────────────────────────────────────
      const mimeType =
        [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 4_000_000,
        audioBitsPerSecond: 192_000,
      });
      recorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

      // ── 6. Start recording ────────────────────────────────────────────
      recorder.start(100);
      setState({ status: "recording", progress: 0 });

      if (audioEl) {
        audioEl.currentTime = audioStartTime; // ← seek to verse start
        await audioEl.play();
      }

      // ── 7. Render loop ────────────────────────────────────────────────
      const startTime = performance.now();
      const totalMs = durationSeconds * 1000;

      await new Promise<void>((resolve) => {
        function renderFrame() {
          const elapsed = performance.now() - startTime;
          const currentTime = elapsed / 1000;
          const progress = Math.min((elapsed / totalMs) * 100, 100);

          setState({ status: "recording", progress: Math.round(progress) });

          drawFrame({
            ctx,
            width: canvas.width,
            height: canvas.height,
            background,
            bgMediaEl,
            captionStyle,
            timings,
            currentTime,
          });

          if (elapsed < totalMs) {
            requestAnimationFrame(renderFrame);
          } else {
            resolve();
          }
        }
        renderFrame();
      });

      // ── 8. Tear down ──────────────────────────────────────────────────
      if (bgMediaEl instanceof HTMLVideoElement) bgMediaEl.pause();
      audioEl?.pause();
      await audioContext?.close();

      await new Promise<void>((res) => {
        recorder.onstop = () => res();
        recorder.stop();
      });

      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      const downloadUrl = URL.createObjectURL(blob);
      setState({ status: "done", progress: 100, downloadUrl });
    } catch (err) {
      setState({
        status: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Export failed",
      });
    }
  }, []);

  return { state, exportVideo, reset };
}
