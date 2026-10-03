// Availability is a property of a room type, not of the kos. Every place that
// shows "tersedia" goes through statusKamar so a full AC room can never look
// available because the fan room next to it still has space.

import { formatTanggal, formatWaktuRelatif } from "./format.ts";

export const BATAS_SEGAR_HARI = 30;

/**
 * tersedia            confirmed within 30 days, at least one room free
 * penuh               confirmed within 30 days, no room free
 * belum_dikonfirmasi  last confirmation older than 30 days (or never):
 *                     the stored number is shown as "terakhir tercatat"
 */
export type StatusKamar = "tersedia" | "penuh" | "belum_dikonfirmasi";

export type InfoStatus = {
  status: StatusKamar;
  /** Rooms free at the last confirmation. */
  tersedia: number;
  total: number;
  dikonfirmasiPada: string | null;
  /** "Tersedia", "Penuh", "Belum dikonfirmasi" */
  label: string;
  /** "4 dari 5 kamar kosong", "Terakhir tercatat 2 kamar kosong" */
  rincian: string;
  /** "dikonfirmasi 3 hari lalu (18 September 2026)" or "belum pernah dikonfirmasi" */
  waktu: string;
};

export function statusKamar(
  kamar: { kamar_tersedia: number | null; total_kamar?: number | null },
  dikonfirmasiPada: string | null,
  sekarang: Date,
): InfoStatus {
  const tersedia = Math.max(0, kamar.kamar_tersedia ?? 0);
  const total = Math.max(tersedia, kamar.total_kamar ?? tersedia);
  const umurHari = dikonfirmasiPada ? (sekarang.getTime() - new Date(dikonfirmasiPada).getTime()) / 86_400_000 : Infinity;
  const segar = umurHari <= BATAS_SEGAR_HARI;
  const waktu = dikonfirmasiPada
    ? `dikonfirmasi ${formatWaktuRelatif(dikonfirmasiPada, sekarang)} (${formatTanggal(dikonfirmasiPada)})`
    : "belum pernah dikonfirmasi";

  if (!segar) {
    return {
      status: "belum_dikonfirmasi",
      tersedia,
      total,
      dikonfirmasiPada,
      label: "Belum dikonfirmasi",
      rincian: tersedia > 0 ? `Terakhir tercatat ${tersedia} kamar kosong` : "Terakhir tercatat penuh",
      waktu,
    };
  }
  if (tersedia === 0) {
    return { status: "penuh", tersedia, total, dikonfirmasiPada, label: "Penuh", rincian: total ? `0 dari ${total} kamar kosong` : "Tidak ada kamar kosong", waktu };
  }
  return { status: "tersedia", tersedia, total, dikonfirmasiPada, label: "Tersedia", rincian: total ? `${tersedia} dari ${total} kamar kosong` : `${tersedia} kamar kosong`, waktu };
}

/**
 * The room a page shows when nothing was chosen: the cheapest room type that
 * still has a free room, preferring complete totals; the cheapest overall when
 * every room is full. Mirrors the `acuan` ordering in kos_kartu / kos_cocok.
 */
export function kamarAcuan<T extends { id: string; kamar_tersedia: number; total_bulanan: number | null; harga_bulanan: number; total_lengkap?: boolean | null }>(
  daftar: T[],
): T | null {
  if (daftar.length === 0) return null;
  return [...daftar].sort(
    (a, b) =>
      Number(a.kamar_tersedia === 0) - Number(b.kamar_tersedia === 0) ||
      Number(a.total_lengkap === false) - Number(b.total_lengkap === false) ||
      (a.total_bulanan ?? 0) - (b.total_bulanan ?? 0) ||
      a.harga_bulanan - b.harga_bulanan ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  )[0];
}

/** Reads `?kamar=<id>` and keeps it only when that room type belongs to this kos. */
export function kamarDariUrl<T extends { id: string }>(daftar: T[], cari: string | null | undefined): T | null {
  if (!cari) return null;
  return daftar.find((k) => k.id === cari) ?? null;
}
