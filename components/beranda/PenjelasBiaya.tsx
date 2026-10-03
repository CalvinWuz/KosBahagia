import { formatRupiah } from "@/lib/format";

// Why our numbers look higher than other sites: they are the real total.
// Two sentences of copy, no more.
const CONTOH = {
  sewa: 1_200_000,
  komponen: [
    { nama: "Listrik (estimasi)", jumlah: 250_000 },
    { nama: "Air", jumlah: 50_000 },
    { nama: "Sampah dan keamanan", jumlah: 50_000 },
  ],
};
const TOTAL = CONTOH.sewa + CONTOH.komponen.reduce((a, b) => a + b.jumlah, 0);

export function PenjelasBiaya() {
  return (
    <section aria-labelledby="penjelas-biaya" className="mx-auto w-full max-w-6xl px-4">
      <p className="text-micro font-bold text-biru-600">Angka yang jujur</p>
      <h2 id="penjelas-biaya" className="mt-1 text-h2 text-arang-900">
        Kenapa angka di sini terlihat lebih mahal?
      </h2>
      <p className="mt-1 max-w-2xl text-body text-arang-500">
        Situs lain menampilkan sewa saja. Kami menjumlahkan listrik, air, dan biaya wajib lain
        supaya angkanya sama dengan yang kamu bayar tiap bulan. Kalau listrik dibayar sesuai pemakaian,
        angkanya kami tulis sebagai estimasi; kalau ada biaya yang belum diketahui, kami tulis begitu.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <div className="rounded-2xl border border-dashed border-arang-500/40 bg-kertas-50 p-5">
          <p className="text-micro font-bold text-arang-500">Di situs lain</p>
          <p className="mt-2 text-price [overflow-wrap:anywhere] text-arang-500 tabular-nums">{formatRupiah(CONTOH.sewa)}</p>
          <p className="text-small text-arang-500">sewa saja, sisanya ketahuan setelah masuk</p>
        </div>

        <div className="relative rounded-2xl border-2 border-biru-500 bg-putih p-5">
          <span className="absolute -top-3 right-4 rounded-full bg-biru-500 px-2.5 py-0.5 text-micro font-bold text-putih">Yang kamu bayar</span>
          <p className="text-micro font-bold text-biru-600">Di Kos Bahagia</p>
          <p className="mt-2 text-price [overflow-wrap:anywhere] text-arang-900 tabular-nums">{formatRupiah(TOTAL)}</p>
          <p className="text-small text-arang-500">estimasi total per bulan, kamar yang sama (contoh hitungan)</p>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 border-t border-biru-100 pt-3 text-small">
            <dt className="text-arang-900">Sewa</dt>
            <dd className="tabular-nums">{formatRupiah(CONTOH.sewa)}</dd>
            {CONTOH.komponen.map((k) => (
              <KomponenBaris key={k.nama} nama={k.nama} jumlah={k.jumlah} />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function KomponenBaris({ nama, jumlah }: { nama: string; jumlah: number }) {
  return (
    <>
      <dt className="text-arang-500">+ {nama}</dt>
      <dd className="text-arang-500 tabular-nums">{formatRupiah(jumlah)}</dd>
    </>
  );
}
