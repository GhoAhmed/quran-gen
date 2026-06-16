"use client";

import { useRef } from "react";
import { Image as ImageIcon, Video, Palette } from "lucide-react";
import { useStudioStore } from "../../lib/store/studio-store";
import { cn } from "../../lib/utils/cn";

const PRESET_COLORS = ["#0b1320", "#022c22", "#1e1b4b", "#3b0764", "#1c1917", "#0c4a6e"];

export function BackgroundPanel() {
    const background = useStudioStore((s) => s.background);
    const setBackground = useStudioStore((s) => s.setBackground);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    function handleFile(type: "image" | "video", e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setBackground({ type, url, fileName: file.name });
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Palette className="size-4 text-emerald-400" /> Background
            </h3>

            <div className="flex gap-2">
                <button
                    onClick={() => setBackground({ type: "color" })}
                    className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        background.type === "color"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/[0.03] border border-white/10 text-gray-300 hover:bg-white/[0.06]"
                    )}
                >
                    Color
                </button>
                <button
                    onClick={() => imageInputRef.current?.click()}
                    className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                        background.type === "image"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/[0.03] border border-white/10 text-gray-300 hover:bg-white/[0.06]"
                    )}
                >
                    <ImageIcon className="size-3.5" /> Image
                </button>
                <button
                    onClick={() => videoInputRef.current?.click()}
                    className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                        background.type === "video"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/[0.03] border border-white/10 text-gray-300 hover:bg-white/[0.06]"
                    )}
                >
                    <Video className="size-3.5" /> Video
                </button>
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile("image", e)}
                />
                <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFile("video", e)}
                />
            </div>

            {background.type === "color" && (
                <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => setBackground({ color: c })}
                            style={{ backgroundColor: c }}
                            className={cn(
                                "size-8 rounded-full border-2 transition-transform",
                                background.color === c
                                    ? "border-emerald-400 scale-110"
                                    : "border-white/20"
                            )}
                        />
                    ))}
                    <input
                        type="color"
                        value={background.color}
                        onChange={(e) => setBackground({ color: e.target.value })}
                        className="size-8 rounded-full overflow-hidden cursor-pointer bg-transparent border-2 border-white/20"
                    />
                </div>
            )}

            {(background.type === "image" || background.type === "video") &&
                background.fileName && (
                    <p className="text-xs text-gray-500 truncate">
                        {background.fileName}
                    </p>
                )}
        </div>
    );
}