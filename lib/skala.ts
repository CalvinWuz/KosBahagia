// Plain-language labels for the survey scales. The numbers stay (they are
// the evidence); the words say what they mean to someone who has never
// seen the rubric. One source for the card, the detail page, the filter
// sheet and /cara-kami-menilai.

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
  { min: 4, kata: "Kedap", keterangan: "Suara TV kamar sebelah nyaris tidak terdengar." },
  { min: 3, kata: "Lumayan", keterangan: "Terdengar samar kalau kamar sebelah ramai." },
  { min: 0, kata: "Berisik", keterangan: "Obrolan kamar sebelah ikut terdengar." },
];

/** Selisih dB antara sunyi dan saat tes suara dari kamar sebelah. */
export const SKALA_SELISIH_DB: Tingkat[] = [
  { min: 30, kata: "Tembus jelas", keterangan: "Suara tetangga terdengar seperti di ruangan yang sama." },
  { min: 15, kata: "Terdengar samar", keterangan: "Ada suara, tapi kata-katanya tidak jelas." },
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

/** Filter chips: the thresholds a renter actually picks between. */
export const PILIHAN_KEBERSIHAN = [
  { nilai: 3, label: "Cukup 3+" },
  { nilai: 4, label: "Bersih 4+" },
  { nilai: 4.5, label: "Sangat bersih 4,5+" },
] as const;
export const PILIHAN_KEDAP = [
  { nilai: 3, label: "Lumayan 3+" },
  { nilai: 4, label: "Kedap 4+" },
] as const;

/** Below this the card says so; the red-flag panel is a separate thing. */
export const BATAS_BERISIK = 2.5;
