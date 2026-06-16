import { cn } from "../../lib/utils/cn";
import type { AyahWithTranslation } from "../../constants/quran";

interface VerseRowProps {
    ayah: AyahWithTranslation;
    selected: boolean;
    onToggle: (numberInSurah: number) => void;
}

export function VerseRow({ ayah, selected, onToggle }: VerseRowProps) {
    return (
        <button
            onClick={() => onToggle(ayah.numberInSurah)}
            className={cn(
                "w-full text-left rounded-xl border p-4 transition-colors",
                selected
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        "shrink-0 size-6 rounded-full text-xs flex items-center justify-center font-medium mt-1",
                        selected
                            ? "bg-emerald-500 text-emerald-950"
                            : "bg-white/10 text-gray-300"
                    )}
                >
                    {ayah.numberInSurah}
                </span>
                <div className="flex-1">
                    <p className="font-arabic text-xl leading-relaxed text-right text-gray-100">
                        {ayah.text}
                    </p>
                    {ayah.translation && (
                        <p className="mt-2 text-sm text-gray-400">{ayah.translation}</p>
                    )}
                </div>
            </div>
        </button>
    );
}