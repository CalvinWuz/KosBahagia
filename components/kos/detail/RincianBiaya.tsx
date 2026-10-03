"use client";

import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { hitungBiaya, hitungUangMasuk, labelTotal, type ItemBiaya, type SifatBiaya, type TipeKamar } from "@/lib/biaya";
import { Baris, BelumDicatat, Blok } from "./bagian";
import { PilihKamar } from "./PilihKamar";

const DEPOSIT: Record<string, string> = {
  ya: "kembali penuh",
  sebagian: "kembali sebagian",
  tidak: "tidak kembali",
};
const SIFAT: Record<SifatBiaya, string> = {
  sewa: "",
  tetap: "tetap",
  pemakaian: "estimasi pemakaian",
  termasuk: "termasuk sewa",
  belum_diketahui: "belum diketahui",
  opsional: "kalau dipakai",
};

function Nilai({ item }: { item: ItemBiaya }) {
  if (item.sifat === "belum_diketahui") return <span className="font-bold text-merah-700">Belum diketahui</span>;
  if (item.sifat === "termasuk") return <span>{item.keterangan ?? "Termasuk sewa"}</span>;
  return (
    <span className="tabular-nums">
      {item.jumlah != null ? formatRupiah(item.jumlah) : <BelumDicatat />}
      {item.sifat === "opsional" && item.keterangan && item.jumlah ? ` ${item.keterangan}` : ""}
      {item.sifat === "opsional" && item.jumlah === 0 ? " (gratis)" : ""}
    </span>
  );
}

function LabelItem({ item }: { item: ItemBiaya }) {
  const sifat = SIFAT[item.sifat];
  return (
    <span>
      {item.nama}
      {sifat && item.sifat !== "termasuk" && item.sifat !== "belum_diketahui" && <span className="block text-micro text-arang-500">{sifat}{item.keterangan && item.sifat !== "opsional" ? `, ${item.keterangan.toLowerCase()}` : ""}</span>}
      {item.sifat === "belum_diketahui" && item.keterangan && <span className="block text-micro text-arang-500">{item.keterangan}</span>}
    </span>
  );
}

// Block 4: the selected room's monthly total, every component with what kind
// of cost it is, then the cash needed to move in. Fixed fees, usage-based
// estimates, included items, unknown amounts and optional spend are labelled
// separately; an unknown amount is never shown as Rp0.
export function RincianBiaya({
  tipeKamar,
  terpilih,
  onPilih,
  dikonfirmasiPada,
  sekarang,
}: {
  tipeKamar: TipeKamar[];
  terpilih: TipeKamar | null;
  onPilih: (id: string) => void;
  dikonfirmasiPada: string | null;
  sekarang: Date;
}) {
  if (!terpilih) {
    return (
      <Blok id="biaya" judul="Rincian biaya">
        <BelumDicatat />
      </Blok>
    );
  }
  const k = terpilih;
  const biaya = hitungBiaya(k);
  const masuk = hitungUangMasuk(k);

  return (
    <Blok id="biaya" judul="Rincian biaya" keterangan={`Untuk kamar ${k.nama}${k.ukuran ? `, ${k.ukuran}` : ""}. Ganti tipe kamar untuk melihat biayanya.`}>
      <PilihKamar tipeKamar={tipeKamar} terpilihId={k.id} onPilih={onPilih} dikonfirmasiPada={dikonfirmasiPada} sekarang={sekarang} className="mb-4" />

      <p className="text-small font-bold text-arang-500">{labelTotal(biaya)}</p>
      <p className="text-price text-arang-900 tabular-nums">
        {formatRupiah(biaya.total)}
        <span className="ml-1 text-small font-normal text-arang-500">/bulan</span>
      </p>
      {!biaya.lengkap && (
        <p className="mt-1 rounded-xl bg-merah-100 px-3 py-2 text-small text-merah-700">
          Belum termasuk {biaya.belumDiketahui.join(" dan ").toLowerCase()}: nominalnya belum diketahui, jadi total sebenarnya lebih besar dari angka ini. Tanyakan ke pemilik sebelum memutuskan.
        </p>
      )}
      {biaya.estimasi && biaya.lengkap && (
        <p className="mt-1 text-small text-arang-500">Listrik dibayar sesuai pemakaian; angkanya estimasi surveyor untuk pemakaian normal.</p>
      )}
      {k.harga_dikonfirmasi_pada && <p className="mt-1 text-micro text-arang-500">Harga dicek {formatTanggal(k.harga_dikonfirmasi_pada)}.</p>}

      <Accordion className="mt-3">
        <AccordionItem title="Apa saja yang masuk hitungan" defaultOpen>
          <dl className="divide-y divide-biru-100">
            {biaya.bulanan.map((item) => (
              <div key={item.nama} className="flex items-start justify-between gap-4 py-2">
                <dt className="text-small text-arang-500"><LabelItem item={item} /></dt>
                <dd className="text-right text-small text-arang-900"><Nilai item={item} /></dd>
              </div>
            ))}
            <div className="flex items-start justify-between gap-4 py-2">
              <dt className="text-small font-bold text-arang-900">{labelTotal(biaya)}</dt>
              <dd className="text-small font-bold text-arang-900 tabular-nums">{formatRupiah(biaya.total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-micro text-arang-500">
            Biaya di luar sewa: {Math.round(biaya.porsiTambahan * 100)}% dari total. Ini informasi saja; Skor Bahagia menilai seberapa jelas biayanya disebutkan, bukan seberapa besar.
          </p>
        </AccordionItem>

        <AccordionItem title="Uang yang perlu disiapkan untuk masuk" defaultOpen>
          <dl className="divide-y divide-biru-100">
            <Baris label={masuk.bulanDimuka == null ? "Bayar di muka (bulan belum diketahui, dihitung 1 bulan)" : `Bayar di muka ${masuk.bulanDimuka} bulan`}>
              <span className="tabular-nums">
                {masuk.bulanDimuka != null && masuk.bulanDimuka > 1 ? `${masuk.bulanDimuka} × ${formatRupiah(biaya.total)} = ` : ""}
                {formatRupiah(masuk.bayarDimuka)}
              </span>
            </Baris>
            <Baris label="Deposit">
              {masuk.deposit > 0 ? (
                <span className="tabular-nums">
                  {formatRupiah(masuk.deposit)}
                  {masuk.depositKembali && <span className="block text-micro text-arang-500">{DEPOSIT[masuk.depositKembali]}</span>}
                </span>
              ) : (
                "Tidak ada"
              )}
            </Baris>
            {masuk.sekali.map((s) => (
              <Baris key={s.nama} label={`${s.nama} (sekali bayar)`}>
                {s.jumlah == null ? <span className="font-bold text-merah-700">Belum diketahui</span> : <span className="tabular-nums">{formatRupiah(s.jumlah)}</span>}
              </Baris>
            ))}
            <div className="flex items-start justify-between gap-4 py-2">
              <dt className="text-small font-bold text-arang-900">
                {masuk.lengkap ? (masuk.estimasi ? "Estimasi uang masuk" : "Total uang masuk") : "Uang masuk, paling sedikit"}
              </dt>
              <dd className="text-small font-bold text-arang-900 tabular-nums">{formatRupiah(masuk.total)}</dd>
            </div>
          </dl>
          <ul className="mt-2 flex flex-col gap-1 text-micro text-arang-500">
            <li>Kontrak minimal {masuk.durasiMinimal} bulan. Ini lama tinggal, bukan jumlah bulan yang dibayar di muka.</li>
            {masuk.deposit > 0 && <li>Pengembalian deposit: {masuk.ketentuanDeposit ?? "ketentuannya belum kami catat, tanyakan ke pemilik."}</li>}
            {!masuk.lengkap && <li>Belum diketahui: {masuk.belumDiketahui.join(", ")}.</li>}
            <li>Setiap komponen dihitung sekali; deposit tidak termasuk sewa.</li>
          </ul>
        </AccordionItem>

        {biaya.opsional.length > 0 && (
          <AccordionItem title="Biaya kalau dipakai (tidak masuk total)">
            <dl className="divide-y divide-biru-100">
              {biaya.opsional.map((item) => (
                <div key={item.nama} className="flex items-start justify-between gap-4 py-2">
                  <dt className="text-small text-arang-500">{item.nama}</dt>
                  <dd className="text-right text-small text-arang-900"><Nilai item={item} /></dd>
                </div>
              ))}
              {k.harga_tahunan != null && <Baris label="Bayar tahunan">{formatRupiah(k.harga_tahunan)}/tahun</Baris>}
            </dl>
          </AccordionItem>
        )}
      </Accordion>
    </Blok>
  );
}
