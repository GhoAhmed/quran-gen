"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useStudioStore } from "../../lib/store/studio-store";
import { ASPECT_RATIOS } from "../../constants";
import { drawFrame } from "../../lib/utils/canvas-renderer";
import { useEstimatedTimings } from "../../lib/utils/timing";
import { useReciterTrack, useQueuedAudioPlayer } from "../../lib/utils/use-reciter-track";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

export function PreviewCanvas() {
    const { verses, background, audio, captionStyle, aspectRatio } = useStudioStore();
    const studioVerses = useStudioStore((s) => s.verses);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);
    const bgVideoRef = useRef<HTMLVideoElement | null>(null);

    const ratio = ASPECT_RATIOS.find((r) => r.id === aspectRatio)!;

    // ── Reciter track: per-ayah clips + exact timings ──────────────────────
    const reciterTrack = useReciterTrack(studioVerses, audio.reciter ?? null);

    // ── Queued audio player drives both playback and currentTime ───────────
    const player = useQueuedAudioPlayer(reciterTrack.clipUrls);

    // ── Estimated timings used only when no reciter is selected ───────────
    const estimatedTimings = useEstimatedTimings(studioVerses, 30);

    // Use exact timings when available, fall back to estimated
    const timings = reciterTrack.timings.length ? reciterTrack.timings : estimatedTimings;
    const currentTime = player.globalTime;

    // ── Custom upload fallback (single file, no per-ayah) ─────────────────
    const isCustomUpload = !audio.reciter && !!audio.customAudioUrl;
    const customAudioRef = useRef<HTMLAudioElement | null>(null);
    const [customTime, setCustomTime] = useState(0);
    const [customDuration, setCustomDuration] = useState(0);
    const estimatedTimingsForCustom = useEstimatedTimings(studioVerses, customDuration || 30);

    // Final resolved values depending on audio mode
    const activeTimings = audio.reciter
        ? timings
        : isCustomUpload
            ? estimatedTimingsForCustom
            : estimatedTimings;

    const activeCurrentTime = audio.reciter
        ? currentTime
        : isCustomUpload
            ? customTime
            : 0;

    // ── Preload background media ───────────────────────────────────────────
    useEffect(() => {
        if (background.type === "image" && background.url) {
            const img = new Image();
            img.src = background.url;
            bgImageRef.current = img;
        } else {
            bgImageRef.current = null;
        }
        if (background.type === "video" && background.url) {
            const vid = document.createElement("video");
            vid.src = background.url;
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;
            bgVideoRef.current = vid;
        } else {
            bgVideoRef.current = null;
        }
    }, [background.type, background.url]);

    // ── Render loop ────────────────────────────────────────────────────────
    useEffect(() => {
        let raf: number;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = ratio.width;
        canvas.height = ratio.height;

        function render() {
            const mediaEl =
                background.type === "image"
                    ? bgImageRef.current
                    : background.type === "video"
                        ? bgVideoRef.current
                        : null;

            drawFrame({
                ctx: ctx!,
                width: canvas!.width,
                height: canvas!.height,
                background,
                bgMediaEl: mediaEl,
                captionStyle,
                timings: activeTimings,
                currentTime: activeCurrentTime,
            });
            raf = requestAnimationFrame(render);
        }
        render();
        return () => cancelAnimationFrame(raf);
    }, [background, captionStyle, activeTimings, activeCurrentTime, ratio]);

    // ── Play / pause ───────────────────────────────────────────────────────
    function togglePlay() {
        if (audio.reciter) {
            // Queued player handles per-ayah clips
            if (player.isPlaying) {
                player.pause();
                bgVideoRef.current?.pause();
            } else {
                player.play();
                bgVideoRef.current?.play();
            }
            return;
        }

        // Custom upload fallback
        const el = customAudioRef.current;
        if (el) {
            if (el.paused) {
                el.play();
                bgVideoRef.current?.play();
            } else {
                el.pause();
                bgVideoRef.current?.pause();
            }
        }
    }

    // eslint-disable-next-line react-hooks/refs
    const isPlaying = audio.reciter ? player.isPlaying : !(customAudioRef.current?.paused ?? true);
    const hasAudio = !!audio.reciter || isCustomUpload;

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl"
                style={{
                    aspectRatio: `${ratio.width} / ${ratio.height}`,
                    maxHeight: "70vh",
                    width: ratio.id === "16:9" ? "min(100%, 640px)" : "min(100%, 380px)",
                }}
            >
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* Custom upload audio element */}
            {isCustomUpload && audio.customAudioUrl && (
                <audio
                    ref={customAudioRef}
                    src={audio.customAudioUrl}
                    onLoadedMetadata={(e) => setCustomDuration(e.currentTarget.duration)}
                    onTimeUpdate={(e) => setCustomTime(e.currentTarget.currentTime)}
                    className="hidden"
                />
            )}

            <div className="flex items-center gap-3">
                {reciterTrack.loading && (
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" /> Loading audio…
                    </p>
                )}

                {reciterTrack.error && (
                    <p className="text-xs text-red-400">{reciterTrack.error}</p>
                )}

                {!reciterTrack.loading && (
                    <Button size="sm" variant="secondary" onClick={togglePlay} disabled={!hasAudio}>
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                        {isPlaying ? "Pause" : "Preview"}
                    </Button>
                )}

                {!hasAudio && (
                    <p className="text-xs text-gray-500">Select a reciter to preview</p>
                )}
            </div>
        </div>
    );
}