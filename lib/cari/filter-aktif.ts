// The active filters as removable chips: one chip per choice the renter made
// (each ticked kos type is its own chip, so removing "Putra" keeps "Campur"),
// grouped by requirement for the count on the Filter button. The quick
// chips, the filter sheet and this summary all read and write the same
// CariParams, so they cannot disagree.

import { formatRupiah as rp } from "../format.ts";
import { kataKebersihan, kataKedap } from "../skala.ts";
import { tanpaFilter, toggleTipe, type CariParams, type TipeKosParam } from "../cari-params.ts";

export type FilterAktif = {
  /** Stable key, also the React key. */
  id: string;
  /** Requirement it belongs to; the count on the Filter button counts groups. */
  grup: string;
  label: string;
  /** The same search without this one choice. */
  hapus: (p: CariParams) => CariParams;
};

export const LABEL_TIPE: Record<TipeKosParam, string> = { putra: "Kos putra", putri: "Kos putri", campur: "Kos campur" };

const angka = (n: number) => String(n).replace(".", ",");

/** Slug → readable name when the facility list is not at hand: "water-heater" → "Water heater". */
function namaDariSlug(slug: string): string {
  const teks = slug.replace(/-/g, " ");
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

export function daftarFilterAktif(p: CariParams, namaFasilitas: Record<string, string> = {}): FilterAktif[] {
  const daftar: FilterAktif[] = [];

  if (p.harga_min || p.harga_max) {
    const label =
      p.harga_min && p.harga_max
        ? `Total ${rp(p.harga_min)}–${rp(p.harga_max)}`
        : p.harga_max
          ? `Total ≤ ${rp(p.harga_max)}`
          : `Total ≥ ${rp(p.harga_min ?? 0)}`;
    daftar.push({ id: "harga", grup: "harga", label, hapus: (x) => ({ ...x, harga_min: undefined, harga_max: undefined }) });
  }
  for (const t of p.tipe ?? []) {
    daftar.push({ id: `tipe-${t}`, grup: "tipe", label: LABEL_TIPE[t], hapus: (x) => toggleTipe(x, t) });
  }
  for (const slug of new Set(p.fasilitas ?? [])) {
    daftar.push({
      id: `fasilitas-${slug}`,
      grup: `fasilitas-${slug}`,
      label: namaFasilitas[slug] ?? namaDariSlug(slug),
      hapus: (x) => ({ ...x, fasilitas: (x.fasilitas ?? []).filter((f) => f !== slug) }),
    });
  }
  if (p.kebersihan) {
    const kata = kataKebersihan(p.kebersihan)?.toLowerCase();
    daftar.push({ id: "kebersihan", grup: "kebersihan", label: `Kebersihan ${angka(p.kebersihan)}+${kata ? ` (${kata})` : ""}`, hapus: (x) => ({ ...x, kebersihan: undefined }) });
  }
  if (p.kedap) {
    const kata = kataKedap(p.kedap)?.toLowerCase();
    daftar.push({ id: "kedap", grup: "kedap", label: `Kedap suara ${angka(p.kedap)}+${kata && kata !== "kedap suara" ? ` (${kata})` : ""}`, hapus: (x) => ({ ...x, kedap: undefined }) });
  }
  if (p.pasangan) {
    daftar.push({ id: "pasangan", grup: "pasangan", label: p.pasangan === "boleh" ? "Boleh pasangan" : "Pasangan dengan surat nikah", hapus: (x) => ({ ...x, pasangan: undefined }) });
  }
  if (p.hewan) daftar.push({ id: "hewan", grup: "hewan", label: "Boleh hewan", hapus: (x) => ({ ...x, hewan: false }) });
  if (p.masak) daftar.push({ id: "masak", grup: "masak", label: "Boleh masak di kamar", hapus: (x) => ({ ...x, masak: false }) });
  if (p.tanpa_jam_malam) daftar.push({ id: "tanpa_jam_malam", grup: "tanpa_jam_malam", label: "Tanpa jam malam", hapus: (x) => ({ ...x, tanpa_jam_malam: false }) });
  if (p.dekat_minimarket) daftar.push({ id: "dekat_minimarket", grup: "dekat_minimarket", label: "Minimarket ≤ 300 m", hapus: (x) => ({ ...x, dekat_minimarket: false }) });

  return daftar;
}

/** "3 filter aktif: Total ≤ Rp1.500.000, Kos putra, Kos campur." for screen readers and the sheet. */
export function ringkasanFilterAktif(daftar: FilterAktif[]): string {
  if (daftar.length === 0) return "Tanpa filter.";
  const grup = new Set(daftar.map((f) => f.grup)).size;
  return `${grup} filter aktif: ${daftar.map((f) => f.label).join(", ")}.`;
}

export { tanpaFilter };
