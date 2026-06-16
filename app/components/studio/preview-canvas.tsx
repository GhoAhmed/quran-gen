"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useStudioStore } from "../../lib/store/studio-store";
import { ASPECT_RATIOS } from "../../constants";
import { drawFrame } from "../../lib/utils/canvas-renderer";
import { useEstimatedTimings } from "../../lib/utils/timing";
import { Button } from "../ui/button";

export function PreviewCanvas() {
    const { verses, background, audio, captionStyle, aspectRatio } =
        useStudioStore();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);
    const bgVideoRef = useRef<HTMLVideoElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const ratio = ASPECT_RATIOS.find((r) => r.id === aspectRatio)!;
    const timings = useEstimatedTimings(verses, duration || 30);

    const audioSrc = audio.customAudioUrl ?? null;

    // Preload background media elements off-DOM
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

    // Render loop
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
                timings,
                currentTime: audioRef.current?.currentTime ?? currentTime,
            });
            raf = requestAnimationFrame(render);
        }
        render();
        return () => cancelAnimationFrame(raf);
    }, [background, captionStyle, timings, ratio, currentTime]);

    function togglePlay() {
        const audioEl = audioRef.current;
        const videoEl = bgVideoRef.current;
        if (!audioEl) {
            setIsPlaying((p) => !p);
            return;
        }
        if (isPlaying) {
            audioEl.pause();
            videoEl?.pause();
        } else {
            audioEl.play();
            videoEl?.play();
        }
        setIsPlaying(!isPlaying);
    }

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

            {audioSrc && (
                <audio
                    ref={audioRef}
                    src={audioSrc}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                />
            )}

            <div className="flex items-center gap-3">
                <Button size="sm" variant="secondary" onClick={togglePlay}>
                    {isPlaying ? (
                        <Pause className="size-4" />
                    ) : (
                        <Play className="size-4" />
                    )}
                    {isPlaying ? "Pause" : "Preview"}
                </Button>
                {!audioSrc && (
                    <p className="text-xs text-gray-500">
                        Upload audio to preview timed captions
                    </p>
                )}
            </div>
        </div>
    );
}