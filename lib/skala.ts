// Plain-language labels for the survey scales. The numbers stay (they are
// the evidence); the words say what they mean to someone who has never
// seen the rubric. The ONLY source of these words: the card chips, the hero,
// the detail page, the compare table, the filter sheet and
// /cara-kami-menilai all call kataKebersihan / kataKedap, so one listing can
// never be "Sangat bersih" in one place and "Bersih" in another.

export type Tingkat = { min: number; kata: string; keterangan: string };

/** Kebersihan 1–5 (rata-rata kamar mandi, dapur, koridor). */
export const SKALA_KEBERSIHAN: Tingkat[] = [
  { min: 4.5, kata: "Sangat bersih", keterangan: "Tidak ada bau, jamur, atau sampah menumpuk; nat keramik bersih." },
  { min: 4, kata: "Bersih", keterangan: "Terawat; paling banyak satu hal kecil yang perlu dibersihkan." },
  { min: 3, kata: "Cukup", keterangan: "Layak dipakai, tapi ada bagian yang jarang dibersihkan." },
  { min: 0, kata: "Kurang", keterangan: "Bau, jamur, atau sampah terlihat saat kami datang." },
];

/** Kedap suara 1–5 (material tembok + tes desibel). */
export const SKALA_KEDAP: Tingkat[] = [
  { min: 4, kata: "Kedap suara", keterangan: "Saat tes, suara TV kamar sebelah nyaris tidak terdengar." },
  { min: 3, kata: "Cukup kedap", keterangan: "Saat tes, suara kamar sebelah terdengar samar." },
  { min: 0, kata: "Berisik", keterangan: "Saat tes, obrolan kamar sebelah ikut terdengar." },
];

/**
 * Selisih dB antara sunyi dan saat tes suara dari kamar sebelah. Thresholds
 * line up with the kedap rubric so the two words never disagree: kedap 4–5
 * tests below 18 dB, kedap 3 between 18 and 23, kedap 1–2 at 24 or more.
 */
export const SKALA_SELISIH_DB: Tingkat[] = [
  { min: 24, kata: "Tembus jelas", keterangan: "Suara tetangga terdengar seperti di ruangan yang sama." },
  { min: 18, kata: "Terdengar samar", keterangan: "Ada suara, tapi kata-katanya tidak jelas." },
  { min: 0, kata: "Hampir tidak terdengar", keterangan: "Tembok menahan sebagian besar suara." },
];

function cari(skala: Tingkat[], nilai: number | null | undefined): Tingkat | null {
  if (nilai == null || !Number.isFinite(nilai)) return null;
  return skala.find((t) => nilai >= t.min) ?? null;
}

export function kataKebersihan(nilai: number | null | undefined): string | null {
  return cari(SKALA_KEBERSIHAN, nilai)?.kata ?? null;
}
export function kataKedap(nilai: number | null | undefined): string | null {
  return cari(SKALA_KEDAP, nilai)?.kata ?? null;
}
export function kataSelisihDb(selisih: number | null | undefined): string | null {
  return cari(SKALA_SELISIH_DB, selisih)?.kata ?? null;
}

/**
 * What a kedap score means in practice, next to the number: a higher score
 * holds back more sound from the next room. Same thresholds as SKALA_KEDAP.
 */
export function artiKedap(nilai: number | null | undefined): string | null {
  if (nilai == null || !Number.isFinite(nilai)) return null;
  if (nilai >= 4) return "suara kamar sebelah nyaris tidak terdengar";
  if (nilai >= 3) return "suara kamar sebelah terdengar samar";
  return "obrolan kamar sebelah ikut terdengar";
}

/** Filter chips: the thresholds a renter actually picks between. */
export const PILIHAN_KEBERSIHAN = [
  { nilai: 3, label: "Cukup 3+" },
  { nilai: 4, label: "Bersih 4+" },
  { nilai: 4.5, label: "Sangat bersih 4,5+" },
] as const;
export const PILIHAN_KEDAP = [
  { nilai: 3, label: "Cukup kedap 3+" },
  { nilai: 4, label: "Kedap suara 4+" },
] as const;

/** Card chips: the good word from the scale (4+), or "Berisik" when measured low. Null otherwise. */
export function chipKebersihan(nilai: number | null | undefined): string | null {
  return nilai != null && nilai >= 4 ? kataKebersihan(nilai) : null;
}
export function chipKedap(nilai: number | null | undefined): { kata: string; baik: boolean } | null {
  const kata = kataKedap(nilai);
  if (kata === null || nilai == null) return null;
  if (nilai >= 4) return { kata, baik: true };
  if (kata === "Berisik") return { kata, baik: false };
  return null;
}

/** Mean of the measured cleanliness areas (needs two), same rule as kos_skor.kebersihan. */
export function skorKebersihanRata(p: { skor_kamar_mandi: number | null; skor_dapur: number | null; skor_koridor: number | null }): number | null {
  const ada = [p.skor_kamar_mandi, p.skor_dapur, p.skor_koridor].filter((x): x is number => x != null);
  if (ada.length < 2) return null;
  return Math.round((ada.reduce((a, b) => a + b, 0) / ada.length) * 100) / 100;
}
