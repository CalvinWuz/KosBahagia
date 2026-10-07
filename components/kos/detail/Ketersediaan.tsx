"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { restInsert, restSelect } from "@/lib/supabase/rest";
import { statusKamar } from "@/lib/kamar";
import type { TipeKamar } from "@/lib/biaya";
import { cn } from "@/lib/cn";
import { Blok } from "./bagian";

export type KetersediaanKos = {
  kamar: Array<Pick<TipeKamar, "id" | "nama" | "kamar_tersedia" | "total_kamar">>;
  dikonfirmasiPada: string | null;
};

/** Fetches live availability; the page itself is static. */
export function useKetersediaan(kosId: string, awal: KetersediaanKos): KetersediaanKos {
  const [segar, setSegar] = useState<KetersediaanKos | null>(null);
  useEffect(() => {
    let batal = false;
    Promise.all([
      restSelect("tipe_kamar", { select: "id,nama,kamar_tersedia,total_kamar", kos_id: `eq.${kosId}`, order: "total_bulanan.asc" }),
      restSelect("kos", { select: "ketersediaan_dikonfirmasi_pada", id: `eq.${kosId}` }),
    ])
      .then(([kamar, kos]) => {
        if (batal || !kamar.data) return;
        setSegar({ kamar: kamar.data, dikonfirmasiPada: kos.data?.[0]?.ketersediaan_dikonfirmasi_pada ?? null });
      })
      .catch(() => {
        // Keep the server values.
      });
    return () => {
      batal = true;
    };
  }, [kosId]);
  return segar ?? awal;
}

// Block 11: availability per room type (the selected one first and marked),
// the kos-wide count kept separate, when it was last confirmed, and the
// report button.
export function Ketersediaan({ kosId, data, terpilihId, sekarang }: { kosId: string; data: KetersediaanKos; terpilihId: string | null; sekarang: Date }) {
  const [status, setStatus] = useState<"diam" | "mengirim" | "terkirim" | "gagal">("diam");
  const totalKos = data.kamar.reduce((a, k) => a + k.kamar_tersedia, 0);
  const urut = [...data.kamar].sort((a, b) => Number(b.id === terpilihId) - Number(a.id === terpilihId));
  const terpilih = urut[0] && urut[0].id === terpilihId ? urut[0] : null;
  const statusTerpilih = terpilih ? statusKamar(terpilih, data.dikonfirmasiPada, sekarang) : null;

  const lapor = async () => {
    setStatus("mengirim");
    const { error } = await restInsert("laporan_user", { kos_id: kosId, jenis: "penuh", catatan: terpilih ? `Tipe: ${terpilih.nama}`.slice(0, 200) : null });
    setStatus(error ? "gagal" : "terkirim");
  };

  return (
    <Blok id="ketersediaan" judul="Ketersediaan" keterangan="Per tipe kamar. Kamar kosong di tipe lain tidak berarti tipe pilihanmu tersedia.">
      <div className="rounded-2xl border border-biru-100 bg-putih p-4">
        <ul className="divide-y divide-biru-100">
          {urut.map((k) => {
            const s = statusKamar(k, data.dikonfirmasiPada, sekarang);
            const dipilih = k.id === terpilihId;
            return (
              <li key={k.id} className={cn("flex flex-wrap items-center justify-between gap-2 py-2 text-small", dipilih && "font-bold")}>
                <span className="text-arang-900">
                  {k.nama}
                  {dipilih && <span className="ml-2 text-micro font-bold text-biru-600">pilihanmu</span>}
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={s.status === "tersedia" ? "baik" : s.status === "penuh" ? "bahaya" : "peringatan"}>{s.label}</Badge>
                  <span className="text-arang-500 tabular-nums">{s.rincian}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 border-t border-biru-100 pt-2 text-small text-arang-500">
          Seluruh kos: {totalKos} kamar kosong dari {data.kamar.length} tipe. {statusTerpilih ? `Status ${statusTerpilih.waktu}.` : ""}
        </p>
        <div className="mt-3 flex flex-col items-start gap-2 border-t border-biru-100 pt-3">
          {status === "terkirim" ? (
            <p className="text-small text-daun-700" role="status">Terima kasih. Kami cek ke pemilik dalam 1×24 jam dan perbarui halaman ini.</p>
          ) : (
            <>
              <p className="text-small text-arang-500">Sudah telepon dan ternyata penuh?</p>
              <Button variant="secondary" size="sm" bungkus onClick={lapor} loading={status === "mengirim"}>
                Laporkan kamar sudah penuh
              </Button>
              {status === "gagal" && <p className="text-small text-merah-700" role="alert">Laporan belum terkirim. Coba lagi sebentar lagi.</p>}
              <p className="text-micro text-arang-500">Yang dikirim hanya kos ini, tipe kamarnya, dan jenis laporan. Tanpa nama atau nomor kamu.</p>
            </>
          )}
        </div>
      </div>
    </Blok>
  );
}
