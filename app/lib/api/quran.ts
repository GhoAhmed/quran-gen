import type {
  Ayah,
  AyahWithTranslation,
  Reciter,
  Surah,
} from "../../constants/quran";

const BASE_URL = "https://api.alquran.cloud/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  const json = await res.json();
  if (json.code !== 200) {
    throw new Error(json.status ?? "Unknown API error");
  }
  return json.data as T;
}

/** Curated list of well-known reciter editions available on alquran.cloud */
export const RECITERS: Reciter[] = [
  {
    identifier: "ar.alafasy",
    name: "مشاري العفاسي",
    englishName: "Mishary Rashid Alafasy",
    language: "ar",
  },
  {
    identifier: "ar.husary",
    name: "محمود خليل الحصري",
    englishName: "Mahmoud Khalil Al-Husary",
    language: "ar",
  },
  {
    identifier: "ar.minshawi",
    name: "محمد صديق المنشاوي",
    englishName: "Mohamed Siddiq El-Minshawi",
    language: "ar",
  },
  {
    identifier: "ar.abdulbasitmurattal",
    name: "عبد الباسط عبد الصمد",
    englishName: "Abdul Basit (Murattal)",
    language: "ar",
  },
  {
    identifier: "ar.shaatree",
    name: "أبو بكر الشاطري",
    englishName: "Abu Bakr Al-Shatri",
    language: "ar",
  },
  {
    identifier: "ar.ahmedajamy",
    name: "أحمد العجمي",
    englishName: "Ahmed Al-Ajmy",
    language: "ar",
  },
  {
    identifier: "ar.hanirifai",
    name: "هاني الرفاعي",
    englishName: "Hani Ar-Rifai",
    language: "ar",
  },
];

export async function getSurahs(): Promise<Surah[]> {
  return fetchJson<Surah[]>(`${BASE_URL}/surah`);
}

export async function getSurah(
  number: number,
): Promise<Surah & { ayahs: Ayah[] }> {
  return fetchJson(`${BASE_URL}/surah/${number}`);
}

/** Fetch ayahs for a surah with Arabic text + an English translation, merged. */
export async function getSurahWithTranslation(
  number: number,
): Promise<{ surah: Surah; ayahs: AyahWithTranslation[] }> {
  const [arabic, translation] = await Promise.all([
    fetchJson<Surah & { ayahs: Ayah[] }>(`${BASE_URL}/surah/${number}`),
    fetchJson<Surah & { ayahs: Ayah[] }>(
      `${BASE_URL}/surah/${number}/en.sahih`,
    ),
  ]);

  const ayahs: AyahWithTranslation[] = arabic.ayahs.map((a, i) => ({
    ...a,
    translation: translation.ayahs[i]?.text,
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ayahs: _omit, ...surahMeta } = arabic;
  return { surah: surahMeta, ayahs };
}

/** Fetch ayahs for a surah recited by a given edition, including per-ayah audio URLs. */
export async function getSurahAudio(
  number: number,
  reciterId: string,
): Promise<Ayah[]> {
  const data = await fetchJson<Surah & { ayahs: Ayah[] }>(
    `${BASE_URL}/surah/${number}/${reciterId}`,
  );
  return data.ayahs;
}
