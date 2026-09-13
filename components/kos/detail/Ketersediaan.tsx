"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { restInsert, restSelect } from "@/lib/supabase/rest";
import { formatWaktuRelatif } from "@/lib/format";
import type { TipeKamar } from "@/lib/kos/detail";
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

// Block 11: rooms left per type, last confirmed, and the report button.
export function Ketersediaan({ kosId, data, sekarang }: { kosId: string; data: KetersediaanKos; sekarang: Date }) {
  const [status, setStatus] = useState<"diam" | "mengirim" | "terkirim" | "gagal">("diam");
  const total = data.kamar.reduce((a, k) => a + k.kamar_tersedia, 0);
  const basi = data.dikonfirmasiPada ? sekarang.getTime() - new Date(data.dikonfirmasiPada).getTime() > 30 * 86_400_000 : true;

  const lapor = async () => {
    setStatus("mengirim");
    const { error } = await restInsert("laporan_user", { kos_id: kosId, jenis: "penuh" });
    setStatus(error ? "gagal" : "terkirim");
  };

  return (
    <Blok id="ketersediaan" judul="Ketersediaan">
      <div className="rounded-2xl border border-biru-100 bg-putih p-4">
        <div className="flex flex-wrap items-center gap-2">
          {total === 0 ? <Badge tone="bahaya">Penuh</Badge> : <Badge tone="baik">{total} kamar tersedia</Badge>}
          {basi ? (
            <Badge tone="peringatan">Perlu dikonfirmasi</Badge>
          ) : (
            data.dikonfirmasiPada && <span className="text-small text-arang-500">Dikonfirmasi {formatWaktuRelatif(data.dikonfirmasiPada, sekarang)}</span>
          )}
        </div>
        {data.kamar.length > 1 && (
          <ul className="mt-3 divide-y divide-biru-100">
            {data.kamar.map((k) => (
              <li key={k.id} className="flex items-center justify-between py-2 text-small">
                <span className="text-arang-900">{k.nama}</span>
                <span className={cn("tabular-nums", k.kamar_tersedia === 0 ? "text-merah-700" : "text-arang-900")}>
                  {k.kamar_tersedia === 0 ? "Penuh" : `${k.kamar_tersedia} dari ${k.total_kamar} kamar`}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-col items-start gap-2 border-t border-biru-100 pt-3">
          {status === "terkirim" ? (
            <p className="text-small text-daun-700">Terima kasih. Kami cek ke pemilik dalam 1×24 jam dan perbarui halaman ini.</p>
          ) : (
            <>
              <p className="text-small text-arang-500">Sudah telepon dan ternyata penuh?</p>
              <Button variant="secondary" size="sm" onClick={lapor} loading={status === "mengirim"}>
                Kamarnya sudah penuh?
              </Button>
              {status === "gagal" && <p className="text-small text-merah-700">Laporan belum terkirim. Coba lagi.</p>}
            </>
          )}
        </div>
      </div>
    </Blok>
  );
}
