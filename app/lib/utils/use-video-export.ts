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
  audioUrl: string | null;
  durationSeconds: number;
}

function pickMimeType(): string {
  const candidates = [
    "video/mp4;codecs=h264",
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

      // Preload background media
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
        bgMediaEl.play();
      }

      // Set up audio element + Web Audio graph so we can mux it into the recording
      let audioEl: HTMLAudioElement | null = null;
      let audioDestStream: MediaStream | null = null;
      let audioCtx: AudioContext | null = null;

      if (args.audioUrl) {
        audioEl = new Audio(args.audioUrl);
        audioEl.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          audioEl!.onloadedmetadata = () => resolve();
          audioEl!.load();
        });

        audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        // Also connect to speakers is unnecessary for export (avoid echo); skip.
        audioDestStream = dest.stream;
      }

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioDestStream ? audioDestStream.getAudioTracks() : []),
      ]);

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const stopped = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
      });

      setState({ status: "recording", progress: 0 });
      recorder.start();
      audioEl?.play();

      const totalMs = args.durationSeconds * 1000;
      const startTime = performance.now();

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

      recorder.stop();
      audioEl?.pause();
      if (bgMediaEl instanceof HTMLVideoElement) bgMediaEl.pause();
      audioCtx?.close();

      const blob = await stopped;
      const url = URL.createObjectURL(blob);
      setState({ status: "done", progress: 100, downloadUrl: url });
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
