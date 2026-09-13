import { restInsert } from "@/lib/supabase/rest";
import { formatRupiah } from "@/lib/format";
import type { Database } from "@/lib/supabase/types";

export type SumberKlik = Database["public"]["Enums"]["sumber_klik"];

// The WhatsApp handoff. We are a bridge, not a broker: the link goes straight
// to the owner with a message that names the kos, the room type and the real
// total, so both sides start from the same number.
export function pesanWa(opsi: { namaKos: string; tipeKamar?: string | null; totalBulanan: number }): string {
  const kamar = opsi.tipeKamar ? ` kamar tipe ${opsi.tipeKamar}` : "";
  return (
    `Halo, saya lihat ${opsi.namaKos} di Kos Bahagia. ` +
    `Mau tanya${kamar} dengan total ${formatRupiah(opsi.totalBulanan)} per bulan, masih tersedia?`
  );
}

export function linkWa(whatsapp: string, pesan: string): string {
  const nomor = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}

/**
 * Product rule 7: every handoff writes a klik_wa row. Fire-and-forget — it
 * must never delay or block the link from opening.
 */
export function catatKlikWa(kosId: string, sumber: SumberKlik) {
  try {
    void restInsert("klik_wa", { kos_id: kosId, sumber, referrer: document.referrer || null }).then(({ error }) => {
      if (error) console.warn("klik_wa gagal dicatat:", error.message);
    });
  } catch (e) {
    console.warn("klik_wa gagal dicatat:", e);
  }
}
