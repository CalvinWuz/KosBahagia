import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { CariParams } from "@/lib/cari-params";
import type { Pusat } from "./pusat";

export type HasilKos = Database["public"]["Functions"]["cari_kos"]["Returns"][number];
type Argumen = Database["public"]["Functions"]["cari_kos"]["Args"];
type Klien = SupabaseClient<Database>;

export const UKURAN_HALAMAN = 20;

/** Maps URL params + centre to cari_kos() arguments. One place, both sides. */
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
    p_tipe: p.tipe,
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
  const { data, error } = await db.rpc("cari_kos", argumenCari(p, pusat, halaman));
  if (error) throw new Error(error.message);
  const hasil = data ?? [];
  return { hasil, total: hasil.length ? Number(hasil[0].total_count) : 0 };
}

/** Only the live count (cheapest possible call). */
export async function hitungHasil(db: Klien, p: CariParams, pusat: Pusat): Promise<number> {
  const { total } = await ambilHasil(db, p, pusat, { limit: 1 });
  return total;
}
