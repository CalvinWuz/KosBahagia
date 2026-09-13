import type { Database } from "@/lib/supabase/types";
import type { CariParams } from "@/lib/cari-params";

export type AreaPublik = Database["public"]["Views"]["area_publik"]["Row"];

export type Pusat = {
  lat: number;
  lng: number;
  radius: number;
  /** What the header shows: an area name, or the free-text query. */
  nama: string;
  /** Set when the centre came from an area row. */
  slug?: string;
  /** Free text that did not match an area; passed to cari_kos as a name filter. */
  q?: string;
};

// Launch area when nothing else is given (CLAUDE.md: one kecamatan first).
export const AREA_DEFAULT = "palmerah";
const RADIUS_DEFAULT: Record<string, number> = { kampus: 2000, stasiun: 2000, kecamatan: 3000 };
const RADIUS_TEKS = 20_000;

function cocokArea(areas: AreaPublik[], q: string): AreaPublik | undefined {
  const kata = q.trim().toLowerCase();
  return (
    areas.find((a) => a.slug === kata) ??
    areas.find((a) => (a.nama ?? "").toLowerCase() === kata) ??
    areas.find((a) => (a.nama ?? "").toLowerCase().includes(kata)) ??
    areas.find((a) => (a.slug ?? "").includes(kata.replace(/\s+/g, "-")))
  );
}

/**
 * Turns the URL into a centre point. Precedence: explicit area → free text
 * that names an area → free text as a kos-name filter around the default
 * area (wide radius) → the default area.
 */
export function tentukanPusat(params: CariParams, areas: AreaPublik[]): Pusat {
  const dariSlug = params.area ? areas.find((a) => a.slug === params.area) : undefined;
  const dariTeks = !dariSlug && params.q ? cocokArea(areas, params.q) : undefined;
  const area = dariSlug ?? dariTeks ?? areas.find((a) => a.slug === AREA_DEFAULT) ?? areas[0];

  if (!area || area.lat == null || area.lng == null) {
    // No areas in the database at all. Centre on Jakarta and search wide.
    return { lat: -6.2, lng: 106.8167, radius: params.radius ?? RADIUS_TEKS, nama: params.q ?? "Semua area", q: params.q };
  }

  const teksBebas = params.q && !dariSlug && !dariTeks ? params.q : undefined;
  return {
    lat: area.lat,
    lng: area.lng,
    radius: params.radius ?? (teksBebas ? RADIUS_TEKS : (RADIUS_DEFAULT[area.tipe ?? ""] ?? 3000)),
    nama: teksBebas ? `“${teksBebas}”` : (area.nama ?? area.slug ?? ""),
    slug: area.slug ?? undefined,
    q: teksBebas,
  };
}
