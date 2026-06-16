"use client";

import { RectangleHorizontal, RectangleVertical, Square } from "lucide-react";
import { ASPECT_RATIOS } from "../../constants";
import { useStudioStore } from "../../lib/store/studio-store";
import { cn } from "../../lib/utils/cn";

const ICONS = {
    "9:16": RectangleVertical,
    "16:9": RectangleHorizontal,
    "1:1": Square,
};

export function AspectRatioPanel() {
    const aspectRatio = useStudioStore((s) => s.aspectRatio);
    const setAspectRatio = useStudioStore((s) => s.setAspectRatio);

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-200">Aspect ratio</h3>
            <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((opt) => {
                    const Icon = ICONS[opt.id];
                    return (
                        <button
                            key={opt.id}
                            onClick={() => setAspectRatio(opt.id)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-xs transition-colors",
                                aspectRatio === opt.id
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                                    : "bg-white/[0.03] border border-white/10 text-gray-300 hover:bg-white/[0.06]"
                            )}
                        >
                            <Icon className="size-4" />
                            {opt.id}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}