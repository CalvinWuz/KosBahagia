import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { mitraServer } from "@/lib/supabase/mitra";
import { dasarMitra } from "./dasar";

type Tabel = Database["public"]["Tables"];
export type Owner = Tabel["owner"]["Row"];
export type TipeKamarMitra = Pick<Tabel["tipe_kamar"]["Row"], "id" | "nama" | "kamar_tersedia" | "total_kamar" | "harga_bulanan" | "total_bulanan" | "deposit" | "harga_tahunan">;
export type KosMitra = Pick<Tabel["kos"]["Row"], "id" | "slug" | "nama" | "tier" | "status" | "ketersediaan_dikonfirmasi_pada" | "disurvei_pada" | "surveyor" | "deskripsi"> & {
  tipe_kamar: TipeKamarMitra[];
};

export type SesiMitra = { user: User; owner: Owner | null; kos: KosMitra[] };

/** Current owner session, or null when signed out. */
export async function sesiMitra(): Promise<SesiMitra | null> {
  const db = await mitraServer();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const [{ data: owner }, { data: kos }] = await Promise.all([
    db.from("owner").select("*").eq("id", data.user.id).maybeSingle(),
    db.from("kos")
      .select("id, slug, nama, tier, status, ketersediaan_dikonfirmasi_pada, disurvei_pada, surveyor, deskripsi, tipe_kamar(id, nama, kamar_tersedia, total_kamar, harga_bulanan, total_bulanan, deposit, harga_tahunan)")
      .eq("owner_id", data.user.id)
      .order("nama"),
  ]);
  return {
    user: data.user,
    owner,
    kos: ((kos ?? []) as KosMitra[]).map((k) => ({ ...k, tipe_kamar: [...k.tipe_kamar].sort((a, b) => (a.total_bulanan ?? 0) - (b.total_bulanan ?? 0)) })),
  };
}

/** Dashboard pages: bounce to the sign-in page when there is no session. */
export async function wajibSesi(next: string): Promise<SesiMitra> {
  const sesi = await sesiMitra();
  if (!sesi) redirect(`${await dasarMitra()}/masuk?next=${encodeURIComponent(next)}`);
  return sesi;
}

export const AWAL_BULAN = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
