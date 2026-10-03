"use client";

import Link from "next/link";
import { IconCheck } from "@/components/ui/Icon";
import { PenandaDemo } from "@/components/ui/PenandaDemo";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { hitungBiaya, hitungUangMasuk, labelTotal, type TipeKamar } from "@/lib/biaya";
import type { InfoStatus } from "@/lib/kamar";
import { cn } from "@/lib/cn";
import { PilihKamar } from "./PilihKamar";

const TIPE: Record<string, string> = { putra: "Kos putra (khusus laki-laki)", putri: "Kos putri (khusus perempuan)", campur: "Kos campur (laki-laki dan perempuan)" };
const PASANGAN: Record<string, string> = { boleh: "pasangan boleh", tidak: "pasangan tidak boleh", surat_nikah: "pasangan boleh dengan surat nikah" };

// The scan-first summary: who it is for, which room, what it costs per month
// and to move in, whether that room is free, when it was checked, and the
// main pros and cons. Every line is computed from the sections below; the
// full detail stays one tap away.
export function RingkasanKeputusan({
  tipe,
  pasangan,
  tipeKamar,
  kamar,
  onPilih,
  status,
  dikonfirmasiPada,
  disurveiPada,
  surveyor,
  kelebihan,
  kekurangan,
  sekarang,
}: {
  tipe: string;
  pasangan: string | null;
  tipeKamar: TipeKamar[];
  kamar: TipeKamar | null;
  onPilih: (id: string) => void;
  status: InfoStatus | null;
  dikonfirmasiPada: string | null;
  disurveiPada: string | null;
  surveyor: string | null;
  kelebihan: string[];
  kekurangan: string[];
  sekarang: Date;
}) {
  const biaya = kamar ? hitungBiaya(kamar) : null;
  const masuk = kamar ? hitungUangMasuk(kamar) : null;

  return (
    <section id="ringkasan" aria-labelledby="ringkasan-judul" className="scroll-mt-28 rounded-2xl border border-biru-100 bg-putih p-4 lg:scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ringkasan-judul" className="text-h2 text-arang-900">Ringkasan</h2>
        <PenandaDemo />
      </div>

      {tipeKamar.length > 1 && (
        <PilihKamar
          tipeKamar={tipeKamar}
          terpilihId={kamar?.id ?? null}
          onPilih={onPilih}
          dikonfirmasiPada={dikonfirmasiPada}
          sekarang={sekarang}
          label="Pilih tipe kamar"
          className="mt-3"
        />
      )}

      <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
        <Baris label="Untuk">
          {TIPE[tipe] ?? tipe}
          {pasangan && <span className="block text-micro text-arang-500">{PASANGAN[pasangan] ?? pasangan}</span>}
        </Baris>
        <Baris label="Tipe kamar">
          {kamar ? kamar.nama : "Belum ada data kamar"}
          {kamar?.ukuran && <span className="block text-micro text-arang-500">{kamar.ukuran}</span>}
        </Baris>
        <Baris label={biaya ? labelTotal(biaya) : "Biaya bulanan"}>
          {biaya ? (
            <>
              <span className="font-bold tabular-nums">{formatRupiah(biaya.total)}</span>
              {!biaya.lengkap && <span className="block text-micro text-merah-700">{biaya.belumDiketahui.join(" dan ").toLowerCase()} belum diketahui</span>}
              {biaya.estimasi && biaya.lengkap && <span className="block text-micro text-arang-500">listrik sesuai pemakaian</span>}
            </>
          ) : (
            "Belum dicatat"
          )}
        </Baris>
        <Baris label="Uang masuk">
          {masuk ? (
            <>
              <span className="font-bold tabular-nums">{masuk.lengkap ? "" : "min. "}{formatRupiah(masuk.total)}</span>
              <span className="block text-micro text-arang-500">
                {masuk.bulanDimuka ? `${masuk.bulanDimuka} bulan di muka` : "bulan di muka belum diketahui"}
                {masuk.deposit > 0 ? " + deposit" : ""}
                {masuk.sekali.length ? " + biaya sekali bayar" : ""}
              </span>
            </>
          ) : (
            "Belum dicatat"
          )}
        </Baris>
        <Baris label="Ketersediaan tipe ini">
          {status ? (
            <>
              <span className={cn("font-bold", status.status === "tersedia" ? "text-daun-700" : status.status === "penuh" ? "text-merah-700" : "text-arang-900")}>{status.label}</span>
              <span className="block text-micro text-arang-500">{status.rincian}, {status.waktu}</span>
            </>
          ) : (
            "Belum dicatat"
          )}
        </Baris>
        <Baris label="Disurvei">
          {disurveiPada ? formatTanggal(disurveiPada) : "Belum disurvei"}
          {surveyor && <span className="block text-micro text-arang-500">oleh {surveyor}</span>}
        </Baris>
      </dl>

      {(kelebihan.length > 0 || kekurangan.length > 0) && (
        <div className="mt-3 grid gap-3 border-t border-biru-100 pt-3 sm:grid-cols-2">
          <div>
            <h3 className="text-small font-bold text-daun-700">Kelebihan utama</h3>
            {kelebihan.length ? (
              <ul className="mt-1 flex flex-col gap-1">
                {kelebihan.map((k) => (
                  <li key={k} className="flex gap-2 text-small text-arang-900">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-daun-700" />
                    {k}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-small text-arang-500">Tidak ada yang menonjol dari data kami.</p>
            )}
          </div>
          <div>
            <h3 className="text-small font-bold text-arang-900">Kekurangan utama</h3>
            {kekurangan.length ? (
              <ul className="mt-1 flex flex-col gap-1">
                {kekurangan.map((k) => (
                  <li key={k} className="flex gap-2 text-small text-arang-900">
                    <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-arang-500/10 text-micro font-bold text-arang-500">!</span>
                    {k}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-small text-arang-500">Tidak ada yang menonjol dari data kami.</p>
            )}
          </div>
        </div>
      )}
      <p className="mt-3 text-micro text-arang-500">
        Disusun otomatis dari data di bawah: <Link href="#biaya" className="font-bold text-biru-600 hover:underline">rincian biaya</Link> dan{" "}
        <Link href="#catatan" className="font-bold text-biru-600 hover:underline">catatan surveyor</Link>.
      </p>
    </section>
  );
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-biru-100 py-2 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
      <dt className="text-small text-arang-500">{label}</dt>
      <dd className="text-right text-small text-arang-900">{children}</dd>
    </div>
  );
}
