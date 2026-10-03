import { formatRupiah } from "@/lib/format";
import type { StatistikArea } from "@/lib/area/data";

const LISTRIK: Record<string, string> = {
  termasuk: "sudah termasuk sewa",
  token: "pakai token yang diisi sendiri",
  flat: "flat per bulan",
  meteran: "meteran, dibayar sesuai pemakaian",
};

export type Faq = { q: string; a: string };

// Questions in the words people actually type into Google; answers computed
// from the survey so they stay true after every revalidation.
export function faqArea(nama: string, s: StatistikArea): Faq[] {
  const faq: Faq[] = [
    {
      q: `Berapa harga kos di ${nama}?`,
      a: `Dari ${s.jumlah_kos} kos yang kami survei di ${nama}, total per bulan berkisar ${formatRupiah(s.min_total)} sampai ${formatRupiah(s.max_total)}, dengan median ${formatRupiah(s.median_total)}. Angka ini sudah termasuk listrik, air, dan biaya wajib lain, bukan sewa saja.`,
    },
    {
      q: `Kos di ${nama} ada yang bebas jam malam?`,
      a: s.jumlah_tanpa_jam_malam > 0
        ? `Ada. ${s.jumlah_tanpa_jam_malam} dari ${s.jumlah_kos} kos di ${nama} tidak memberlakukan jam malam. Gunakan filter "Bebas jam malam" untuk melihatnya.`
        : `Untuk saat ini semua kos yang kami survei di ${nama} punya jam malam. Aturan tiap kos tercantum di halaman detailnya.`,
    },
    {
      q: `Ada kos di ${nama} dengan kamar mandi dalam?`,
      a: `${s.persen_km_dalam}% kos di ${nama} punya kamar mandi di dalam kamar. Sisanya berbagi kamar mandi, biasanya untuk 3–5 kamar.`,
    },
    {
      q: `Listrik di kos ${nama} biasanya termasuk?`,
      a: s.model_listrik_umum
        ? `Yang paling umum di ${nama}, listrik ${LISTRIK[s.model_listrik_umum] ?? s.model_listrik_umum}. Di setiap halaman kos kami tulis modelnya dan estimasi biayanya; kalau estimasinya ada, angka itu sudah masuk ke total bulanan, dan kalau belum diketahui kami tulis begitu.`
        : `Kami mencatat model listrik tiap kos di halaman detailnya.`,
    },
    {
      q: `Berapa biaya makan di sekitar ${nama}?`,
      a: s.rata_harga_makan
        ? `Warung terdekat dari kos-kos di ${nama} rata-rata ${formatRupiah(s.rata_harga_makan)} sekali makan, menurut catatan surveyor kami.`
        : `Kami belum mencatat harga warung di area ini.`,
    },
    {
      q: `Ada kos putri di ${nama}?`,
      a: `Kami mencatat ${s.jumlah_putri} kos putri, ${s.jumlah_putra} kos putra, dan ${s.jumlah_campur} kos campur di ${nama}.`,
    },
  ];
  return faq;
}

export function FaqArea({ faq }: { faq: Faq[] }) {
  return (
    <section aria-labelledby="faq-area">
      <h2 id="faq-area" className="text-h2 text-arang-900">Yang sering ditanyakan</h2>
      <div className="mt-3 divide-y divide-biru-100 rounded-2xl border border-biru-100 bg-putih">
        {faq.map((f, i) => (
          <details key={f.q} open={i === 0} className="group px-4 py-3">
            <summary className="cursor-pointer list-none text-body font-bold text-arang-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {f.q}
                <span aria-hidden="true" className="text-arang-500 transition-transform duration-150 group-open:rotate-180">⌄</span>
              </span>
            </summary>
            <p className="mt-2 text-small text-arang-900">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
