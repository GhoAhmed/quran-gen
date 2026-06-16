"use client";

import { Captions } from "lucide-react";
import { useStudioStore } from "../../lib/store/studio-store";
import { CAPTION_COLORS, FONT_OPTIONS } from "../../constants";
import { cn } from "../../lib/utils/cn";

export function CaptionPanel() {
    const captionStyle = useStudioStore((s) => s.captionStyle);
    const setCaptionStyle = useStudioStore((s) => s.setCaptionStyle);

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Captions className="size-4 text-emerald-400" /> Captions
            </h3>

            <div>
                <label className="text-xs text-gray-400">Font</label>
                <select
                    value={captionStyle.fontFamily}
                    onChange={(e) => setCaptionStyle({ fontFamily: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                >
                    {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-400">
                    Arabic size: {captionStyle.fontSize}px
                </label>
                <input
                    type="range"
                    min={32}
                    max={80}
                    value={captionStyle.fontSize}
                    onChange={(e) => setCaptionStyle({ fontSize: Number(e.target.value) })}
                    className="w-full mt-1"
                />
            </div>

            <div>
                <label className="text-xs text-gray-400">Text color</label>
                <div className="flex gap-2 mt-1.5">
                    {CAPTION_COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCaptionStyle({ textColor: c })}
                            style={{ backgroundColor: c }}
                            className={cn(
                                "size-7 rounded-full border-2",
                                captionStyle.textColor === c
                                    ? "border-emerald-400 scale-110"
                                    : "border-white/20"
                            )}
                        />
                    ))}
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-400">Highlight color</label>
                <div className="flex gap-2 mt-1.5">
                    {CAPTION_COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCaptionStyle({ highlightColor: c })}
                            style={{ backgroundColor: c }}
                            className={cn(
                                "size-7 rounded-full border-2",
                                captionStyle.highlightColor === c
                                    ? "border-emerald-400 scale-110"
                                    : "border-white/20"
                            )}
                        />
                    ))}
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-400">Position</label>
                <div className="flex gap-2 mt-1.5">
                    {(["top", "center", "bottom"] as const).map((pos) => (
                        <button
                            key={pos}
                            onClick={() => setCaptionStyle({ position: pos })}
                            className={cn(
                                "flex-1 rounded-lg px-2 py-1.5 text-xs capitalize",
                                captionStyle.position === pos
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                                    : "bg-white/[0.03] border border-white/10 text-gray-300"
                            )}
                        >
                            {pos}
                        </button>
                    ))}
                </div>
            </div>

            <label className="flex items-center justify-between text-xs text-gray-400 pt-1">
                Show translation
                <input
                    type="checkbox"
                    checked={captionStyle.showTranslation}
                    onChange={(e) => setCaptionStyle({ showTranslation: e.target.checked })}
                    className="size-4 accent-emerald-500"
                />
            </label>
        </div>
    );
}