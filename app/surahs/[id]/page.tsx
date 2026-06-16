"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getSurahWithTranslation } from "../../lib/api/quran";
import type { AyahWithTranslation, Surah } from "../../constants/quran";
import { VerseRow } from "../../components/picker/verse-row";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { useSelectionStore } from "../../lib/store/selection-store";
import Link from "next/link";

export default function SurahDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const surahNumber = Number(params.id);

    const [surah, setSurah] = useState<Surah | null>(null);
    const [ayahs, setAyahs] = useState<AyahWithTranslation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const setSurahSel = useSelectionStore((s) => s.setSurah);
    const setVersesSel = useSelectionStore((s) => s.setVerses);

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        getSurahWithTranslation(surahNumber)
            .then(({ surah, ayahs }) => {
                if (!active) return;
                setSurah(surah);
                setAyahs(ayahs);
            })
            .catch((err) => active && setError(err.message))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [surahNumber]);

    function toggle(numberInSurah: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(numberInSurah)) next.delete(numberInSurah);
            else next.add(numberInSurah);
            return next;
        });
    }

    function selectAll() {
        setSelected(new Set(ayahs.map((a) => a.numberInSurah)));
    }

    function clearAll() {
        setSelected(new Set());
    }

    const selectedCount = selected.size;

    const handleContinue = useMemo(
        () => () => {
            if (!surah) return;
            const chosen = ayahs
                .filter((a) => selected.has(a.numberInSurah))
                .sort((a, b) => a.numberInSurah - b.numberInSurah)
                .map((a) => ({
                    ...a,
                    surahNumber: surah.number,
                    surahName: surah.englishName,
                }));
            setSurahSel(surah);
            setVersesSel(chosen);
            router.push("/studio");
        },
        [surah, ayahs, selected, setSurahSel, setVersesSel, router]
    );

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 pb-28">
            <Link
                href="/surahs"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
            >
                <ArrowLeft className="size-4" /> Back to surahs
            </Link>

            {loading && (
                <div className="mt-16 flex justify-center text-gray-400">
                    <Spinner className="size-6" />
                </div>
            )}

            {error && (
                <p className="mt-10 text-center text-red-400 text-sm">{error}</p>
            )}

            {surah && !loading && (
                <>
                    <div className="mt-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{surah.englishName}</h1>
                            <p className="text-gray-400 text-sm mt-1">
                                {surah.englishNameTranslation} · {surah.numberOfAyahs} verses
                            </p>
                        </div>
                        <p className="font-arabic text-3xl text-gray-200">{surah.name}</p>
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-sm">
                        <button
                            onClick={selectAll}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                        >
                            Select all
                        </button>
                        <button
                            onClick={clearAll}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                        >
                            Clear
                        </button>
                        <span className="ml-auto text-gray-500">
                            {selectedCount} selected
                        </span>
                    </div>

                    <div className="mt-4 space-y-2">
                        {ayahs.map((ayah) => (
                            <VerseRow
                                key={ayah.number}
                                ayah={ayah}
                                selected={selected.has(ayah.numberInSurah)}
                                onToggle={toggle}
                            />
                        ))}
                    </div>
                </>
            )}

            {selectedCount > 0 && (
                <div className="fixed bottom-0 inset-x-0 border-t border-white/10 bg-[#0a0f1c]/95 backdrop-blur">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            {selectedCount} verse{selectedCount > 1 ? "s" : ""} selected
                        </p>
                        <Button onClick={handleContinue}>
                            Continue to studio <ArrowRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}