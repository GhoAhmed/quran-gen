import { useEffect, useRef, useState } from "react";
import { getReciterAudioForVerses } from "../api/quran";
import type { Reciter, SelectedVerse } from "../../constants/quran";
import type { VerseTiming } from "./timing";

interface ReciterTrack {
  loading: boolean;
  error: string | null;
  /** Exact timeline built from each clip's real duration, starting at 0 */
  timings: VerseTiming[];
  /** Ordered audio URLs, one per verse, aligned with `timings` */
  clipUrls: string[];
  totalDuration: number;
}

/**
 * Fetches per-ayah audio for the given reciter + EXACTLY the selected
 * verses (no verses before/after bleed in) and probes each clip's real
 * duration to build an exact, non-estimated caption timeline that always
 * starts at t=0 with the first selected verse.
 */
export function useReciterTrack(
  verses: SelectedVerse[],
  reciter: Reciter | null,
): ReciterTrack {
  const [state, setState] = useState<ReciterTrack>({
    loading: false,
    error: null,
    timings: [],
    clipUrls: [],
    totalDuration: 0,
  });

  useEffect(() => {
    if (!reciter || !verses.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        loading: false,
        error: null,
        timings: [],
        clipUrls: [],
        totalDuration: 0,
      });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    async function run() {
      try {
        const surahNumber = verses[0].surahNumber;
        // numbersInSurah is built ONLY from the verses the user actually
        // selected, in the order they appear — this is what guarantees
        // playback/timing starts exactly at the first selected ayah and
        // never includes a preceding one.
        const numbers = verses.map((v) => v.numberInSurah);
        const clips = await getReciterAudioForVerses(
          surahNumber,
          reciter!.identifier,
          numbers,
        );

        // Probe real duration for each clip in parallel
        const durations = await Promise.all(
          clips.map(
            (clip) =>
              new Promise<number>((resolve, reject) => {
                const probe = new Audio();
                probe.preload = "metadata";
                probe.src = clip.audio;
                probe.onloadedmetadata = () => resolve(probe.duration || 3);
                probe.onerror = () =>
                  reject(
                    new Error(
                      `Failed to load audio for verse ${clip.numberInSurah}`,
                    ),
                  );
              }),
          ),
        );

        if (cancelled) return;

        let cursor = 0;
        const timings: VerseTiming[] = verses.map((verse, i) => {
          const duration = durations[i];
          const start = cursor;
          cursor += duration;
          return { verse, start, end: cursor };
        });

        setState({
          loading: false,
          error: null,
          timings,
          clipUrls: clips.map((c) => c.audio),
          totalDuration: cursor,
        });
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : "Failed to load reciter audio",
            timings: [],
            clipUrls: [],
            totalDuration: 0,
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [verses, reciter]);

  return state;
}

interface QueuedAudioPlayer {
  isPlaying: boolean;
  globalTime: number;
  currentClipIndex: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

/**
 * Plays an ordered list of audio clip URLs back-to-back through a single
 * <audio> element, advancing automatically on "ended", and reports a
 * continuous "global" playback time (sum of all previous clip durations +
 * current clip's currentTime). Because this is the SAME clip list used to
 * build the timeline in useReciterTrack, audio and captions can never
 * drift apart — they're driven by the same source of truth.
 */
export function useQueuedAudioPlayer(clipUrls: string[]): QueuedAudioPlayer {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
  const elapsedBeforeRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [globalTime, setGlobalTime] = useState(0);

  // Reset playback state whenever the clip list itself changes (new
  // reciter or new verse selection) so we never resume into a stale queue.
  useEffect(() => {
    const el = audioElRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    indexRef.current = 0;
    elapsedBeforeRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(0);
    setGlobalTime(0);
    setIsPlaying(false);
  }, [clipUrls]);

  useEffect(() => {
    if (!audioElRef.current) {
      audioElRef.current = new Audio();
      audioElRef.current.preload = "auto";
    }
    const el = audioElRef.current;

    function handleEnded() {
      const next = indexRef.current + 1;
      elapsedBeforeRef.current += el.duration || 0;
      if (next < clipUrls.length) {
        indexRef.current = next;
        setIndex(next);
        el.src = clipUrls[next];
        el.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    }

    function handleTimeUpdate() {
      setGlobalTime(elapsedBeforeRef.current + el.currentTime);
    }

    el.addEventListener("ended", handleEnded);
    el.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      el.removeEventListener("ended", handleEnded);
      el.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [clipUrls]);

  function play() {
    const el = audioElRef.current;
    if (!el || !clipUrls.length) return;

    // Starting fresh (idle at the beginning) vs resuming a paused clip.
    if (
      !isPlaying &&
      el.currentTime === 0 &&
      indexRef.current === 0 &&
      !el.src
    ) {
      el.src = clipUrls[0];
    }
    el.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }

  function pause() {
    audioElRef.current?.pause();
    setIsPlaying(false);
  }

  function stop() {
    const el = audioElRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
      el.removeAttribute("src");
    }
    indexRef.current = 0;
    elapsedBeforeRef.current = 0;
    setIndex(0);
    setGlobalTime(0);
    setIsPlaying(false);
  }

  return { isPlaying, globalTime, currentClipIndex: index, play, pause, stop };
}
