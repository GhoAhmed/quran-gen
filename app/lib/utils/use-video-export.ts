import { useCallback, useRef, useState } from "react";
import { ASPECT_RATIOS } from "../../constants";
import { drawFrame } from "./canvas-renderer";
import type { VerseTiming } from "./timing";
import type {
  BackgroundConfig,
  CaptionStyle,
  RenderState,
} from "../../constants/studio";

interface ExportArgs {
  aspectRatio: "9:16" | "16:9" | "1:1";
  background: BackgroundConfig;
  captionStyle: CaptionStyle;
  timings: VerseTiming[];
  audioQueue: string[];
  durationSeconds: number;
}

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }
  return "video/webm";
}

export function useVideoExport() {
  const [state, setState] = useState<RenderState>({
    status: "idle",
    progress: 0,
  });
  const cancelRef = useRef(false);

  const exportVideo = useCallback(async (args: ExportArgs) => {
    cancelRef.current = false;
    setState({ status: "preparing", progress: 0 });

    try {
      const ratio = ASPECT_RATIOS.find((r) => r.id === args.aspectRatio)!;
      const canvas = document.createElement("canvas");
      canvas.width = ratio.width;
      canvas.height = ratio.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // ── Preload background media ──────────────────────────────────────
      let bgMediaEl: HTMLImageElement | HTMLVideoElement | null = null;
      if (args.background.type === "image" && args.background.url) {
        bgMediaEl = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = args.background.url!;
        });
      } else if (args.background.type === "video" && args.background.url) {
        bgMediaEl = await new Promise<HTMLVideoElement>((resolve, reject) => {
          const vid = document.createElement("video");
          vid.muted = true;
          vid.loop = true;
          vid.playsInline = true;
          vid.oncanplay = () => resolve(vid);
          vid.onerror = reject;
          vid.src = args.background.url!;
        });
        await bgMediaEl.play();
      }

      // ── Audio via fetch → AudioBuffer (no CORS issues) ────────────────
      // Using fetch + decodeAudioData instead of <audio> + createMediaElementSource
      // because the CDN doesn't send CORS headers, which makes crossOrigin="anonymous"
      // fail with "element has no supported sources". Fetch reads the raw bytes
      // and we decode locally — no Origin header negotiation needed.
      let audioCtx: AudioContext | null = null;
      let audioDestStream: MediaStream | null = null;
      let totalAudioDuration = 0;

      if (args.audioQueue.length) {
        audioCtx = new AudioContext();
        if (audioCtx.state === "suspended") await audioCtx.resume();

        const dest = audioCtx.createMediaStreamDestination();
        audioDestStream = dest.stream;

        // Fetch and decode all clips in parallel for speed
        setState({ status: "preparing", progress: 0 });
        const buffers = await Promise.all(
          args.audioQueue.map(async (url) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch audio: ${url}`);
            const arrayBuffer = await res.arrayBuffer();
            return audioCtx!.decodeAudioData(arrayBuffer);
          }),
        );

        // Schedule all clips sequentially with no gap
        let scheduleAt = audioCtx.currentTime + 0.05;
        for (const buffer of buffers) {
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(dest);
          source.start(scheduleAt);
          scheduleAt += buffer.duration;
          totalAudioDuration += buffer.duration;
        }
      }

      // ── Combine canvas + audio streams ────────────────────────────────
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioDestStream ? audioDestStream.getAudioTracks() : []),
      ]);

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
        audioBitsPerSecond: 192_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const stopped = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      // Use whichever is longer: caller's estimate or actual audio duration
      const effectiveDuration = Math.max(
        args.durationSeconds,
        totalAudioDuration,
        0.1,
      );
      const totalMs = effectiveDuration * 1000;

      // Start recorder BEFORE audio begins playing (AudioContext schedules
      // clips relative to currentTime, which is already ticking)
      recorder.start(250);
      setState({ status: "recording", progress: 0 });

      const startTime = performance.now();

      // ── Render loop ───────────────────────────────────────────────────
      await new Promise<void>((resolve) => {
        function tick() {
          if (cancelRef.current) {
            resolve();
            return;
          }

          const elapsed = performance.now() - startTime;
          const currentTime = elapsed / 1000;

          drawFrame({
            ctx: ctx!,
            width: canvas.width,
            height: canvas.height,
            background: args.background,
            bgMediaEl,
            captionStyle: args.captionStyle,
            timings: args.timings,
            currentTime,
          });

          setState({
            status: "recording",
            progress: Math.min(100, Math.round((elapsed / totalMs) * 100)),
          });

          if (elapsed >= totalMs) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        }
        tick();
      });

      // Flush final chunk before stopping
      await new Promise((r) => setTimeout(r, 300));

      recorder.stop();
      if (bgMediaEl instanceof HTMLVideoElement) bgMediaEl.pause();
      await audioCtx?.close();

      const blob = await stopped;
      if (blob.size === 0)
        throw new Error("Recording produced an empty file — try again");

      const url = URL.createObjectURL(blob);
      setState({
        status: "done",
        progress: 100,
        downloadUrl: url,
        fileExtension: "webm",
      });
      return url;
    } catch (err) {
      setState({
        status: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Export failed",
      });
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);
  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0 });
  }, []);

  return { state, exportVideo, cancel, reset };
}
