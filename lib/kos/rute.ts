import type { Json } from "@/lib/supabase/types";

// kos_sekitar.rute — the wayfinding data behind the minimap. Documented in
// prompts/06. Older seeds stored a plain string[]; bacaRute accepts both.

export type IkonLandmark = "stasiun" | "kampus" | "masjid" | "pasar" | "halte" | "umum";
export type IkonLangkah = "lurus" | "belok-kiri" | "belok-kanan" | "seberang" | "gang" | "tujuan";

export type Langkah = { teks: string; ikon: IkonLangkah; foto_id?: string };
export type Rute = {
  landmark: { nama: string; ikon: IkonLandmark };
  langkah: Langkah[];
  total_menit: number | null;
  akses: "motor" | "mobil" | "jalan_kaki" | null;
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
      return item;
    })
    .filter((l): l is Langkah => l !== null);
  if (langkah.length === 0) return null;

  const lm = o.landmark && typeof o.landmark === "object" && !Array.isArray(o.landmark) ? (o.landmark as Record<string, Json | undefined>) : null;
  const ikon = typeof lm?.ikon === "string" && IKON_LANDMARK.includes(lm.ikon as IkonLandmark) ? (lm.ikon as IkonLandmark) : "umum";
  const akses = o.akses === "motor" || o.akses === "mobil" || o.akses === "jalan_kaki" ? o.akses : (cadangan.akses ?? null);
  return {
    landmark: { nama: typeof lm?.nama === "string" ? lm.nama : landmarkDefault.nama, ikon },
    langkah,
    total_menit: typeof o.total_menit === "number" ? o.total_menit : (cadangan.totalMenit ?? null),
    akses,
  };
}

/** One sentence a screen reader can read end to end. */
export function teksRute(rute: Rute): string {
  const waktu = rute.total_menit != null ? `, ${rute.total_menit} menit jalan kaki` : "";
  const langkah = rute.langkah.map((l, i) => `${i + 1}. ${l.teks}`).join("; ");
  return `Rute dari ${rute.landmark.nama}${waktu}: ${langkah}.`;
}
