import type { Metadata } from "next";
import Link from "next/link";
import { EditorKetersediaan } from "@/components/mitra/EditorKetersediaan";
import { simpanViaTautan } from "@/lib/mitra/aksi";
import { dasarMitra } from "@/lib/mitra/dasar";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Konfirmasi ketersediaan" };
export const dynamic = "force-dynamic";

// The one-tap link from the Monday WhatsApp reminder. No login: the token
// itself is the permission, scoped to one kos, valid seven days.
export default async function HalamanTautan({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, dasar] = await Promise.all([params, dasarMitra()]);
  const { data } = await supabaseServer().rpc("baca_ketersediaan_via_tautan", { p_token: token });
  const baris = data ?? [];

  if (baris.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-h1 text-arang-900">Tautan sudah tidak berlaku</h1>
        <p className="mt-2 text-body text-arang-500">Tautan konfirmasi berlaku 7 hari. Masuk ke dashboard untuk memperbarui, atau tunggu pengingat WhatsApp berikutnya.</p>
        <Link href={`${dasar}/masuk`} className="mt-4 inline-block text-body font-bold text-biru-600 hover:underline">Masuk ke dashboard</Link>
      </div>
    );
  }

  const simpan = simpanViaTautan.bind(null, token);
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-16">
      <p className="rounded-xl bg-biru-100 px-3 py-2 text-small text-biru-600">Tekan − atau + kalau ada yang berubah, lalu Simpan. Kalau masih sama, langsung Simpan.</p>
      <EditorKetersediaan
        kosNama={baris[0].kos_nama}
        kamar={baris.map((b) => ({ id: b.tipe_kamar_id, nama: b.nama, kamar_tersedia: b.kamar_tersedia, total_kamar: b.total_kamar }))}
        dikonfirmasiPada={baris[0].dikonfirmasi_pada}
        simpan={simpan}
      />
    </div>
  );
}
