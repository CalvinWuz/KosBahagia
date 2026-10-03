// The decision summary at the top of a listing: up to three strengths and
// three drawbacks, derived only from recorded data for this kos and the
// selected room type. Nothing here is written by hand, so the summary can
// never disagree with the sections below it.

import { hitungBiaya, type TipeKamar } from "../biaya.ts";
import { chipKebersihan, kataKedap } from "../skala.ts";
import type { InfoStatus } from "../kamar.ts";

type Penilaian = { skor_kedap: number | null; material_tembok: string | null } | null;
type Aturan = { jam_malam: string | null } | null;
type Sekitar = { landmark_nama: string; landmark_menit_jalan: number | null } | null;

export type BahanRingkasan = {
  kebersihan: number | null;
  transparansi: number | null;
  penilaian: Penilaian;
  aturan: Aturan;
  sekitar: Sekitar;
  /** Count of safety red flags from the surveyor. */
  redFlags: number;
  kamar: TipeKamar | null;
  /** Room-level bathroom; falls back to the kos facility when the room has no record. */
  kmDalamKos: boolean;
  status: InfoStatus | null;
};

const angka = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");
const jam = (t: string) => t.slice(0, 5).replace(":", ".");

export function kelebihanKekurangan(d: BahanRingkasan): { kelebihan: string[]; kekurangan: string[] } {
  const kelebihan: string[] = [];
  const kekurangan: string[] = [];
  const kedap = d.penilaian?.skor_kedap ?? null;
  const kmDalam = d.kamar?.kamar_mandi_dalam ?? d.kmDalamKos;
  const biaya = d.kamar ? hitungBiaya(d.kamar) : null;
  const menit = d.sekitar?.landmark_menit_jalan ?? null;

  // Drawbacks first in importance: safety, then what the renter cannot change.
  if (d.redFlags > 0) kekurangan.push(`${d.redFlags} catatan keselamatan dari surveyor`);
  if (d.status?.status === "penuh") kekurangan.push("Tipe kamar ini sedang penuh");
  if (biaya && !biaya.lengkap) kekurangan.push(`Biaya ${biaya.belumDiketahui.join(" dan ").toLowerCase()} belum diketahui`);
  if (kedap != null && kedap <= 2) kekurangan.push(`${kataKedap(kedap)} saat tes suara (${kedap}/5${d.penilaian?.material_tembok ? `, tembok ${d.penilaian.material_tembok}` : ""})`);
  if (d.kebersihan != null && d.kebersihan < 3) kekurangan.push(`Kebersihan kurang (${angka(d.kebersihan)}/5)`);
  if (d.kamar && !kmDalam) kekurangan.push("Kamar mandi di luar, dipakai bersama");
  if (d.aturan?.jam_malam) kekurangan.push(`Jam malam pukul ${jam(d.aturan.jam_malam)}`);
  if (menit != null && menit > 15) kekurangan.push(`${menit} menit jalan ke ${d.sekitar?.landmark_nama}`);

  const bersih = chipKebersihan(d.kebersihan);
  if (bersih && d.kebersihan != null) kelebihan.push(`${bersih} (kebersihan ${angka(d.kebersihan)}/5)`);
  if (kedap != null && kedap >= 4) kelebihan.push(`${kataKedap(kedap)} saat tes suara (${kedap}/5)`);
  if (menit != null && menit <= 10) kelebihan.push(`${menit} menit jalan ke ${d.sekitar?.landmark_nama}`);
  if (d.kamar && kmDalam) kelebihan.push("Kamar mandi dalam");
  if (d.aturan && !d.aturan.jam_malam) kelebihan.push("Tanpa jam malam");
  if (d.transparansi != null && d.transparansi >= 5) kelebihan.push("Semua biaya disebutkan jelas");
  if (d.kamar?.model_listrik === "termasuk") kelebihan.push("Listrik sudah termasuk sewa");

  return { kelebihan: kelebihan.slice(0, 3), kekurangan: kekurangan.slice(0, 3) };
}
