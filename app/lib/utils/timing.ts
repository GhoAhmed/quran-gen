import { useEffect, useState } from "react";
import type { SelectedVerse } from "../../constants/quran";

export interface VerseTiming {
  verse: SelectedVerse;
  start: number; // seconds from the beginning of the full track
  end: number;
}

/**
 * Builds an estimated timeline for verses when we don't have per-ayah audio
 * boundaries (e.g. a single uploaded audio file covering all verses).
 * Falls back to a proportional split based on Arabic text length, which is a
 * reasonable approximation for caption sync without real timestamps.
 */
export function useEstimatedTimings(
  verses: SelectedVerse[],
  totalDuration: number,
): VerseTiming[] {
  const [timings, setTimings] = useState<VerseTiming[]>([]);

  useEffect(() => {
    if (!verses.length || !totalDuration) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimings([]);
      return;
    }
    const weights = verses.map((v) => Math.max(v.text.length, 10));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let cursor = 0;
    const result: VerseTiming[] = verses.map((verse, i) => {
      const duration = (weights[i] / totalWeight) * totalDuration;
      const start = cursor;
      cursor += duration;
      return { verse, start, end: cursor };
    });
    setTimings(result);
  }, [verses, totalDuration]);

  return timings;
}
