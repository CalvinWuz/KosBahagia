// Skor Bahagia — CLAUDE.md §6.
//
// Weights: kebersihan 30 · kedap 20 · transparansi 20 · fasilitas 15 ·
// sekitar 15. Each component is on a 1–5 scale (transparansi 0–5) and
// contributes weight × component / 5. The sum is scaled to 0–10 with one
// decimal. Kebersihan or kedap missing → null ("Belum dinilai"). Sekitar
// missing → its weight is dropped, never guessed.
//
// Transparansi (since the 2026-10 audit) measures how completely the costs
// are disclosed, not how large the extras are: four checks per room type
// (KRITERIA_TRANSPARANSI), 1,25 points each, averaged over the kos's room
// types. The old "share of the total that is not rent" survives as
// information only (RingkasanBiaya.porsiTambahan / kos_skor.porsi_biaya_tambahan).
//
// The Postgres view `kos_skor` (supabase/migrations/…_biaya_kamar_skor.sql)
// implements the same formula for search ranking. Change both or neither.
// `tier` must never influence anything in this file.

import { hitungBiaya, type KamarBiaya, type TipeKamar } from "./biaya.ts";
import type { Json } from "./supabase/types.ts";

export const BOBOT = {
  kebersihan: 0.3,
  kedap: 0.2,
  transparansi: 0.2,
  fasilitas: 0.15,
  sekitar: 0.15,
} as const;

export type SkorInput = {
  /** Rubric scores 1–5, null when not measured. */
  skor_kamar_mandi: number | null;
  skor_dapur: number | null;
  skor_koridor: number | null;
  skor_kedap: number | null;
  /** Every room type of the kos, for the transparency checks. */
  kamar: KamarTransparansi[];
  /** Clock for the "prices checked in the last 90 days" check. */
  sekarang: Date;
  /** Filterable facilities this kos has. */
  jumlah_fasilitas: number;
  /** Filterable-facility counts of the OTHER live kos in the same Rp250k bucket. */
  fasilitas_sebaya: number[];
  /** null when the kos has no kos_sekitar row. */
  sekitar: {
    landmark_menit_jalan: number | null;
    penerangan: number | null;
    /** How many of minimarket / warung / laundry / transit are recorded (0–4). */
    jumlah_amenitas: number;
  } | null;
};

export type KomponenSkor = {
  kebersihan: number | null;
  kedap: number | null;
  transparansi: number;
  fasilitas: number;
  sekitar: number | null;
};

export type HasilSkor = {
  /** 0–10, one decimal, or null when the rubric is incomplete. */
  skor: number | null;
  komponen: KomponenSkor;
};

function bulat(x: number, desimal: number): number {
  const f = 10 ** desimal;
  return Math.round((x + Number.EPSILON) * f) / f;
}

/** Mean of the three cleanliness scores; needs at least two. */
export function skorKebersihan(
  kamarMandi: number | null,
  dapur: number | null,
  koridor: number | null,
): number | null {
  const ada = [kamarMandi, dapur, koridor].filter(
    (x): x is number => x !== null,
  );
  if (ada.length < 2) return null;
  return bulat(ada.reduce((a, b) => a + b, 0) / ada.length, 2);
}

export type KamarTransparansi = KamarBiaya &
  Pick<TipeKamar, "bayar_dimuka_bulan" | "deposit" | "deposit_kembali" | "ketentuan_deposit" | "biaya_sekali" | "harga_dikonfirmasi_pada">;

export const KRITERIA_TRANSPARANSI = [
  { kunci: "periode", label: "Lama kontrak minimal dan jumlah bulan yang dibayar di muka disebutkan" },
  { kunci: "bulanan", label: "Setiap biaya wajib bulanan punya nominal; listrik berbasis pemakaian punya estimasi" },
  { kunci: "masuk", label: "Ketentuan deposit dan semua biaya sekali bayar jelas" },
  { kunci: "baru", label: "Harga dicek dalam 90 hari terakhir" },
] as const;
export type KunciTransparansi = (typeof KRITERIA_TRANSPARANSI)[number]["kunci"];
export const HARI_HARGA_SEGAR = 90;

function semuaBernominal(json: Json | null | undefined): boolean {
  if (!Array.isArray(json)) return true;
  return json.every((x) => {
    if (!x || typeof x !== "object" || Array.isArray(x)) return true;
    const o = x as Record<string, Json | undefined>;
    return o.wajib === false || typeof o.jumlah === "number";
  });
}

/** Which of the four disclosure checks one room type meets. */
export function cekTransparansi(k: KamarTransparansi, sekarang: Date): Record<KunciTransparansi, boolean> {
  const dicek = k.harga_dikonfirmasi_pada ? new Date(k.harga_dikonfirmasi_pada).getTime() : NaN;
  return {
    periode: k.bayar_dimuka_bulan != null,
    bulanan: hitungBiaya(k).lengkap,
    masuk:
      (k.deposit === 0 || (k.deposit_kembali != null && Boolean(k.ketentuan_deposit?.trim()))) && semuaBernominal(k.biaya_sekali),
    baru: Number.isFinite(dicek) && dicek >= sekarang.getTime() - HARI_HARGA_SEGAR * 86_400_000,
  };
}

/** 0–5: mean over room types of 1,25 × checks met. No room types → 0. */
export function skorTransparansi(kamar: KamarTransparansi[], sekarang: Date): number {
  if (kamar.length === 0) return 0;
  const per = kamar.map((k) => 1.25 * Object.values(cekTransparansi(k, sekarang)).filter(Boolean).length);
  return bulat(per.reduce((a, b) => a + b, 0) / per.length, 2);
}

/**
 * Mid-rank position of this kos's facility count among its price-bucket
 * peers, scaled 0–1 and mapped to 1–5: most facilities in the bucket → 5,
 * fewest → 1, ties share the average rank. Alone in the bucket → 3.
 */
export function skorFasilitas(jumlah: number, sebaya: number[]): number {
  const n = sebaya.length + 1;
  if (n === 1) return 3;
  const lebihSedikit = sebaya.filter((x) => x < jumlah).length;
  const sama = sebaya.filter((x) => x === jumlah).length;
  const posisi = (lebihSedikit + sama / 2) / (n - 1);
  return bulat(1 + 4 * posisi, 2);
}

/** Walking minutes to the landmark → 1–5. */
export function skorJalanKaki(menit: number | null): number | null {
  if (menit === null) return null;
  if (menit <= 5) return 5;
  if (menit <= 10) return 4;
  if (menit <= 15) return 3;
  if (menit <= 20) return 2;
  return 1;
}

/** Mean of walk-time score, penerangan and amenity availability (nulls skipped). */
export function skorSekitar(sekitar: SkorInput["sekitar"]): number | null {
  if (sekitar === null) return null;
  const bagian = [
    skorJalanKaki(sekitar.landmark_menit_jalan),
    sekitar.penerangan,
    1 + Math.min(Math.max(sekitar.jumlah_amenitas, 0), 4),
  ].filter((x): x is number => x !== null);
  if (bagian.length === 0) return null;
  return bulat(bagian.reduce((a, b) => a + b, 0) / bagian.length, 2);
}

export function hitungSkorBahagia(input: SkorInput): HasilSkor {
  const komponen: KomponenSkor = {
    kebersihan: skorKebersihan(
      input.skor_kamar_mandi,
      input.skor_dapur,
      input.skor_koridor,
    ),
    kedap: input.skor_kedap,
    transparansi: skorTransparansi(input.kamar, input.sekarang),
    fasilitas: skorFasilitas(input.jumlah_fasilitas, input.fasilitas_sebaya),
    sekitar: skorSekitar(input.sekitar),
  };

  if (komponen.kebersihan === null || komponen.kedap === null) {
    return { skor: null, komponen };
  }

  let jumlah =
    BOBOT.kebersihan * (komponen.kebersihan / 5) +
    BOBOT.kedap * (komponen.kedap / 5) +
    BOBOT.transparansi * (komponen.transparansi / 5) +
    BOBOT.fasilitas * (komponen.fasilitas / 5);
  let bobot =
    BOBOT.kebersihan + BOBOT.kedap + BOBOT.transparansi + BOBOT.fasilitas;

  if (komponen.sekitar !== null) {
    jumlah += BOBOT.sekitar * (komponen.sekitar / 5);
    bobot += BOBOT.sekitar;
  }

  return { skor: bulat((10 * jumlah) / bobot, 1), komponen };
}
