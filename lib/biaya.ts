// One price model for every screen: card, detail, sidebar, compare, the
// WhatsApp message and the search filter all read a room type through here.
//
// The monthly total is rent plus every mandatory monthly fee whose amount is
// known. It must equal tipe_kamar.total_bulanan (the generated column the
// search sorts and filters on); `npm run cek:skor-db` checks that on the seed.
// An unknown amount is never 0: it makes the total incomplete (`lengkap`
// false) and is listed by name. Usage-based electricity (token, meteran)
// makes the total an estimate (`estimasi` true).

import type { Database, Json } from "./supabase/types.ts";

export type TipeKamar = Database["public"]["Tables"]["tipe_kamar"]["Row"];

/** The fields the price model reads. kos_kartu.kamar and cari_kos_v3.kamar carry all of them. */
export type KamarBiaya = Pick<
  TipeKamar,
  | "harga_bulanan" | "model_listrik" | "estimasi_listrik" | "biaya_air" | "boleh_ac" | "biaya_ac"
  | "biaya_lain" | "parkir_motor" | "biaya_parkir_motor" | "parkir_mobil" | "biaya_parkir_mobil"
  | "laundry" | "biaya_laundry"
>;
export type KamarUangMasuk = KamarBiaya &
  Pick<TipeKamar, "deposit" | "deposit_kembali" | "ketentuan_deposit" | "bayar_dimuka_bulan" | "biaya_sekali" | "durasi_minimal">;

/**
 * sewa       the rent itself
 * tetap      a fixed monthly amount
 * pemakaian  billed by use; the amount is the surveyor's estimate
 * termasuk   included in the rent, no extra charge
 * belum_diketahui  mandatory, amount not known (never counted as 0)
 * opsional   only if you use it; not in the total
 */
export type SifatBiaya = "sewa" | "tetap" | "pemakaian" | "termasuk" | "belum_diketahui" | "opsional";

export type ItemBiaya = {
  nama: string;
  /** Integer rupiah; null when unknown or not applicable (termasuk). */
  jumlah: number | null;
  sifat: SifatBiaya;
  /** Short qualifier, e.g. "per kg", "token, isi sendiri". */
  keterangan?: string;
};

export type RingkasanBiaya = {
  /** Rent first, then every mandatory monthly item, in display order. */
  bulanan: ItemBiaya[];
  /** Spend that depends on the renter (parking, laundry, optional extras). */
  opsional: ItemBiaya[];
  /** Rent + known mandatory amounts. Equals tipe_kamar.total_bulanan. */
  total: number;
  /** Every mandatory amount is known. */
  lengkap: boolean;
  /** The total contains a usage-based estimate. */
  estimasi: boolean;
  /** Names of mandatory items with no known amount. */
  belumDiketahui: string[];
  /** Non-rent share of the known total, 0–1. Information only, not a score. */
  porsiTambahan: number;
};

type BiayaLain = { nama: string; jumlah: number | null; wajib: boolean };

function bacaDaftar(json: Json | null | undefined): BiayaLain[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((x) => {
    if (!x || typeof x !== "object" || Array.isArray(x)) return [];
    const o = x as Record<string, Json | undefined>;
    if (typeof o.nama !== "string") return [];
    const jumlah = typeof o.jumlah === "number" && Number.isFinite(o.jumlah) ? Math.round(o.jumlah) : null;
    return [{ nama: o.nama, jumlah, wajib: o.wajib !== false }];
  });
}

export const LABEL_LISTRIK: Record<string, string> = {
  termasuk: "Termasuk sewa",
  token: "Token, isi sendiri",
  flat: "Tarif tetap per bulan",
  meteran: "Meteran, tagihan sesuai pemakaian",
};

export function hitungBiaya(k: KamarBiaya): RingkasanBiaya {
  const bulanan: ItemBiaya[] = [{ nama: "Sewa kamar", jumlah: k.harga_bulanan, sifat: "sewa" }];

  // Electricity: the model decides what the number means.
  if (k.model_listrik === "termasuk") {
    bulanan.push({ nama: "Listrik", jumlah: null, sifat: "termasuk", keterangan: LABEL_LISTRIK.termasuk });
  } else if (k.estimasi_listrik == null) {
    bulanan.push({ nama: "Listrik", jumlah: null, sifat: "belum_diketahui", keterangan: LABEL_LISTRIK[k.model_listrik] });
  } else {
    bulanan.push({
      nama: "Listrik",
      jumlah: k.estimasi_listrik,
      sifat: k.model_listrik === "flat" ? "tetap" : "pemakaian",
      keterangan: LABEL_LISTRIK[k.model_listrik],
    });
  }

  // Water: an amount means a fixed monthly fee; none means included.
  bulanan.push(
    k.biaya_air ? { nama: "Air", jumlah: k.biaya_air, sifat: "tetap" } : { nama: "Air", jumlah: null, sifat: "termasuk", keterangan: "Termasuk sewa" },
  );

  if (k.boleh_ac) {
    bulanan.push(
      k.biaya_ac ? { nama: "Biaya AC", jumlah: k.biaya_ac, sifat: "tetap" } : { nama: "Biaya AC", jumlah: null, sifat: "termasuk", keterangan: "Tidak ada tambahan" },
    );
  }

  const lain = bacaDaftar(k.biaya_lain);
  for (const b of lain.filter((x) => x.wajib)) {
    bulanan.push(b.jumlah == null ? { nama: b.nama, jumlah: null, sifat: "belum_diketahui" } : { nama: b.nama, jumlah: b.jumlah, sifat: "tetap" });
  }

  const opsional: ItemBiaya[] = [];
  if (k.parkir_motor) opsional.push({ nama: "Parkir motor", jumlah: k.biaya_parkir_motor ?? 0, sifat: "opsional", keterangan: k.biaya_parkir_motor ? "per bulan" : "gratis" });
  if (k.parkir_mobil) opsional.push({ nama: "Parkir mobil", jumlah: k.biaya_parkir_mobil ?? 0, sifat: "opsional", keterangan: k.biaya_parkir_mobil ? "per bulan" : "gratis" });
  if (k.laundry === "berbayar") opsional.push({ nama: "Laundry", jumlah: k.biaya_laundry ?? null, sifat: "opsional", keterangan: "per kg" });
  for (const b of lain.filter((x) => !x.wajib)) opsional.push({ nama: b.nama, jumlah: b.jumlah, sifat: "opsional", keterangan: "per bulan" });

  const total = bulanan.reduce((a, b) => a + (b.sifat === "termasuk" || b.jumlah == null ? 0 : b.jumlah), 0);
  const belumDiketahui = bulanan.filter((b) => b.sifat === "belum_diketahui").map((b) => b.nama);
  return {
    bulanan,
    opsional,
    total,
    lengkap: belumDiketahui.length === 0,
    estimasi: bulanan.some((b) => b.sifat === "pemakaian"),
    belumDiketahui,
    porsiTambahan: total > 0 ? (total - k.harga_bulanan) / total : 0,
  };
}

/** "Total per bulan" / "Estimasi total per bulan" / "Total sementara" — one wording everywhere. */
export function labelTotal(b: Pick<RingkasanBiaya, "lengkap" | "estimasi">): string {
  if (!b.lengkap) return "Total sementara";
  return b.estimasi ? "Estimasi total per bulan" : "Total per bulan";
}

/** Rent + short names of what else is in the total: "listrik (estimasi) + air + sampah". */
export function komponenSingkat(b: RingkasanBiaya): string[] {
  return b.bulanan
    .filter((x) => x.sifat === "tetap" || x.sifat === "pemakaian")
    .map((x) => {
      const asli = x.nama.replace(/^Biaya /, "");
      // Lower-case for running text, but keep acronyms and brand spellings.
      const nama = /^(AC|WiFi|TV|PAM)\b/.test(asli) ? asli : asli.charAt(0).toLowerCase() + asli.slice(1);
      return x.sifat === "pemakaian" ? `${nama} (estimasi)` : nama;
    });
}

export type UangMasuk = {
  /** Months paid up front; null when not known. */
  bulanDimuka: number | null;
  /** Monthly total × months up front, or one month when the months are not known. */
  bayarDimuka: number;
  deposit: number;
  depositKembali: string | null;
  ketentuanDeposit: string | null;
  /** One-off fees; jumlah null when the amount is not known. */
  sekali: ItemBiaya[];
  /** Everything known, added once. */
  total: number;
  /** All parts known: months up front, every monthly fee, every one-off fee. */
  lengkap: boolean;
  /** The monthly part is an estimate (usage-based electricity). */
  estimasi: boolean;
  /** Plain-language list of what is still unknown. */
  belumDiketahui: string[];
  /** Minimum stay in months; separate from months paid up front. */
  durasiMinimal: number;
};

/**
 * Cash needed to move in: the monthly total for the months paid up front,
 * the deposit, and one-off fees. Each part is added once; the deposit is
 * never folded into rent. When the months up front are unknown the sum
 * assumes one month and says so (`lengkap` false).
 */
export function hitungUangMasuk(k: KamarUangMasuk): UangMasuk {
  const biaya = hitungBiaya(k);
  const bulan = k.bayar_dimuka_bulan ?? null;
  const sekali: ItemBiaya[] = bacaDaftar(k.biaya_sekali).map((b) => ({ nama: b.nama, jumlah: b.jumlah, sifat: b.jumlah == null ? "belum_diketahui" : "tetap" }));
  const bayarDimuka = biaya.total * (bulan ?? 1);
  const total = bayarDimuka + (k.deposit ?? 0) + sekali.reduce((a, b) => a + (b.jumlah ?? 0), 0);
  const belumDiketahui = [
    ...(bulan == null ? ["berapa bulan sewa dibayar di muka"] : []),
    ...biaya.belumDiketahui.map((n) => `biaya ${n.toLowerCase()} per bulan`),
    ...sekali.filter((s) => s.jumlah == null).map((s) => s.nama.toLowerCase()),
  ];
  return {
    bulanDimuka: bulan,
    bayarDimuka,
    deposit: k.deposit ?? 0,
    depositKembali: k.deposit ? (k.deposit_kembali ?? null) : null,
    ketentuanDeposit: k.deposit ? (k.ketentuan_deposit?.trim() || null) : null,
    sekali,
    total,
    lengkap: belumDiketahui.length === 0,
    estimasi: biaya.estimasi,
    belumDiketahui,
    durasiMinimal: k.durasi_minimal,
  };
}

const KUNCI_KAMAR: Array<keyof TipeKamar> = ["id", "kos_id", "nama", "harga_bulanan", "model_listrik", "kamar_tersedia", "total_kamar"];

/** kos_kartu.kamar / cari_kos_v3.kamar (a to_jsonb'd tipe_kamar row) → typed row. */
export function bacaKamar(json: Json | null | undefined): TipeKamar | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  return KUNCI_KAMAR.every((k) => k in o) ? (o as unknown as TipeKamar) : null;
}
