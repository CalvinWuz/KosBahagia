import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { daftarAreaLayak } from "@/lib/area/data";

const SITUS = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statis: MetadataRoute.Sitemap = [
    { url: `${SITUS}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITUS}/cari`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITUS}/cara-kami-menilai`, changeFrequency: "monthly", priority: 0.6 },
  ];
  try {
    const db = supabaseServer();
    const [area, kos] = await Promise.all([
      daftarAreaLayak(db),
      db.from("kos").select("slug, diubah_pada").eq("status", "tayang").gte("ketersediaan_dikonfirmasi_pada", new Date(Date.now() - 90 * 86_400_000).toISOString()),
    ]);
    return [
      ...statis,
      ...area.map((a) => ({ url: `${SITUS}/area/${a.slug}`, changeFrequency: "daily" as const, priority: 0.9 })),
      ...(kos.data ?? []).map((k) => ({ url: `${SITUS}/kos/${k.slug}`, lastModified: k.diubah_pada, changeFrequency: "weekly" as const, priority: 0.7 })),
    ];
  } catch {
    return statis;
  }
}
