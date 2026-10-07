import { formatRupiah } from "../format.ts";
import type { CariParams } from "../cari-params.ts";
import { ambilHasil, hitungHasil, type HasilKos, type KlienCari } from "./ambil.ts";
import type { Pusat } from "./pusat.ts";

type Klien = KlienCari;

export type SaranLonggar = {
  /** "Longgarkan harga ke Rp1.800.000" */
  label: string;
  params: CariParams;
  /** Live count for the relaxed search; only suggestions with results are returned. */
  jumlah: number;
};

/** Facility names for the labels ("Hapus syarat kamar mandi dalam"); slugs are used when absent. */
export type NamaFasilitas = Record<string, string>;

/** Lower-case for running text, but keep acronyms and brand spellings (AC, CCTV, WiFi). */
function dalamKalimat(nama: string): string {
  const kata = nama.split(" ")[0];
  if (/^[A-Z0-9]{2,}$/.test(kata) || /[a-z][A-Z]/.test(kata)) return nama;
  return nama.charAt(0).toLowerCase() + nama.slice(1);
}

/**
 * Every single change that relaxes the search by one requirement. Nothing is
 * dropped silently: each candidate is a button with its own label and count.
 * Price is first widened by 25 % before being dropped, because that is
 * usually the real blocker.
 */
export function kandidatLonggar(p: CariParams, namaFasilitas: NamaFasilitas = {}): Array<{ label: string; params: CariParams }> {
  const kandidat: Array<{ label: string; params: CariParams }> = [];
  if (p.harga_max) {
    const lebihLonggar = Math.ceil((p.harga_max * 1.25) / 100_000) * 100_000;
    kandidat.push({ label: `Longgarkan harga ke ${formatRupiah(lebihLonggar)}`, params: { ...p, harga_max: lebihLonggar } });
    kandidat.push({ label: "Hapus batas harga maksimal", params: { ...p, harga_max: undefined } });
  }
  if (p.harga_min) kandidat.push({ label: "Hapus batas harga minimal", params: { ...p, harga_min: undefined } });
  if (p.tipe?.length) kandidat.push({ label: "Tampilkan semua tipe kos", params: { ...p, tipe: undefined } });
  const fasilitas = [...new Set(p.fasilitas ?? [])];
  for (const slug of fasilitas) {
    const nama = dalamKalimat(namaFasilitas[slug] ?? slug.replace(/-/g, " "));
    kandidat.push({ label: `Hapus syarat ${nama}`, params: { ...p, fasilitas: fasilitas.filter((f) => f !== slug) } });
  }
  if (fasilitas.length > 1) kandidat.push({ label: "Hapus semua syarat fasilitas", params: { ...p, fasilitas: undefined } });
  if (p.kebersihan) kandidat.push({ label: "Hapus batas kebersihan", params: { ...p, kebersihan: undefined } });
  if (p.kedap) kandidat.push({ label: "Hapus batas kedap suara", params: { ...p, kedap: undefined } });
  if (p.pasangan) kandidat.push({ label: "Hapus filter pasangan", params: { ...p, pasangan: undefined } });
  if (p.tanpa_jam_malam) kandidat.push({ label: "Tampilkan juga yang ada jam malam", params: { ...p, tanpa_jam_malam: false } });
  if (p.hewan) kandidat.push({ label: "Hapus filter hewan", params: { ...p, hewan: false } });
  if (p.masak) kandidat.push({ label: "Hapus filter masak di kamar", params: { ...p, masak: false } });
  if (p.dekat_minimarket) kandidat.push({ label: "Tampilkan juga yang jauh dari minimarket", params: { ...p, dekat_minimarket: false } });
  return kandidat;
}

/**
 * For a zero-result search: count every one-step relaxation and return the
 * ones that bring results back, most results first (at most `maks`).
 */
export async function saranLonggar(db: Klien, p: CariParams, pusat: Pusat, namaFasilitas: NamaFasilitas = {}, maks = 3): Promise<SaranLonggar[]> {
  const kandidat = kandidatLonggar(p, namaFasilitas);
  if (kandidat.length === 0) return [];
  const jumlah = await Promise.all(kandidat.map((k) => hitungHasil(db, k.params, pusat).catch(() => 0)));
  return kandidat
    .map((k, i) => ({ ...k, jumlah: jumlah[i] }))
    .filter((k) => k.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, maks);
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
