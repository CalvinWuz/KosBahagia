import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Chip } from "@/components/ui/Chip";
import { formatRupiah } from "@/lib/format";
import type { TipeKamar } from "@/lib/kos/detail";
import { Baris, BelumDicatat, Blok } from "./bagian";

export const LISTRIK: Record<string, string> = {
  termasuk: "Termasuk sewa",
  token: "Token, isi sendiri",
  flat: "Flat per bulan",
  meteran: "Meteran, tagihan sesuai pemakaian",
};
const DEPOSIT: Record<string, string> = {
  ya: "kembali penuh saat keluar",
  sebagian: "kembali sebagian",
  tidak: "tidak kembali",
};
const LAUNDRY: Record<string, string> = {
  termasuk: "Termasuk",
  tidak_ada: "Tidak ada",
  berbayar: "Berbayar",
};

type BiayaLain = { nama: string; jumlah: number; wajib?: boolean };

// Block 4: the real total up front, then every component. The electricity
// model is main content, never a tooltip.
export function RincianBiaya({ tipeKamar, terpilih, onPilih }: { tipeKamar: TipeKamar[]; terpilih: TipeKamar | null; onPilih: (id: string) => void }) {
  if (!terpilih) {
    return (
      <Blok id="biaya" judul="Rincian biaya">
        <BelumDicatat />
      </Blok>
    );
  }
  const k = terpilih;
  const biayaLain = (Array.isArray(k.biaya_lain) ? k.biaya_lain : []) as BiayaLain[];
  const listrikJumlah = k.model_listrik === "termasuk" ? 0 : (k.estimasi_listrik ?? 0);

  return (
    <Blok id="biaya" judul="Rincian biaya" keterangan="Angka besar adalah total yang kamu bayar tiap bulan.">
      {tipeKamar.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-2" aria-label="Tipe kamar">
          {tipeKamar.map((t) => (
            <li key={t.id}>
              <Chip selected={t.id === k.id} onClick={() => onPilih(t.id)}>
                {t.nama}
              </Chip>
            </li>
          ))}
        </ul>
      )}

      <p className="text-price text-arang-900 tabular-nums">
        {formatRupiah(k.total_bulanan ?? 0)}
        <span className="ml-1 text-small font-normal text-arang-500">/bulan, total sudah semua</span>
      </p>
      <p className="text-small text-arang-500">
        Kamar {k.nama}
        {k.ukuran ? `, ${k.ukuran}` : ""}
      </p>

      <Accordion className="mt-3">
        <AccordionItem title="Apa saja yang masuk hitungan" defaultOpen>
          <dl className="divide-y divide-biru-100">
            <Baris label="Sewa kamar">{formatRupiah(k.harga_bulanan)}</Baris>
            <Baris label="Listrik">
              <span className="block font-bold">{LISTRIK[k.model_listrik] ?? k.model_listrik}</span>
              {k.model_listrik !== "termasuk" && (
                <span className="block">
                  {k.estimasi_listrik != null ? `${k.model_listrik === "flat" ? "" : "estimasi "}${formatRupiah(k.estimasi_listrik)}` : <BelumDicatat />}
                </span>
              )}
            </Baris>
            <Baris label="Air">{k.biaya_air ? formatRupiah(k.biaya_air) : "Termasuk"}</Baris>
            {k.boleh_ac && (
              <Baris label="Biaya AC">{k.biaya_ac ? formatRupiah(k.biaya_ac) : "Tidak ada tambahan"}</Baris>
            )}
            {biayaLain.filter((b) => b.wajib !== false).map((b) => (
              <Baris key={b.nama} label={b.nama}>{formatRupiah(b.jumlah)}</Baris>
            ))}
            <div className="flex items-start justify-between gap-4 py-2">
              <dt className="text-small font-bold text-arang-900">Total per bulan</dt>
              <dd className="text-small font-bold text-arang-900 tabular-nums">{formatRupiah(k.total_bulanan ?? 0)}</dd>
            </div>
          </dl>
          {listrikJumlah > 0 && k.model_listrik !== "flat" && (
            <p className="mt-2 text-micro text-arang-500">Estimasi listrik dari surveyor untuk pemakaian normal; tagihan aslimu bisa beda.</p>
          )}
        </AccordionItem>
        <AccordionItem title="Biaya lain yang tidak masuk total">
          <dl className="divide-y divide-biru-100">
            <Baris label="Parkir motor">
              {k.parkir_motor ? (k.biaya_parkir_motor ? `${formatRupiah(k.biaya_parkir_motor)}/bulan` : "Ada, gratis") : "Tidak ada"}
            </Baris>
            <Baris label="Parkir mobil">
              {k.parkir_mobil ? (k.biaya_parkir_mobil ? `${formatRupiah(k.biaya_parkir_mobil)}/bulan` : "Ada, gratis") : "Tidak ada"}
            </Baris>
            <Baris label="Laundry">
              {LAUNDRY[k.laundry] ?? k.laundry}
              {k.laundry === "berbayar" && k.biaya_laundry ? `, ${formatRupiah(k.biaya_laundry)}/kg` : ""}
            </Baris>
            {biayaLain.filter((b) => b.wajib === false).map((b) => (
              <Baris key={b.nama} label={b.nama}>{formatRupiah(b.jumlah)}</Baris>
            ))}
            <Baris label="Deposit">
              {k.deposit > 0 ? (
                <>
                  {formatRupiah(k.deposit)}
                  {k.deposit_kembali ? `, ${DEPOSIT[k.deposit_kembali]}` : ""}
                </>
              ) : (
                "Tidak ada"
              )}
            </Baris>
            <Baris label="Durasi minimal">{k.durasi_minimal} bulan</Baris>
            {k.harga_tahunan != null && <Baris label="Bayar tahunan">{formatRupiah(k.harga_tahunan)}/tahun</Baris>}
          </dl>
        </AccordionItem>
      </Accordion>
    </Blok>
  );
}
