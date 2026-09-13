import { NextResponse } from "next/server";
import { mitraAdmin } from "@/lib/supabase/mitra";
import { kirimWa } from "@/lib/mitra/wa-kirim";

// Every Monday (vercel.json): owners whose availability is getting stale get
// a WhatsApp message with a one-tap link to confirm or update. The message
// is the mechanism; the dashboard is the fallback.
//
// Sends when the last confirmation is older than HARI_BASI days and no
// reminder went out in the last HARI_JEDA days. Every update made through
// the link is logged with sumber = bot_wa, so we can see which channel works.

const HARI_BASI = 21;
const HARI_JEDA = 6;
const MITRA_URL = process.env.NEXT_PUBLIC_MITRA_URL ?? "https://mitra.kosbahagia.com";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia || req.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = mitraAdmin();
  const batasBasi = new Date(Date.now() - HARI_BASI * 86_400_000).toISOString();
  const batasJeda = new Date(Date.now() - HARI_JEDA * 86_400_000).toISOString();

  const { data: kos, error } = await db
    .from("kos")
    .select("id, nama, owner_id, ketersediaan_dikonfirmasi_pada, owner:owner_id(nama, whatsapp)")
    .eq("status", "tayang")
    .not("owner_id", "is", null)
    .lt("ketersediaan_dikonfirmasi_pada", batasBasi);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: baruDiingatkan } = await db.from("pengingat_wa").select("kos_id").gte("dikirim_pada", batasJeda);
  const sudah = new Set((baruDiingatkan ?? []).map((r) => r.kos_id));

  const laporan: Array<{ kos: string; ke: string; dikirim: boolean; alasan?: string }> = [];
  for (const k of kos ?? []) {
    if (sudah.has(k.id)) continue;
    const owner = k.owner as { nama: string; whatsapp: string } | null;
    if (!owner?.whatsapp) continue;
    const { data: token } = await db.rpc("buat_tautan_ketersediaan", { p_kos_id: k.id });
    if (!token) continue;
    const pesan =
      `Halo ${owner.nama}, ini Kos Bahagia. Kamar kosong di ${k.nama} terakhir dikonfirmasi lebih dari ${HARI_BASI} hari lalu. ` +
      `Ketuk tautan ini untuk konfirmasi (10 detik, tanpa login): ${MITRA_URL}/t/${token} ` +
      `Kalau masih sama, cukup tekan Simpan. Terima kasih.`;
    const hasil = await kirimWa(owner.whatsapp, pesan);
    await db.from("pengingat_wa").insert({ kos_id: k.id, owner_id: k.owner_id, whatsapp: owner.whatsapp, pesan, status: hasil.dikirim ? "dikirim" : `gagal: ${hasil.alasan}` });
    laporan.push({ kos: k.nama, ke: owner.whatsapp, dikirim: hasil.dikirim, alasan: hasil.alasan });
  }

  return NextResponse.json({ diperiksa: kos?.length ?? 0, dikirim: laporan.filter((l) => l.dikirim).length, laporan });
}
