"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Download, Film } from "lucide-react";
import { useStudioStore } from "../../lib/store/studio-store";
import { useEstimatedTimings } from "../../lib/utils/timing";
import { useVideoExport } from "../../lib/utils/use-video-export";
import { Button } from "../../components/ui/button";

export function ExportPanel() {
    const { verses, background, audio, captionStyle, aspectRatio } =
        useStudioStore();
    const { state, exportVideo, reset } = useVideoExport();
    const [durationInput, setDurationInput] = useState(30);

    const timings = useEstimatedTimings(verses, durationInput);
    const audioUrl = audio.customAudioUrl ?? null;

    const canExport = verses.length > 0;

    const isBusy = state.status === "preparing" || state.status === "recording";

    async function handleExport() {
        await exportVideo({
            aspectRatio,
            background,
            captionStyle,
            timings,
            audioUrl,
            durationSeconds: audioUrl ? durationInput : Math.max(durationInput, verses.length * 6),
        });
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Film className="size-4 text-emerald-400" /> Export
            </h3>

            {!audioUrl && (
                <div>
                    <label className="text-xs text-gray-400">
                        Video duration (no audio uploaded): {durationInput}s
                    </label>
                    <input
                        type="range"
                        min={10}
                        max={120}
                        value={durationInput}
                        onChange={(e) => setDurationInput(Number(e.target.value))}
                        className="w-full mt-1"
                    />
                </div>
            )}

            {!canExport && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="size-3.5" /> Select at least one verse first.
                </p>
            )}

            {state.status === "error" && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="size-3.5" /> {state.error}
                </p>
            )}

            {isBusy && (
                <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${state.progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        Rendering… {state.progress}%
                    </p>
                </div>
            )}

            {state.status === "done" && state.downloadUrl ? (
                <div className="space-y-2">
                    <a
                        href={state.downloadUrl}
                        // eslint-disable-next-line react-hooks/purity
                        download={`quran-studio-${Date.now()}.webm`}
                        className="block"
                    >
                        <Button className="w-full">
                            <Download className="size-4" /> Download video
                        </Button>
                    </a>
                    <button
                        onClick={reset}
                        className="w-full text-xs text-gray-400 hover:text-white"
                    >
                        Render again
                    </button>
                </div>
            ) : (
                <Button
                    className="w-full"
                    onClick={handleExport}
                    disabled={!canExport || isBusy}
                >
                    {isBusy ? "Rendering…" : "Create video"}
                </Button>
            )}

            <p className="text-[11px] text-gray-500 leading-relaxed">
                Rendering happens entirely in your browser — nothing is uploaded.
                Exports as WebM (H.264 MP4 used automatically where supported).
            </p>
        </div>
    );
}