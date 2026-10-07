import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { LangkahPanduan } from "@/components/panduan/LangkahPanduan";
import { TampilkanPanduanLagi } from "@/components/panduan/TampilkanPanduanLagi";
import { MODE_DEMO, TEKS_DEMO } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Cara menggunakan",
  description: "Tiga langkah memakai Kos Bahagia: cari dan atur kebutuhan, cek biaya dan kondisi lalu simpan, bandingkan lalu hubungi pemilik.",
  alternates: { canonical: "/cara-menggunakan" },
};

// The full new-user guide, always one tap away in the menu. Static: it only
// describes what the site does today.
export default function CaraMenggunakan() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 pb-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-display wrap-break-word text-arang-900">Cara menggunakan Kos Bahagia</h1>
        <p className="text-body text-arang-900">
          Tiga langkah dari mencari sampai menghubungi pemilik. Tidak perlu akun: simpanan dan perbandinganmu tersimpan di perangkat ini dan tidak dikirim ke server kami.
        </p>
      </header>

      <section aria-labelledby="langkah">
        <h2 id="langkah" className="sr-only">Tiga langkah</h2>
        <LangkahPanduan />
      </section>

      <section aria-labelledby="angka" className="flex flex-col gap-2">
        <h2 id="angka" className="text-h2 text-arang-900">Membaca angka di kartu dan halaman kos</h2>
        <ul className="flex flex-col gap-2 text-small text-arang-900">
          <li><b>Total per bulan</b>: sewa ditambah biaya wajib yang nominalnya diketahui. <b>Estimasi</b> berarti ada listrik sesuai pemakaian; <b>Total sementara</b> berarti ada biaya yang belum diketahui dan namanya selalu ditulis.</li>
          <li><b>Skor Bahagia /10</b>: gabungan lima komponen survei. <b>Kebersihan /5</b> dan <b>Kedap suara /5</b> dinilai dengan rubrik; makin tinggi makin baik.</li>
          <li><b>Jarak</b>: di hasil pencarian kampus atau stasiun, jaraknya garis lurus ke titik itu. Menit jalan kaki dicatat surveyor dari patokan terdekat.</li>
          <li>Setiap angka punya tombol penjelasan di dekatnya, misalnya <b>Arti skor</b> dan <b>Cara jarak dihitung</b>.</li>
        </ul>
        {MODE_DEMO && <p className="rounded-2xl border border-arang-500/30 bg-putih p-3 text-small text-arang-900">{TEKS_DEMO.penjelasan}</p>}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/cari" className={buttonClasses({ variant: "primary" })}>Mulai cari kos</Link>
        <Link href="/cara-kami-menilai" className={buttonClasses({ variant: "secondary" })}>Cara kami menilai</Link>
      </div>

      <TampilkanPanduanLagi />
    </article>
  );
}
