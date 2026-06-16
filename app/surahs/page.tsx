"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getSurahs } from "../lib/api/quran";
import type { Surah } from "../constants/quran";
import { SurahCard } from "../components/picker/surah-card";
import { Spinner } from "../components/ui/spinner";

export default function SurahsPage() {
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let active = true;
        getSurahs()
            .then((data) => {
                if (active) setSurahs(data);
            })
            .catch((err) => {
                if (active) setError(err.message ?? "Failed to load surahs");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return surahs;
        return surahs.filter(
            (s) =>
                s.englishName.toLowerCase().includes(q) ||
                s.englishNameTranslation.toLowerCase().includes(q) ||
                String(s.number) === q
        );
    }, [surahs, query]);

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold">Choose a surah</h1>
            <p className="text-gray-400 mt-1">
                Search by name or number, then pick the verses you want to recite.
            </p>

            <div className="mt-6 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search surahs (e.g. Al-Baqarah, 36, Yasin)"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
            </div>

            {loading && (
                <div className="mt-16 flex justify-center text-gray-400">
                    <Spinner className="size-6" />
                </div>
            )}

            {error && (
                <p className="mt-10 text-center text-red-400 text-sm">{error}</p>
            )}

            {!loading && !error && (
                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    {filtered.map((surah) => (
                        <SurahCard key={surah.number} surah={surah} />
                    ))}
                </div>
            )}
        </div>
    );
}