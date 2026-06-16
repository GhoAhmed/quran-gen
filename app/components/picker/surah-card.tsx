import Link from "next/link";
import type { Surah } from "../../constants/quran";

export function SurahCard({ surah }: { surah: Surah }) {
    return (
        <Link
            href={`/surahs/${surah.number}`}
            className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-emerald-500/40 hover:bg-white/[0.06] transition-colors"
        >
            <div className="size-10 shrink-0 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-semibold">
                {surah.number}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                    {surah.englishName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                    {surah.englishNameTranslation} · {surah.numberOfAyahs} verses ·{" "}
                    {surah.revelationType}
                </p>
            </div>
            <p className="font-arabic text-xl text-gray-300 shrink-0">
                {surah.name}
            </p>
        </Link>
    );
}