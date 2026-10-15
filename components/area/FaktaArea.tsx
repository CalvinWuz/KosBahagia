import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { hrefCari } from "@/lib/cari-params";
import type { FaktaArea as Fakta, StatistikArea } from "@/lib/area/data";

const LISTRIK: Record<string, string> = {
  termasuk: "Termasuk sewa",
  token: "Token, isi sendiri",
  flat: "Flat per bulan",
  meteran: "Meteran",
};

/** What the median and the range are made of, in the words lib/biaya.ts uses on every card. */
export function teksDasarBiaya(f: Fakta["biaya"]): string {
  const bagian = [`${f.dihitung} kos dengan total ${f.estimasi > 0 ? "lengkap atau estimasi" : "lengkap"}`];
  if (f.belumLengkap > 0) bagian.push(`${f.belumLengkap} kos biayanya belum lengkap, tidak dihitung`);
  return bagian.join("; ");
}

// The numbers only we have, because we walked in. Every value is computed
// from the survey; nothing here is typed by hand. Cost and bathroom facts
// come from the area's own search (lib/area/fakta.ts), so they match what
// "Lihat N kos" shows: the room each kos shows there, priced the same way.
export function FaktaArea({ s, fakta, nama, slug }: { s: StatistikArea; fakta: Fakta; nama: string; slug: string }) {
  const { biaya } = fakta;
  const fakta6 = [
    { label: "Kos yang kami survei", nilai: `${fakta.jumlah}`, sub: `putra ${s.jumlah_putra}, putri ${s.jumlah_putri}, campur ${s.jumlah_campur}` },
    { label: "Total per bulan (median)", nilai: biaya.median != null ? formatRupiah(biaya.median) : "Belum bisa dihitung", sub: teksDasarBiaya(biaya) },
    {
      label: "Kisaran total",
      nilai: biaya.min != null && biaya.max != null ? `${formatRupiah(biaya.min)} – ${formatRupiah(biaya.max)}` : "Belum bisa dihitung",
      sub: "kamar yang tampil di pencarian tiap kos",
    },
    {
      label: "Kamar mandi dalam",
      nilai: `${fakta.kmDalam} dari ${fakta.jumlah} kos`,
      sub: "punya minimal satu tipe kamar dengan kamar mandi dalam",
      tautan: { href: hrefCari({ area: slug, fasilitas: ["kamar-mandi-dalam"] }), label: `Lihat ${fakta.kmDalam} kos` },
    },
    { label: "Listrik biasanya", nilai: s.model_listrik_umum ? (LISTRIK[s.model_listrik_umum] ?? s.model_listrik_umum) : "Belum kami catat", sub: "model yang paling sering" },
    { label: "Sekali makan di sekitar", nilai: s.rata_harga_makan ? formatRupiah(s.rata_harga_makan) : "Belum kami catat", sub: "rata-rata warung terdekat" },
  ];
  return (
    <section aria-labelledby="fakta-area">
      <h2 id="fakta-area" className="text-h2 text-arang-900">Angka {nama} dari survei kami</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fakta6.map((f) => (
          <div key={f.label} className="rounded-2xl border border-biru-100 bg-putih p-4">
            <dt className="text-micro text-arang-500">{f.label}</dt>
            <dd className="mt-1 text-body font-bold text-arang-900 tabular-nums">{f.nilai}</dd>
            <dd className="text-micro text-arang-500">{f.sub}</dd>
            {"tautan" in f && f.tautan && fakta.kmDalam > 0 && (
              <dd className="mt-1">
                <Link href={f.tautan.href} className="sentuh relative rounded-sm text-micro font-bold text-biru-600 hover:underline">
                  {f.tautan.label}
                </Link>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
