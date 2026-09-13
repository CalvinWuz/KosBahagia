import type { Json } from "@/lib/supabase/types";

export type Hotspot = { ke: string; yaw: number; pitch: number; label: string };
export type TitikTur = {
  id: string;
  nama: string;
  /** Full-resolution equirectangular JPEG (6144 px). */
  url: string;
  /** Width of `url` in pixels; skipped when it exceeds the GPU's texture limit. */
  lebar: number;
  /** 2048 px preview, shown first. */
  previewUrl: string;
  ukuranBytes: number | null;
  hotspot: Hotspot[];
};

/** Reads a kos_media foto360 row into a TitikTur; null when unusable. */
export function bacaTitik(m: { id: string; url: string; lebar: number; keterangan: string | null; tur: Json | null }): TitikTur | null {
  const t = m.tur && typeof m.tur === "object" && !Array.isArray(m.tur) ? (m.tur as Record<string, Json | undefined>) : {};
  const hotspot = (Array.isArray(t.hotspot) ? t.hotspot : [])
    .map((h) => {
      if (!h || typeof h !== "object" || Array.isArray(h)) return null;
      const x = h as Record<string, Json | undefined>;
      if (typeof x.ke !== "string" || typeof x.yaw !== "number") return null;
      return { ke: x.ke, yaw: x.yaw, pitch: typeof x.pitch === "number" ? x.pitch : 0, label: typeof x.label === "string" ? x.label : "Pindah" };
    })
    .filter((h): h is Hotspot => h !== null);
  return {
    id: m.id,
    nama: typeof t.titik === "string" ? t.titik : (m.keterangan ?? "Titik"),
    url: m.url,
    lebar: m.lebar,
    previewUrl: typeof t.preview_url === "string" ? t.preview_url : m.url,
    ukuranBytes: typeof t.ukuran_bytes === "number" ? t.ukuran_bytes : null,
    hotspot,
  };
}
