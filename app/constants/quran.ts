// Domain types describing Quran data returned by the AlQuran Cloud API
// (https://alquran.cloud/api) and the data structures our app builds on top of it.

export interface Surah {
  number: number;
  name: string; // Arabic name
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

export interface Ayah {
  number: number; // global ayah number across the whole Quran
  numberInSurah: number;
  text: string; // Arabic text
  audio?: string; // per-ayah audio url (when fetched with an edition)
}

export interface AyahWithTranslation extends Ayah {
  translation?: string;
}

export interface Reciter {
  identifier: string; // edition identifier, e.g. "ar.alafasy"
  name: string;
  englishName: string;
  language: string;
}

export interface VerseRange {
  surah: Surah;
  start: number; // numberInSurah
  end: number; // numberInSurah
}

export interface SelectedVerse extends AyahWithTranslation {
  surahNumber: number;
  surahName: string;
}
