// Facility filters. Two of them are room-level: cari_kos_v4 checks them on
// the same room type as the price (tipe_kamar.kamar_mandi_dalam, boleh_ac).
// Every other filterable facility is recorded per kos (kos_fasilitas).
// Kept out of FilterSheet so the results page can use it without loading
// the sheet.

export type FasilitasFilter = { slug: string; nama: string; kategori: string };

export const FASILITAS_KAMAR = [
  { slug: "kamar-mandi-dalam", nama: "Kamar mandi dalam" },
  { slug: "ac", nama: "AC" },
] as const;

export const SLUG_KAMAR: ReadonlySet<string> = new Set(FASILITAS_KAMAR.map((f) => f.slug));

/** slug → name for the active-filter chips and the relax suggestions. */
export function namaFasilitas(fasilitas: FasilitasFilter[]): Record<string, string> {
  return Object.fromEntries([...fasilitas.map((f) => [f.slug, f.nama]), ...FASILITAS_KAMAR.map((f) => [f.slug, f.nama])]);
}
