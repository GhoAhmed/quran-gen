import Link from "next/link";
import { ListChecks, Pencil } from "lucide-react";
import type { SelectedVerse } from "../../constants/quran";

export function VersesSummary({ verses }: { verses: SelectedVerse[] }) {
    if (!verses.length) {
        return (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                No verses selected yet.{" "}
                <Link href="/surahs" className="underline">
                    Choose a surah
                </Link>{" "}
                to get started.
            </div>
        );
    }

    const first = verses[0];
    const last = verses[verses.length - 1];
    const range =
        first.numberInSurah === last.numberInSurah
            ? `Verse ${first.numberInSurah}`
            : `Verses ${first.numberInSurah}–${last.numberInSurah}`;

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                    <ListChecks className="size-4 text-emerald-400" />
                    {first.surahName} · {range}
                </div>
                <Link
                    href={`/surahs/${first.surahNumber}`}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 shrink-0"
                >
                    <Pencil className="size-3" /> Edit
                </Link>
            </div>
            <p className="mt-2 text-xs text-gray-500">{verses.length} ayah(s) selected</p>
        </div>
    );
}