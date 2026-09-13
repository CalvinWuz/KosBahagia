import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { supabaseServer } from "@/lib/supabase/server";
import { ambilHasil, type HasilKos } from "@/lib/cari/ambil";
import { tentukanPusat, type AreaPublik } from "@/lib/cari/pusat";

type Klien = SupabaseClient<Database>;
export type StatistikArea = Database["public"]["Functions"]["statistik_area"]["Returns"][number];
export type AreaTetangga = Database["public"]["Functions"]["area_tetangga"]["Returns"][number];

/** A thin area page hurts the whole domain; never publish under this. */
export const MIN_LISTING_AREA = 5;

export type DataArea = {
  area: AreaPublik;
  statistik: StatistikArea;
  kos: HasilKos[];
  tetangga: AreaTetangga[];
};

export async function ambilArea(db: Klien, slug: string): Promise<DataArea | null> {
  const { data: area } = await db.from("area_publik").select("*").eq("slug", slug).maybeSingle();
  if (!area?.slug) return null;
  const [{ data: stat }, { data: tetangga }] = await Promise.all([
    db.rpc("statistik_area", { p_slug: slug }),
    db.rpc("area_tetangga", { p_slug: slug, p_limit: 3 }),
  ]);
  const statistik = stat?.[0];
  if (!statistik || statistik.jumlah_kos < MIN_LISTING_AREA) return null;

  // Same membership rule as /cari and statistik_area.
  const pusat = tentukanPusat({ area: slug }, [area]);
  const { hasil } = await ambilHasil(db, { area: slug }, pusat, { limit: 48 });
  return { area, statistik, kos: hasil, tetangga: (tetangga ?? []).filter((t) => t.jumlah_kos >= MIN_LISTING_AREA) };
}

/** Areas allowed to have a page: at least MIN_LISTING_AREA listings. */
export async function daftarAreaLayak(db: Klien): Promise<Array<{ slug: string; jumlah_kos: number }>> {
  const { data: areas } = await db.from("area_publik").select("slug");
  const hasil: Array<{ slug: string; jumlah_kos: number }> = [];
  for (const a of areas ?? []) {
    if (!a.slug) continue;
    const { data } = await db.rpc("statistik_area", { p_slug: a.slug });
    const n = data?.[0]?.jumlah_kos ?? 0;
    if (n >= MIN_LISTING_AREA) hasil.push({ slug: a.slug, jumlah_kos: n });
  }
  return hasil;
}

export const dataArea = cache((slug: string) => ambilArea(supabaseServer(), slug));
