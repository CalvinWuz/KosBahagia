"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mitraServer } from "@/lib/supabase/mitra";
import { supabaseServer } from "@/lib/supabase/server";
import { dasarMitra } from "./dasar";

export type Hasil = { ok: true; pesan?: string } | { ok: false; pesan: string };

const nomorWa = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.startsWith("62") ? d : d.startsWith("0") ? `62${d.slice(1)}` : `62${d}`;
};

// ---------------------------------------------------------------- pendaftaran
export async function daftarMitra(_: Hasil | null, form: FormData): Promise<Hasil> {
  const nama = String(form.get("nama") ?? "").trim();
  const whatsapp = nomorWa(String(form.get("whatsapp") ?? ""));
  const nama_kos = String(form.get("nama_kos") ?? "").trim();
  const alamat = String(form.get("alamat") ?? "").trim();
  const jumlah_kamar = Number(form.get("jumlah_kamar"));
  if (!nama || !nama_kos || !alamat) return { ok: false, pesan: "Nama, nama kos, dan alamat harus diisi." };
  if (!/^62[0-9]{8,13}$/.test(whatsapp)) return { ok: false, pesan: "Nomor WhatsApp belum benar. Contoh: 0812 3456 7890." };
  if (!Number.isInteger(jumlah_kamar) || jumlah_kamar < 1 || jumlah_kamar > 500) return { ok: false, pesan: "Jumlah kamar harus antara 1 dan 500." };
  const { error } = await supabaseServer().from("pendaftaran_mitra").insert({ nama, whatsapp, nama_kos, alamat, jumlah_kamar });
  if (error) return { ok: false, pesan: "Pendaftaran belum terkirim. Coba lagi sebentar lagi." };
  return { ok: true };
}

// ---------------------------------------------------------------- auth
/** After the OTP is verified: make sure an owner row exists (name from the application if any). */
export async function pastikanOwner(): Promise<Hasil> {
  const db = await mitraServer();
  const { data } = await db.auth.getUser();
  if (!data.user) return { ok: false, pesan: "Belum masuk." };
  const { data: ada } = await db.from("owner").select("id").eq("id", data.user.id).maybeSingle();
  if (ada) return { ok: true };
  const whatsapp = (data.user.phone ?? "").replace(/\D/g, "");
  const { error } = await db.from("owner").insert({ id: data.user.id, nama: "Pemilik kos", whatsapp: whatsapp || "62" });
  return error ? { ok: false, pesan: error.message } : { ok: true };
}

export async function keluar() {
  const db = await mitraServer();
  await db.auth.signOut();
  redirect(`${await dasarMitra()}/`);
}

// ---------------------------------------------------------------- ketersediaan
/** perubahan: { [tipe_kamar_id]: kamar_tersedia }. No change → confirm "still the same". */
export async function simpanKetersediaan(kosId: string, perubahan: Record<string, number>): Promise<Hasil> {
  const db = await mitraServer();
  const { data: sekarang } = await db.from("tipe_kamar").select("id, kamar_tersedia, total_kamar").eq("kos_id", kosId);
  if (!sekarang?.length) return { ok: false, pesan: "Kos tidak ditemukan." };
  let berubah = 0;
  for (const t of sekarang) {
    const baru = perubahan[t.id];
    if (baru == null || baru === t.kamar_tersedia) continue;
    const { error } = await db.from("tipe_kamar").update({ kamar_tersedia: Math.min(Math.max(baru, 0), t.total_kamar) }).eq("id", t.id);
    if (error) return { ok: false, pesan: "Perubahan belum tersimpan. Coba lagi." };
    berubah++;
  }
  if (berubah === 0) {
    const { error } = await db.rpc("konfirmasi_ketersediaan", { p_kos_id: kosId });
    if (error) return { ok: false, pesan: "Konfirmasi belum tersimpan. Coba lagi." };
  }
  revalidatePath("/mitra/dashboard");
  revalidatePath("/mitra/dashboard/ketersediaan");
  return { ok: true, pesan: berubah ? `Tersimpan. ${berubah} tipe kamar diperbarui.` : "Tersimpan. Ketersediaan dikonfirmasi masih sama." };
}

export async function simpanViaTautan(token: string, perubahan: Record<string, number>): Promise<Hasil> {
  const { error } = await supabaseServer().rpc("perbarui_ketersediaan_via_tautan", { p_token: token, p_perubahan: perubahan });
  if (error) return { ok: false, pesan: "Tautan sudah tidak berlaku. Minta tautan baru lewat WhatsApp atau masuk ke dashboard." };
  return { ok: true, pesan: "Tersimpan. Terima kasih sudah mengonfirmasi." };
}

// ---------------------------------------------------------------- edit kos
export type DataEditKos = {
  deskripsi: string;
  kamar: Array<{ id: string; harga_bulanan: number; deposit: number; harga_tahunan: number | null }>;
  aturan: {
    jam_malam: string | null;
    tamu: "boleh" | "ruang_tamu" | "tidak";
    lawan_jenis: "boleh" | "ruang_tamu" | "tidak";
    pasangan: "boleh" | "tidak" | "surat_nikah";
    anak: boolean;
    hewan: boolean;
    masak_di_kamar: boolean;
    merokok: "kamar" | "luar" | "dilarang";
  };
};

export async function simpanKos(kosId: string, data: DataEditKos): Promise<Hasil> {
  const db = await mitraServer();
  const { error: e1 } = await db.from("kos").update({ deskripsi: data.deskripsi.trim() || null }).eq("id", kosId);
  if (e1) return { ok: false, pesan: "Deskripsi belum tersimpan." };
  for (const k of data.kamar) {
    if (!Number.isInteger(k.harga_bulanan) || k.harga_bulanan <= 0) return { ok: false, pesan: "Harga sewa harus lebih dari 0." };
    const { error } = await db.from("tipe_kamar").update({ harga_bulanan: k.harga_bulanan, deposit: Math.max(0, k.deposit), harga_tahunan: k.harga_tahunan }).eq("id", k.id).eq("kos_id", kosId);
    if (error) return { ok: false, pesan: "Harga belum tersimpan." };
  }
  const { error: e3 } = await db.from("kos_aturan").upsert({ kos_id: kosId, ...data.aturan }, { onConflict: "kos_id" });
  if (e3) return { ok: false, pesan: "Aturan belum tersimpan." };
  revalidatePath(`/mitra/dashboard/kos/${kosId}`);
  revalidatePath(`/kos`, "layout");
  return { ok: true, pesan: "Tersimpan." };
}

export async function ajukanKoreksi(kosId: string, bidang: string, pesan: string): Promise<Hasil> {
  const db = await mitraServer();
  const { data } = await db.auth.getUser();
  if (!data.user) return { ok: false, pesan: "Belum masuk." };
  if (!pesan.trim()) return { ok: false, pesan: "Tulis apa yang perlu dikoreksi." };
  const { error } = await db.from("permintaan_koreksi").insert({ kos_id: kosId, owner_id: data.user.id, bidang, pesan: pesan.trim() });
  if (error) return { ok: false, pesan: "Permintaan belum terkirim." };
  revalidatePath(`/mitra/dashboard/kos/${kosId}`);
  return { ok: true, pesan: "Terkirim. Tim survei kami akan mengecek dan menghubungi Anda." };
}

export async function tambahFoto(kosId: string, url: string, lebar: number, tinggi: number, keterangan: string | null): Promise<Hasil> {
  const db = await mitraServer();
  const { data: ada } = await db.from("kos_media").select("urutan").eq("kos_id", kosId).order("urutan", { ascending: false }).limit(1);
  const urutan = (ada?.[0]?.urutan ?? -1) + 1;
  const { error } = await db.from("kos_media").insert({ kos_id: kosId, jenis: "foto", url, lebar, tinggi, keterangan, urutan });
  if (error) return { ok: false, pesan: "Foto belum tersimpan." };
  revalidatePath(`/mitra/dashboard/kos/${kosId}`);
  return { ok: true };
}

export async function hapusFoto(kosId: string, mediaId: string): Promise<Hasil> {
  const db = await mitraServer();
  const { error } = await db.from("kos_media").delete().eq("id", mediaId).eq("kos_id", kosId).eq("jenis", "foto");
  if (error) return { ok: false, pesan: "Foto belum terhapus." };
  revalidatePath(`/mitra/dashboard/kos/${kosId}`);
  return { ok: true };
}
