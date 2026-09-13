import { formatRupiah } from "@/lib/format";
import type { StatistikArea } from "@/lib/area/data";

const LISTRIK: Record<string, string> = {
  termasuk: "Termasuk sewa",
  token: "Token, isi sendiri",
  flat: "Flat per bulan",
  meteran: "Meteran",
};

// The numbers only we have, because we walked in. Every value is computed
// from the survey; nothing here is typed by hand.
export function FaktaArea({ s, nama }: { s: StatistikArea; nama: string }) {
  const fakta = [
    { label: "Kos yang kami survei", nilai: `${s.jumlah_kos}`, sub: `putra ${s.jumlah_putra}, putri ${s.jumlah_putri}, campur ${s.jumlah_campur}` },
    { label: "Total per bulan (median)", nilai: formatRupiah(s.median_total), sub: "sudah termasuk listrik, air, biaya wajib" },
    { label: "Kisaran total", nilai: `${formatRupiah(s.min_total)} – ${formatRupiah(s.max_total)}`, sub: "kamar termurah tiap kos" },
    { label: "Kamar mandi dalam", nilai: `${s.persen_km_dalam}%`, sub: "dari kos di area ini" },
    { label: "Listrik biasanya", nilai: s.model_listrik_umum ? (LISTRIK[s.model_listrik_umum] ?? s.model_listrik_umum) : "Belum kami catat", sub: "model yang paling sering" },
    { label: "Sekali makan di sekitar", nilai: s.rata_harga_makan ? formatRupiah(s.rata_harga_makan) : "Belum kami catat", sub: "rata-rata warung terdekat" },
  ];
  return (
    <section aria-labelledby="fakta-area">
      <h2 id="fakta-area" className="text-h2 text-arang-900">Angka {nama} dari survei kami</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fakta.map((f) => (
          <div key={f.label} className="rounded-2xl border border-biru-100 bg-putih p-4">
            <dt className="text-micro text-arang-500">{f.label}</dt>
            <dd className="mt-1 text-body font-bold text-arang-900 tabular-nums">{f.nilai}</dd>
            <dd className="text-micro text-arang-500">{f.sub}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
