import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { KosKartu } from "@/components/kos/KosCard";
import { kamarAcuan } from "@/lib/kamar";
import { adalahUuid, type KunciBanding } from "./kunci-banding";

export { MAKS_BANDING, bacaKunciBanding } from "./kunci-banding";

type Klien = SupabaseClient<Database>;
type Tabel = Database["public"]["Tables"];
type TipeKamar = Tabel["tipe_kamar"]["Row"];
type Aturan = Pick<Tabel["kos_aturan"]["Row"], "kos_id" | "jam_malam" | "pasangan" | "tamu" | "lawan_jenis">;

/**
 * dipilih   the link/tray named this room type and it exists
 * otomatis  no room named: the cheapest room with space, shown as such
 * hilang    the named room type no longer exists; the column asks for a new pick
 */
export type AsalKamar = "dipilih" | "otomatis" | "hilang";

export type KosBanding = {
  kunci: KunciBanding;
  kartu: KosKartu;
  semuaKamar: TipeKamar[];
  /** The room being compared; null only when asalKamar is "hilang". */
  kamar: TipeKamar | null;
  asalKamar: AsalKamar;
  /** Room-level when recorded, else the kos facility. */
  kmDalam: boolean;
  aturan: Aturan | null;
  /** For the per-column contact button. */
  whatsapp: string | null;
};

export async function ambilBanding(db: Klien, kunci: KunciBanding[]): Promise<KosBanding[]> {
  if (kunci.length === 0) return [];
  const ids = [...new Set(kunci.filter((k) => adalahUuid(k.kos)).map((k) => k.kos))];
  const slugs = [...new Set(kunci.filter((k) => !adalahUuid(k.kos)).map((k) => k.kos))];
  const [byId, bySlug] = await Promise.all([
    ids.length ? db.from("kos_kartu").select("*").eq("status", "tayang").in("id", ids) : Promise.resolve({ data: [] as KosKartu[], error: null }),
    slugs.length ? db.from("kos_kartu").select("*").eq("status", "tayang").in("slug", slugs) : Promise.resolve({ data: [] as KosKartu[], error: null }),
  ]);
  if (byId.error || bySlug.error) throw new Error(`kos_kartu: ${(byId.error ?? bySlug.error)?.message}`);
  const semua = [...(byId.data ?? []), ...(bySlug.data ?? [])];
  const kosIds = [...new Set(semua.map((k) => k.id as string))];
  if (kosIds.length === 0) return [];

  const [kamarRes, fasRes, aturanRes, kosRes] = await Promise.all([
    db.from("tipe_kamar").select("*").in("kos_id", kosIds).order("total_bulanan"),
    db.from("kos_fasilitas").select("kos_id, fasilitas!inner(slug)").in("kos_id", kosIds).eq("fasilitas.slug", "kamar-mandi-dalam"),
    db.from("kos_aturan").select("kos_id, jam_malam, pasangan, tamu, lawan_jenis").in("kos_id", kosIds),
    db.from("kos").select("id, whatsapp").in("id", kosIds),
  ]);
  if (kamarRes.error) throw new Error(`tipe_kamar: ${kamarRes.error.message}`);

  // Keep the URL's order; one column per kos + room pair.
  return kunci.flatMap((k): KosBanding[] => {
    const kartu = semua.find((x) => x.id === k.kos || x.slug === k.kos);
    if (!kartu?.id) return [];
    const semuaKamar = (kamarRes.data ?? []).filter((t) => t.kos_id === kartu.id);
    const dipilih = k.kamar ? semuaKamar.find((t) => t.id === k.kamar) ?? null : null;
    const asalKamar: AsalKamar = k.kamar ? (dipilih ? "dipilih" : "hilang") : "otomatis";
    const kamar = asalKamar === "otomatis" ? kamarAcuan(semuaKamar) : dipilih;
    const kmKos = (fasRes.data ?? []).some((f) => f.kos_id === kartu.id);
    return [{
      kunci: { kos: kartu.slug ?? k.kos, kamar: k.kamar },
      kartu,
      semuaKamar,
      kamar,
      asalKamar,
      kmDalam: kamar?.kamar_mandi_dalam ?? kmKos,
      aturan: (aturanRes.data ?? []).find((a) => a.kos_id === kartu.id) ?? null,
      whatsapp: (kosRes.data ?? []).find((x) => x.id === kartu.id)?.whatsapp ?? null,
    }];
  });
}
