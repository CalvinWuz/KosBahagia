import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { KosKartu } from "@/components/kos/KosCard";

type Klien = SupabaseClient<Database>;
type TipeKamar = Database["public"]["Tables"]["tipe_kamar"]["Row"];

export const MAKS_BANDING = 3;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type KosBanding = {
  kartu: KosKartu;
  kamar: TipeKamar | null;
  kmDalam: boolean;
  jamMalam: string | null;
  /** For the per-column chat button. */
  whatsapp: string | null;
};

/** `?kos=a,b,c` — slugs (shareable) or ids (from the tray). Max 3, deduplicated. */
export function bacaKunciBanding(raw: string | string[] | undefined): string[] {
  const nilai = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  return [...new Set(nilai.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAKS_BANDING);
}

export async function ambilBanding(db: Klien, kunci: string[]): Promise<KosBanding[]> {
  if (kunci.length === 0) return [];
  const ids = kunci.filter((k) => UUID.test(k));
  const slugs = kunci.filter((k) => !UUID.test(k));
  const [byId, bySlug] = await Promise.all([
    ids.length ? db.from("kos_kartu").select("*").eq("status", "tayang").in("id", ids) : Promise.resolve({ data: [] as KosKartu[] }),
    slugs.length ? db.from("kos_kartu").select("*").eq("status", "tayang").in("slug", slugs) : Promise.resolve({ data: [] as KosKartu[] }),
  ]);
  const semua = [...(byId.data ?? []), ...(bySlug.data ?? [])];
  // Keep the URL's order.
  const kartu = kunci
    .map((k) => semua.find((x) => x.id === k || x.slug === k))
    .filter((x): x is KosKartu => Boolean(x?.id));
  const kosIds = kartu.map((k) => k.id as string);
  if (kosIds.length === 0) return [];

  const [kamarRes, fasRes, aturanRes, kosRes] = await Promise.all([
    db.from("tipe_kamar").select("*").in("kos_id", kosIds).order("total_bulanan"),
    db.from("kos_fasilitas").select("kos_id, fasilitas!inner(slug)").in("kos_id", kosIds).eq("fasilitas.slug", "kamar-mandi-dalam"),
    db.from("kos_aturan").select("kos_id, jam_malam").in("kos_id", kosIds),
    db.from("kos").select("id, whatsapp").in("id", kosIds),
  ]);

  return kartu.map((k) => ({
    kartu: k,
    kamar: (kamarRes.data ?? []).find((t) => t.kos_id === k.id) ?? null,
    kmDalam: (fasRes.data ?? []).some((f) => f.kos_id === k.id),
    jamMalam: (aturanRes.data ?? []).find((a) => a.kos_id === k.id)?.jam_malam ?? null,
    whatsapp: (kosRes.data ?? []).find((x) => x.id === k.id)?.whatsapp ?? null,
  }));
}
