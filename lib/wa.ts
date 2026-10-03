import { restInsert } from "@/lib/supabase/rest";
import { formatRupiah } from "@/lib/format";
import type { StatusKamar } from "@/lib/kamar";
import type { Database } from "@/lib/supabase/types";

export type SumberKlik = Database["public"]["Enums"]["sumber_klik"];

// The WhatsApp handoff. We are a bridge, not a broker: the message names the
// kos, the room type, its status and the same total the page shows, so both
// sides start from the same number. A full room asks when one frees up
// instead of pretending it is available.
export function pesanWa(opsi: {
  namaKos: string;
  tipeKamar?: string | null;
  totalBulanan: number;
  status?: StatusKamar;
  /** Total contains a usage-based estimate. */
  estimasi?: boolean;
  /** Names of monthly fees with no known amount. */
  belumDiketahui?: string[];
}): string {
  const kamar = opsi.tipeKamar ? `kamar tipe ${opsi.tipeKamar}` : "kamarnya";
  const total = `${opsi.estimasi ? "estimasi total" : "total"} ${formatRupiah(opsi.totalBulanan)} per bulan`;
  const tanyaBiaya = opsi.belumDiketahui?.length ? ` Berapa kira-kira biaya ${opsi.belumDiketahui.join(" dan ").toLowerCase()} per bulan?` : "";
  const awal = `Halo, saya lihat ${opsi.namaKos} di Kos Bahagia.`;
  if (opsi.status === "penuh") return `${awal} ${kapital(kamar)} tercatat penuh. Kira-kira kapan ada yang kosong?${tanyaBiaya}`;
  if (opsi.status === "belum_dikonfirmasi") return `${awal} Apakah ${kamar} masih ada yang kosong, dan apakah ${total} masih berlaku?${tanyaBiaya}`;
  return `${awal} Mau tanya ${kamar} dengan ${total}, masih tersedia?${tanyaBiaya}`;
}

const kapital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Button label for the room's status. */
export function labelTombolWa(status?: StatusKamar): string {
  if (status === "penuh") return "Tanya kapan tersedia";
  if (status === "belum_dikonfirmasi") return "Tanya ketersediaan";
  return "Chat pemilik";
}

export function linkWa(whatsapp: string, pesan: string): string {
  const nomor = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}

/**
 * Product rule 7: every handoff writes a klik_wa row. Fire-and-forget — it
 * must never delay or block the link from opening. Only the kos id, where
 * the click came from and the referring page are sent.
 */
export function catatKlikWa(kosId: string, sumber: SumberKlik) {
  try {
    void restInsert("klik_wa", { kos_id: kosId, sumber, referrer: document.referrer ? document.referrer.slice(0, 300) : null }).then(({ error }) => {
      if (error) console.warn("klik_wa gagal dicatat:", error.message);
    });
  } catch (e) {
    console.warn("klik_wa gagal dicatat:", e);
  }
}
