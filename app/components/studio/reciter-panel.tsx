"use client";

import { useRef, useState } from "react";
import { Mic, Upload, Loader2 } from "lucide-react";
import { RECITERS, getReciterAudioForVerses } from "../../lib/api/quran";
import { useStudioStore } from "../../lib/store/studio-store";
import { useSelectionStore } from "../../lib/store/selection-store";
import { cn } from "../../lib/utils/cn";

export function ReciterPanel() {
    const audio = useStudioStore((s) => s.audio);
    const setAudio = useStudioStore((s) => s.setAudio);
    const surah = useSelectionStore((s) => s.surah);
    const verses = useSelectionStore((s) => s.verses);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    function handleCustomAudio(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setAudio({
            reciter: null,
            customAudioUrl: url,
            customAudioName: file.name,
        });
    }

    async function handleSelectReciter(r: typeof RECITERS[number]) {
        if (!surah) { setFetchError("No surah selected."); return; }
        if (!verses.length) { setFetchError("No verses selected."); return; }

        setLoadingId(r.identifier);
        setFetchError(null);

        try {
            // Fetch only the selected verses' clips — no bleed from surrounding ayahs
            const numbers = verses.map((v) => v.numberInSurah);
            const clips = await getReciterAudioForVerses(
                surah.number,
                r.identifier,
                numbers,
            );

            if (!clips.length) throw new Error("No audio returned for this reciter");

            // Store the first clip URL as customAudioUrl so PreviewCanvas
            // can show the "audio loaded" indicator, and store the reciter.
            // The actual queue is rebuilt from the reciter in PreviewCanvas/ExportPanel.
            setAudio({
                reciter: r,
                customAudioUrl: clips[0].audio,
                customAudioName: `${surah.englishName} — ${r.englishName}`,
            });
        } catch (err) {
            setFetchError(err instanceof Error ? err.message : "Failed to load audio");
        }

        setLoadingId(null);
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Mic className="size-4 text-emerald-400" /> Reciter
                </h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1 text-gray-400 hover:text-white"
                >
                    <Upload className="size-3.5" /> Upload audio
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleCustomAudio}
                />
            </div>

            {!surah && (
                <p className="text-xs text-amber-400">Select a surah first to load reciter audio.</p>
            )}

            {fetchError && (
                <p className="text-xs text-red-400">{fetchError}</p>
            )}

            {audio.customAudioUrl && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-center justify-between">
                    <span className="truncate">{audio.customAudioName}</span>
                    <button
                        onClick={() => setAudio({ customAudioUrl: undefined, customAudioName: undefined, reciter: null })}
                        className="text-emerald-400 hover:text-emerald-200 shrink-0 ml-2"
                    >
                        Remove
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {RECITERS.map((r) => (
                    <button
                        key={r.identifier}
                        onClick={() => handleSelectReciter(r)}
                        disabled={loadingId === r.identifier}
                        className={cn(
                            "text-left rounded-lg px-3 py-2 text-sm transition-colors flex items-center justify-between",
                            audio.reciter?.identifier === r.identifier
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                                : "bg-white/[0.03] border border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        )}
                    >
                        <span>{r.englishName}</span>
                        {loadingId === r.identifier && (
                            <Loader2 className="size-3.5 animate-spin shrink-0" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}