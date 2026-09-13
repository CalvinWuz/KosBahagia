"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatWaktuRelatif } from "@/lib/format";
import type { Hasil } from "@/lib/mitra/aksi";
import { cn } from "@/lib/cn";

export type KamarEditor = { id: string; nama: string; kamar_tersedia: number; total_kamar: number };

// The most important owner screen: one big number per room type, − and +,
// a single Simpan. Usable with one thumb in under ten seconds.
export function EditorKetersediaan({
  kosNama,
  kamar,
  dikonfirmasiPada,
  simpan,
}: {
  kosNama: string;
  kamar: KamarEditor[];
  dikonfirmasiPada: string | null;
  simpan: (perubahan: Record<string, number>) => Promise<Hasil>;
}) {
  const [nilai, setNilai] = useState<Record<string, number>>(Object.fromEntries(kamar.map((k) => [k.id, k.kamar_tersedia])));
  const [status, setStatus] = useState<{ sibuk: boolean; hasil: Hasil | null }>({ sibuk: false, hasil: null });
  const ubah = (id: string, delta: number, maks: number) =>
    setNilai((v) => ({ ...v, [id]: Math.min(maks, Math.max(0, (v[id] ?? 0) + delta)) }));
  const adaPerubahan = kamar.some((k) => nilai[k.id] !== k.kamar_tersedia);

  const kirim = async () => {
    setStatus({ sibuk: true, hasil: null });
    const hasil = await simpan(nilai);
    setStatus({ sibuk: false, hasil });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1 text-arang-900">{kosNama}</h1>
        <p className="text-small text-arang-500">
          {dikonfirmasiPada ? `Terakhir dikonfirmasi ${formatWaktuRelatif(dikonfirmasiPada)}` : "Belum pernah dikonfirmasi"}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {kamar.map((k) => (
          <li key={k.id} className="flex items-center gap-3 rounded-2xl border border-arang-500/20 bg-putih p-4">
            <div className="min-w-0 flex-1">
              <p className="text-body font-bold text-arang-900">{k.nama}</p>
              <p className="text-small text-arang-500">kamar kosong dari {k.total_kamar}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => ubah(k.id, -1, k.total_kamar)}
                disabled={nilai[k.id] <= 0}
                aria-label={`Kurangi kamar kosong ${k.nama}`}
                className="grid size-14 place-items-center rounded-xl border-2 border-arang-500/30 bg-putih text-h1 text-arang-900 active:bg-biru-100 disabled:opacity-40"
              >
                −
              </button>
              <span className={cn("w-12 text-center text-display tabular-nums", nilai[k.id] === 0 ? "text-merah-700" : "text-arang-900")} aria-live="polite" aria-label={`${nilai[k.id]} kamar kosong`}>
                {nilai[k.id]}
              </span>
              <button
                type="button"
                onClick={() => ubah(k.id, 1, k.total_kamar)}
                disabled={nilai[k.id] >= k.total_kamar}
                aria-label={`Tambah kamar kosong ${k.nama}`}
                className="grid size-14 place-items-center rounded-xl border-2 border-arang-500/30 bg-putih text-h1 text-arang-900 active:bg-biru-100 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      {status.hasil && (
        <p role="status" className={cn("rounded-xl p-3 text-body font-bold", status.hasil.ok ? "bg-daun-100 text-daun-700" : "bg-merah-100 text-merah-700")}>
          {status.hasil.pesan}
        </p>
      )}

      <Button variant="primary" size="lg" className="h-16 w-full text-h2" loading={status.sibuk} onClick={kirim}>
        {adaPerubahan ? "Simpan" : "Simpan, masih sama"}
      </Button>
    </div>
  );
}
