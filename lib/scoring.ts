// Skor Bahagia — CLAUDE.md §6.
//
// Weights: kebersihan 30 · kedap 20 · transparansi 20 · fasilitas 15 ·
// sekitar 15. Each component is on a 1–5 scale (transparansi 0–5) and
// contributes weight × component / 5. The sum is scaled to 0–10 with one
// decimal. Kebersihan or kedap missing → null ("Belum dinilai"). Sekitar
// missing → its weight is dropped, never guessed.
//
// The Postgres view `kos_skor` (supabase/migrations/…_skor_dan_cari.sql)
// implements the same formula for search ranking. Change both or neither.
// `tier` must never influence anything in this file.

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
  /** Rent and real total of the headline (cheapest) room type, in rupiah. */
  harga_bulanan: number;
  total_bulanan: number;
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

/** 5 when the total equals the rent; 0 once hidden costs reach 35 % of the total. */
export function skorTransparansi(
  hargaBulanan: number,
  totalBulanan: number,
): number {
  const tersembunyi = (totalBulanan - hargaBulanan) / totalBulanan;
  return bulat(5 * (1 - Math.min(tersembunyi / 0.35, 1)), 2);
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
    transparansi: skorTransparansi(input.harga_bulanan, input.total_bulanan),
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
