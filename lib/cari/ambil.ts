import type { Database } from "@/lib/supabase/types";
import type { CariParams } from "@/lib/cari-params";
import type { Pusat } from "./pusat";

// cari_kos_v4 / kos_promosi_v2 (migration 20261007000100): kos type is a
// list (any of), and price, kamar mandi dalam and AC are met by the one room
// type the card shows. cari_kos_v3 / kos_promosi remain in the database only
// for the previously deployed frontend.
type Fungsi = Database["public"]["Functions"];
export type HasilKos = Fungsi["cari_kos_v4"]["Returns"][number];
export type KosPromosi = Fungsi["kos_promosi_v2"]["Returns"][number];
type Argumen = Fungsi["cari_kos_v4"]["Args"];
type ArgumenPromosi = Fungsi["kos_promosi_v2"]["Args"];

/** Anything that can call the search RPCs: supabase-js on the server, the tiny REST client in the browser. */
export type KlienCari = {
  rpc(fn: "cari_kos_v4", args: Argumen): PromiseLike<{ data: HasilKos[] | null; error: { message: string } | null }>;
  rpc(fn: "kos_promosi_v2", args: ArgumenPromosi): PromiseLike<{ data: KosPromosi[] | null; error: { message: string } | null }>;
};
type Klien = KlienCari;

export const UKURAN_HALAMAN = 20;

/** Maps URL params + centre to cari_kos_v4() arguments. One place, both sides. */
export function argumenCari(
  p: CariParams,
  pusat: Pusat,
  halaman: { limit?: number; offset?: number } = {},
): Argumen {
  const aturan: Record<string, string | boolean> = {};
  if (p.pasangan) aturan.pasangan = p.pasangan;
  if (p.tanpa_jam_malam) aturan.tanpa_jam_malam = true;
  if (p.hewan) aturan.hewan = true;
  if (p.masak) aturan.masak_di_kamar = true;
  if (p.dekat_minimarket) aturan.dekat_minimarket = true;

  return {
    p_lat: pusat.lat,
    p_lng: pusat.lng,
    p_radius_m: pusat.radius,
    p_harga_min: p.harga_min,
    p_harga_max: p.harga_max,
    p_tipe: p.tipe?.length ? p.tipe : undefined,
    p_min_kebersihan: p.kebersihan,
    p_min_kedap: p.kedap,
    p_fasilitas: p.fasilitas?.length ? p.fasilitas : undefined,
    p_aturan: aturan,
    p_urut: p.urut ?? "relevan",
    p_limit: halaman.limit ?? UKURAN_HALAMAN,
    p_offset: halaman.offset ?? 0,
    p_q: pusat.q,
  };
}

export type HalamanHasil = { hasil: HasilKos[]; total: number };

/** Runs the search. Throws on a transport/database error. */
export async function ambilHasil(
  db: Klien,
  p: CariParams,
  pusat: Pusat,
  halaman: { limit?: number; offset?: number } = {},
): Promise<HalamanHasil> {
  const { data, error } = await db.rpc("cari_kos_v4", argumenCari(p, pusat, halaman));
  if (error) throw new Error(error.message);
  const hasil = data ?? [];
  return { hasil, total: hasil.length ? Number(hasil[0].total_count) : 0 };
}

/**
 * Paid spotlight kos that pass the same filters (max two). Shown in their own
 * labelled block; they never change the order of the main list. A failure
 * here never breaks the search: no promotions is a valid answer.
 */
export async function ambilPromosi(db: Klien, p: CariParams, pusat: Pusat): Promise<KosPromosi[]> {
  const filter = Object.fromEntries(
    Object.entries(argumenCari(p, pusat)).filter(([k]) => !["p_urut", "p_limit", "p_offset"].includes(k)),
  ) as ArgumenPromosi;
  try {
    const { data, error } = await db.rpc("kos_promosi_v2", { ...filter, p_limit: 2 });
    return error ? [] : (data ?? []);
  } catch {
    return [];
  }
}

/** Only the live count (cheapest possible call). */
export async function hitungHasil(db: Klien, p: CariParams, pusat: Pusat): Promise<number> {
  const { total } = await ambilHasil(db, p, pusat, { limit: 1 });
  return total;
}
