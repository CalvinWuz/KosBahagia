import { formatRupiah } from "@/lib/format";
import { KUNCI_FILTER, type CariParams } from "@/lib/cari-params";
import { ambilHasil, hitungHasil, type HasilKos, type KlienCari } from "./ambil";
import type { Pusat } from "./pusat";

type Klien = KlienCari;

export type SaranLonggar = {
  /** "Longgarkan harga ke Rp1.800.000" */
  label: string;
  params: CariParams;
  jumlah: number;
};

const LABEL: Record<(typeof KUNCI_FILTER)[number], string> = {
  harga_min: "Hapus batas harga minimal",
  harga_max: "Hapus batas harga",
  tipe: "Tampilkan semua tipe kos",
  kebersihan: "Hapus batas kebersihan",
  kedap: "Hapus batas kedap suara",
  fasilitas: "Hapus filter fasilitas",
  pasangan: "Hapus filter pasangan",
  tanpa_jam_malam: "Tampilkan juga yang ada jam malam",
  hewan: "Hapus filter hewan",
  masak: "Hapus filter masak di kamar",
  dekat_minimarket: "Tampilkan juga yang jauh dari minimarket",
};

/**
 * For a zero-result search: try relaxing each active filter on its own and
 * return the relaxation that recovers the most kos. Price is first widened
 * by 25 % before being dropped, because that is usually the real blocker.
 */
export async function saranLonggar(db: Klien, p: CariParams, pusat: Pusat): Promise<SaranLonggar | null> {
  const kandidat: Array<{ label: string; params: CariParams }> = [];

  for (const kunci of KUNCI_FILTER) {
    const nilai = p[kunci];
    const aktif = Array.isArray(nilai) ? nilai.length > 0 : Boolean(nilai);
    if (!aktif) continue;

    if (kunci === "harga_max" && typeof nilai === "number") {
      const lebihLonggar = Math.ceil((nilai * 1.25) / 100_000) * 100_000;
      kandidat.push({ label: `Longgarkan harga ke ${formatRupiah(lebihLonggar)}`, params: { ...p, harga_max: lebihLonggar } });
    }
    const tanpa = { ...p, [kunci]: undefined };
    kandidat.push({ label: LABEL[kunci], params: tanpa });
  }
  if (kandidat.length === 0) return null;

  const jumlah = await Promise.all(kandidat.map((k) => hitungHasil(db, k.params, pusat).catch(() => 0)));
  let terbaik: SaranLonggar | null = null;
  kandidat.forEach((k, i) => {
    if (jumlah[i] > 0 && (!terbaik || jumlah[i] > terbaik.jumlah)) terbaik = { ...k, jumlah: jumlah[i] };
  });
  return terbaik;
}

export type Terdekat = { hasil: HasilKos[]; tanpaFilter: boolean };

/** Three nearest kos beyond the current radius, same filters; falls back to no filters. */
export async function terdekatDiLuar(db: Klien, p: CariParams, pusat: Pusat): Promise<Terdekat> {
  const luas: Pusat = { ...pusat, radius: 20_000 };
  const { hasil } = await ambilHasil(db, { ...p, urut: "terdekat" }, luas, { limit: 3 });
  if (hasil.length) return { hasil, tanpaFilter: false };
  const { hasil: bebas } = await ambilHasil(db, { q: p.q, area: p.area, urut: "terdekat" }, luas, { limit: 3 });
  return { hasil: bebas, tanpaFilter: true };
}
