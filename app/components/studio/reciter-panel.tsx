"use client";

import { RECITERS } from "../../lib/api/quran";
import { useStudioStore } from "../../lib/store/studio-store";
import { cn } from "../../lib/utils/cn";
import { Mic, Upload } from "lucide-react";
import { useRef } from "react";

export function ReciterPanel() {
    const audio = useStudioStore((s) => s.audio);
    const setAudio = useStudioStore((s) => s.setAudio);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            {audio.customAudioUrl && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-center justify-between">
                    <span className="truncate">{audio.customAudioName}</span>
                    <button
                        onClick={() => setAudio({ customAudioUrl: undefined, customAudioName: undefined })}
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
                        onClick={() => setAudio({ reciter: r, customAudioUrl: undefined, customAudioName: undefined })}
                        className={cn(
                            "text-left rounded-lg px-3 py-2 text-sm transition-colors",
                            audio.reciter?.identifier === r.identifier
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                                : "bg-white/[0.03] border border-white/10 text-gray-300 hover:bg-white/[0.06]"
                        )}
                    >
                        {r.englishName}
                    </button>
                ))}
            </div>
        </div>
    );
}