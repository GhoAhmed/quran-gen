"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Upload, Loader2 } from "lucide-react";
import { RECITERS, getSurahAudio } from "../../lib/api/quran";
import { useStudioStore } from "../../lib/store/studio-store";
import { useSelectionStore } from "../../lib/store/selection-store";
import { cn } from "../../lib/utils/cn";

export function ReciterPanel() {
    const audio = useStudioStore((s) => s.audio);
    const setAudio = useStudioStore((s) => s.setAudio);
    const surah = useSelectionStore((s) => s.surah);       // need to know which surah
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

        setLoadingId(r.identifier);
        setFetchError(null);

        try {
            const cdnUrl = `https://cdn.islamic.network/quran/audio-surah/128/${r.identifier}/${surah.number}.mp3`;

            // Fetch per-ayah audio to get individual durations for seeking
            const ayahs = await getSurahAudio(surah.number, r.identifier);

            // Calculate start time by summing durations of ayahs before our selection
            const firstSelectedNumber = verses.length > 0
                ? Math.min(...verses.map(v => v.numberInSurah))
                : 1;

            // Each ayah audio URL looks like: .../001.mp3 — fetch HEAD to get duration
            // Simpler: use ayah index * average duration as approximation,
            // OR fetch each ayah's audio and measure. Best: use the per-ayah mp3 durations.
            let startTime = 0;
            for (const ayah of ayahs) {
                if (ayah.numberInSurah >= firstSelectedNumber) break;
                const dur = await getAudioDuration(ayah.audio!);
                startTime += dur;
            }

            setAudio({
                reciter: r,
                customAudioUrl: cdnUrl,
                customAudioName: `${surah.englishName} — ${r.englishName}`,
                audioStartTime: startTime,
            });
        } catch (err) {
            setFetchError(err instanceof Error ? err.message : "Failed to load audio");
        }

        setLoadingId(null);
    }

    async function getAudioDuration(url: string): Promise<number> {
        return new Promise((res) => {
            const a = new Audio();
            a.addEventListener("loadedmetadata", () => res(a.duration), { once: true });
            a.addEventListener("error", () => res(4), { once: true }); // fallback ~4s
            a.src = url;
            a.load();
        });
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
                <p className="text-xs text-amber-400">
                    Select a surah first to load reciter audio.
                </p>
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