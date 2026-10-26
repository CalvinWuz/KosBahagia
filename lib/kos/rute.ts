import type { Json } from "@/lib/supabase/types";

// kos_sekitar.rute — the wayfinding data behind the minimap. Documented in
// prompts/06. Older seeds stored a plain string[]; bacaRute accepts both.

export type IkonLandmark = "stasiun" | "kampus" | "masjid" | "pasar" | "halte" | "umum";
export type IkonLangkah = "lurus" | "belok-kiri" | "belok-kanan" | "seberang" | "gang" | "tujuan";

/** `titik`: index into the street route (jalur.titik) where the step happens. */
export type Langkah = { teks: string; ikon: IkonLangkah; foto_id?: string; titik?: number };
/**
 * The route along real streets, when the surveyor recorded it: [lng, lat]
 * points from the landmark to the gate, its length, travel times, and which
 * stretch is which street (index ranges into `titik`).
 */
export type Jalur = {
  titik: Array<[number, number]>;
  jarak_m: number | null;
  menit: { jalan_kaki?: number; motor?: number; mobil?: number };
  jalan: Array<{ nama: string; dari: number; ke: number }>;
};
export type Rute = {
  landmark: { nama: string; ikon: IkonLandmark };
  langkah: Langkah[];
  total_menit: number | null;
  akses: "motor" | "mobil" | "jalan_kaki" | null;
  jalur?: Jalur;
};

const IKON_LANDMARK: IkonLandmark[] = ["stasiun", "kampus", "masjid", "pasar", "halte", "umum"];
const IKON_LANGKAH: IkonLangkah[] = ["lurus", "belok-kiri", "belok-kanan", "seberang", "gang", "tujuan"];

function ikonLangkah(v: unknown, terakhir: boolean): IkonLangkah {
  if (typeof v === "string" && IKON_LANGKAH.includes(v as IkonLangkah)) return v as IkonLangkah;
  return terakhir ? "tujuan" : "lurus";
}

/** Normalises the stored JSON into a Rute, or null when there is nothing usable. */
export function bacaRute(
  raw: Json | null | undefined,
  cadangan: { landmarkNama?: string | null; totalMenit?: number | null; akses?: Rute["akses"] } = {},
): Rute | null {
  const landmarkDefault = { nama: cadangan.landmarkNama ?? "Patokan", ikon: "umum" as IkonLandmark };

  if (Array.isArray(raw)) {
    const langkah = raw
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((teks, i, arr) => ({ teks, ikon: ikonLangkah(null, i === arr.length - 1) }));
    return langkah.length ? { landmark: landmarkDefault, langkah, total_menit: cadangan.totalMenit ?? null, akses: cadangan.akses ?? null } : null;
  }

  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, Json | undefined>;
  const langkahRaw = Array.isArray(o.langkah) ? o.langkah : [];
  const langkah: Langkah[] = langkahRaw
    .map((l, i) => {
      if (!l || typeof l !== "object" || Array.isArray(l)) return null;
      const x = l as Record<string, Json | undefined>;
      if (typeof x.teks !== "string" || !x.teks.trim()) return null;
      const item: Langkah = { teks: x.teks, ikon: ikonLangkah(x.ikon, i === langkahRaw.length - 1) };
      if (typeof x.foto_id === "string") item.foto_id = x.foto_id;
      if (typeof x.titik === "number") item.titik = x.titik;
      return item;
    })
    .filter((l): l is Langkah => l !== null);
  if (langkah.length === 0) return null;

  const lm = o.landmark && typeof o.landmark === "object" && !Array.isArray(o.landmark) ? (o.landmark as Record<string, Json | undefined>) : null;
  const ikon = typeof lm?.ikon === "string" && IKON_LANDMARK.includes(lm.ikon as IkonLandmark) ? (lm.ikon as IkonLandmark) : "umum";
  const akses = o.akses === "motor" || o.akses === "mobil" || o.akses === "jalan_kaki" ? o.akses : (cadangan.akses ?? null);
  const jalur = bacaJalur(o.jalur);
  return {
    landmark: { nama: typeof lm?.nama === "string" ? lm.nama : landmarkDefault.nama, ikon },
    // A step whose point is not on the street route loses its place, not its text.
    langkah: langkah.map((l) => (l.titik == null || (jalur && l.titik >= 0 && l.titik < jalur.titik.length) ? l : { teks: l.teks, ikon: l.ikon, ...(l.foto_id ? { foto_id: l.foto_id } : {}) })),
    total_menit: typeof o.total_menit === "number" ? o.total_menit : (cadangan.totalMenit ?? null),
    akses,
    ...(jalur ? { jalur } : {}),
  };
}

const angka = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** The street route, or undefined when it is missing or malformed (the drawing then falls back to the illustration). */
function bacaJalur(raw: Json | undefined): Jalur | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, Json | undefined>;
  const titik = (Array.isArray(o.titik) ? o.titik : []).filter(
    (p): p is [number, number] => Array.isArray(p) && p.length === 2 && angka(p[0]) && angka(p[1]),
  );
  if (titik.length < 2) return undefined;
  const m = o.menit && typeof o.menit === "object" && !Array.isArray(o.menit) ? (o.menit as Record<string, Json | undefined>) : {};
  const menit: Jalur["menit"] = {};
  for (const k of ["jalan_kaki", "motor", "mobil"] as const) if (angka(m[k])) menit[k] = m[k];
  const jalan = (Array.isArray(o.jalan) ? o.jalan : [])
    .map((j) => (j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, Json | undefined>) : null))
    .filter((j): j is Record<string, Json | undefined> => j !== null && typeof j.nama === "string" && angka(j.dari) && angka(j.ke))
    .map((j) => ({ nama: j.nama as string, dari: j.dari as number, ke: j.ke as number }))
    .filter((j) => j.dari >= 0 && j.ke < titik.length && j.dari < j.ke);
  return { titik, jarak_m: angka(o.jarak_m) ? o.jarak_m : null, menit, jalan };
}

/** One sentence a screen reader can read end to end. */
export function teksRute(rute: Rute): string {
  const jarak = rute.jalur?.jarak_m != null ? `, ${rute.jalur.jarak_m} m lewat jalan` : "";
  const waktu = `${jarak}${rute.total_menit != null ? `, ${rute.total_menit} menit jalan kaki` : ""}`;
  const langkah = rute.langkah.map((l, i) => `${i + 1}. ${l.teks}`).join("; ");
  return `Rute dari ${rute.landmark.nama}${waktu}: ${langkah}.`;
}
