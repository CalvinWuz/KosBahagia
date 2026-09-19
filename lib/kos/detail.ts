import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { supabaseServer } from "@/lib/supabase/server";
import type { KosKartu } from "@/components/kos/KosCard";

type Tabel = Database["public"]["Tables"];
type Klien = SupabaseClient<Database>;

export type TipeKamar = Tabel["tipe_kamar"]["Row"];
export type Penilaian = Tabel["kos_penilaian"]["Row"];
export type Aturan = Tabel["kos_aturan"]["Row"];
export type Sekitar = Tabel["kos_sekitar"]["Row"];
export type Media = Tabel["kos_media"]["Row"];
export type Catatan = Tabel["catatan_surveyor"]["Row"];
export type Fasilitas = Tabel["fasilitas"]["Row"];
export type SkorKos = Database["public"]["Views"]["kos_skor"]["Row"];

export type DetailKosData = {
  kartu: KosKartu;
  kos: Pick<
    Tabel["kos"]["Row"],
    "id" | "slug" | "nama" | "alamat" | "rt_rw" | "tipe" | "tier" | "jumlah_kamar" | "jumlah_lantai" | "ada_lift"
    | "tahun_bangunan" | "kontak_nama" | "whatsapp" | "penjaga" | "disurvei_pada" | "surveyor"
    | "ketersediaan_dikonfirmasi_pada"
  >;
  area: { slug: string; nama: string; tipe: string } | null;
  tipeKamar: TipeKamar[];
  penilaian: Penilaian | null;
  aturan: Aturan | null;
  sekitar: Sekitar | null;
  media: Media[];
  catatan: Catatan | null;
  skor: SkorKos | null;
  /** Full facility master list; the page greys out what the kos lacks. */
  semuaFasilitas: Fasilitas[];
  fasilitasKos: string[];
  serupa: KosKartu[];
};

export async function ambilDetailKos(db: Klien, slug: string): Promise<DetailKosData | null> {
  const { data: kartu, error: kartuErr } = await db
    .from("kos_kartu")
    .select("*")
    .eq("slug", slug)
    .eq("status", "tayang")
    .maybeSingle();
  // A failed query is not "kos tidak ada": throwing renders error.tsx instead of
  // caching a 404 for the ISR window.
  if (kartuErr) throw new Error(`kos_kartu(${slug}): ${kartuErr.message}`);
  if (!kartu?.id) return null;
  const id = kartu.id;

  const [kosRes, kamarRes, penilaianRes, aturanRes, sekitarRes, mediaRes, catatanRes, skorRes, fasRes, kosFasRes] =
    await Promise.all([
      db.from("kos")
        .select("id, slug, nama, alamat, rt_rw, tipe, tier, jumlah_kamar, jumlah_lantai, ada_lift, tahun_bangunan, kontak_nama, whatsapp, penjaga, disurvei_pada, surveyor, ketersediaan_dikonfirmasi_pada, area(slug, nama, tipe)")
        .eq("id", id)
        .single(),
      db.from("tipe_kamar").select("*").eq("kos_id", id).order("total_bulanan"),
      db.from("kos_penilaian").select("*").eq("kos_id", id).maybeSingle(),
      db.from("kos_aturan").select("*").eq("kos_id", id).maybeSingle(),
      db.from("kos_sekitar").select("*").eq("kos_id", id).maybeSingle(),
      db.from("kos_media").select("*").eq("kos_id", id).order("urutan"),
      db.from("catatan_surveyor").select("*").eq("kos_id", id).maybeSingle(),
      db.from("kos_skor").select("*").eq("kos_id", id).maybeSingle(),
      db.from("fasilitas").select("*").order("kategori").order("nama"),
      db.from("kos_fasilitas").select("fasilitas(slug)").eq("kos_id", id),
    ]);
  if (kosRes.error) throw new Error(`kos(${slug}): ${kosRes.error.message}`);
  if (!kosRes.data) return null;

  const { area, ...kos } = kosRes.data;
  const total = kartu.total_bulanan ?? 0;
  const { data: kandidat } = await db
    .from("kos_kartu")
    .select("*")
    .eq("status", "tayang")
    .eq("area_slug", kartu.area_slug ?? "")
    .neq("id", id)
    .limit(12);
  // Same area, closest real total; prefer ±20 %.
  const serupa = (kandidat ?? [])
    .map((k) => ({ k, beda: Math.abs((k.total_bulanan ?? 0) - total) }))
    .sort((a, b) => a.beda - b.beda)
    .filter((x, i) => x.beda <= total * 0.2 || i < 3)
    .slice(0, 3)
    .map((x) => x.k);

  return {
    kartu,
    kos,
    area: area as DetailKosData["area"],
    tipeKamar: kamarRes.data ?? [],
    penilaian: penilaianRes.data,
    aturan: aturanRes.data,
    sekitar: sekitarRes.data,
    media: mediaRes.data ?? [],
    catatan: catatanRes.data,
    skor: skorRes.data,
    semuaFasilitas: fasRes.data ?? [],
    fasilitasKos: (kosFasRes.data ?? [])
      .map((r) => (r.fasilitas as { slug: string } | null)?.slug)
      .filter((s): s is string => Boolean(s)),
    serupa,
  };
}

/** Per-request memo so generateMetadata, the page and the OG image share one fetch. */
export const detailKos = cache((slug: string) => ambilDetailKos(supabaseServer(), slug));

/** Top strengths for metadata and cards, derived from survey scores only. */
export function kekuatanKos(d: Pick<DetailKosData, "skor" | "sekitar">): string[] {
  const hasil: string[] = [];
  if ((d.skor?.kebersihan ?? 0) >= 4) hasil.push("Bersih");
  if ((d.skor?.kedap ?? 0) >= 4) hasil.push("Kedap suara");
  if ((d.skor?.transparansi ?? 0) >= 4.5) hasil.push("Biaya transparan");
  if (d.sekitar?.landmark_menit_jalan != null && d.sekitar.landmark_menit_jalan <= 7) hasil.push("Dekat landmark");
  return hasil.slice(0, 2);
}
