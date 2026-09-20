import type { Metadata } from "next";
import Link from "next/link";
import { BOBOT } from "@/lib/scoring";
import { SKALA_KEBERSIHAN, SKALA_KEDAP, SKALA_SELISIH_DB, type Tingkat } from "@/lib/skala";

export const metadata: Metadata = {
  title: "Cara kami menilai",
  description: "Rubrik survei Kos Bahagia: apa yang kami ukur di lokasi, bagaimana Skor Bahagia dihitung, dan mengapa paket berbayar tidak bisa mengubahnya.",
  alternates: { canonical: "/cara-kami-menilai" },
};

const KOMPONEN = [
  { nama: "Kebersihan", bobot: BOBOT.kebersihan, cara: "Surveyor menilai kamar mandi, dapur bersama, dan koridor masing-masing 1–5 dengan rubrik tetap (bau, jamur, nat keramik, sampah, kondisi lantai). Skornya rata-rata dari yang ada; kalau kurang dari dua yang bisa dinilai, komponen ini kosong." },
  { nama: "Kedap suara", bobot: BOBOT.kedap, cara: "Kami catat material tembok, lalu ukur desibel saat sunyi dan saat ada suara dari kamar sebelah dengan alat ukur. Selisihnya, bersama material, menentukan skor 1–5." },
  { nama: "Transparansi biaya", bobot: BOBOT.transparansi, cara: "Berapa persen dari total bulanan yang tidak tampak di angka sewa (listrik, air, sampah, dan biaya wajib lain). Nol persen dapat 5; 35 persen atau lebih dapat 0." },
  { nama: "Fasilitas untuk harganya", bobot: BOBOT.fasilitas, cara: "Jumlah fasilitas yang bisa difilter (AC, kamar mandi dalam, WiFi, CCTV, dan lainnya) dibanding kos lain di kisaran harga Rp250 ribu yang sama. Terbanyak dapat 5, paling sedikit dapat 1." },
  { nama: "Sekitar", bobot: BOBOT.sekitar, cara: "Rata-rata dari menit jalan kaki ke patokan terdekat, penerangan jalan malam hari (1–5), dan berapa dari minimarket, warung, laundry, dan transportasi umum yang ada di dekatnya." },
];

// The page that makes "sudah kami cek langsung" a claim we can be held to.
export default function CaraKamiMenilai() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8 pb-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-display text-arang-900">Cara kami menilai</h1>
        <p className="text-body text-arang-900">
          Setiap kos di Kos Bahagia sudah didatangi oleh surveyor kami. Yang kamu baca bukan iklan dari pemilik dan bukan ulasan bintang, tapi catatan dari orang bernama yang masuk ke kamar, mengukur, dan memotret. Halaman ini menjelaskan apa saja yang kami ukur dan bagaimana angkanya dihitung.
        </p>
      </header>

      <section aria-labelledby="kunjungan">
        <h2 id="kunjungan" className="text-h2 text-arang-900">Yang terjadi saat survei</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {[
            ["Datang dan masuk", "Surveyor datang tanpa janji khusus, melihat kamar yang benar-benar kosong, kamar mandi, dapur, koridor, parkir, dan jalan masuk."],
            ["Mengukur", "Ukuran kamar, desibel sunyi dan saat tes suara, jarak dan menit jalan kaki ke patokan terdekat, harga sekali makan di warung terdekat."],
            ["Menghitung biaya sebenarnya", "Sewa ditambah listrik (model dan estimasinya), air, sampah, dan biaya wajib lain. Angka inilah yang kami tampilkan besar, bukan sewanya saja."],
            ["Menulis catatan", "Tiga hal baik, tiga hal yang perlu kamu tahu, kesan terhadap pemilik, dan catatan keselamatan kalau ada. Nama surveyor dan tanggal survei tercantum di tiap halaman kos."],
          ].map(([judul, isi], i) => (
            <li key={judul} className="flex gap-3 rounded-2xl border border-biru-100 bg-putih p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-biru-100 text-small font-bold text-biru-600">{i + 1}</span>
              <div>
                <h3 className="text-body font-bold text-arang-900">{judul}</h3>
                <p className="text-small text-arang-900">{isi}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="skor">
        <h2 id="skor" className="text-h2 text-arang-900">Skor Bahagia, 0 sampai 10</h2>
        <p className="mt-1 text-body text-arang-900">Lima komponen, masing-masing skala 1–5, dijumlahkan dengan bobot berikut lalu diskalakan ke 0–10 dengan satu angka desimal.</p>
        <dl className="mt-3 divide-y divide-biru-100 rounded-2xl border border-biru-100 bg-putih">
          {KOMPONEN.map((k) => (
            <div key={k.nama} className="flex flex-col gap-1 px-4 py-3">
              <dt className="flex items-baseline justify-between gap-3">
                <span className="text-body font-bold text-arang-900">{k.nama}</span>
                <span className="text-small font-bold text-biru-600 tabular-nums">{Math.round(k.bobot * 100)}%</span>
              </dt>
              <dd className="text-small text-arang-900">{k.cara}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-3 flex flex-col gap-2 text-small text-arang-900">
          <li>Kalau kebersihan atau kedap suara belum bisa dinilai, kos itu tampil sebagai <strong>“Belum dinilai”</strong>. Kami tidak menebak angka.</li>
          <li>Kalau data sekitar belum lengkap, bobotnya dibuang dari perhitungan, bukan diisi nilai tengah.</li>
          <li>Skor dihitung ulang otomatis setiap data survei berubah; tidak ada yang mengetik skor secara manual.</li>
        </ul>
      </section>

      <section aria-labelledby="arti">
        <h2 id="arti" className="text-h2 text-arang-900">Arti kata di samping angka</h2>
        <p className="mt-1 text-body text-arang-900">Angkanya tetap kami tampilkan karena itu buktinya. Kata ini hanya terjemahan tetap supaya cepat dibaca, bukan penilaian tambahan.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <TabelArti judul="Kebersihan" satuan="/5" tingkat={SKALA_KEBERSIHAN} />
          <TabelArti judul="Kedap suara" satuan="/5" tingkat={SKALA_KEDAP} />
          <TabelArti judul="Selisih desibel" satuan=" dB" tingkat={SKALA_SELISIH_DB} />
        </div>
      </section>

      <section aria-labelledby="paket" className="rounded-2xl border-2 border-biru-500 bg-putih p-5">
        <h2 id="paket" className="text-h2 text-arang-900">Paket berbayar tidak mengubah skor</h2>
        <p className="mt-2 text-body text-arang-900">
          Pemilik kos bisa membeli paket Premium atau Spotlight. Yang mereka dapat: foto profesional, tur 360°, dan posisi lebih atas di hasil pencarian area, dengan label <strong>Mitra</strong> yang selalu tampil. Yang tidak bisa mereka beli: perubahan Skor Bahagia, penghapusan catatan surveyor, atau penyembunyian catatan keselamatan. Aturan ini ditegakkan di basis data kami, bukan hanya di kebijakan.
        </p>
      </section>

      <section aria-labelledby="segar">
        <h2 id="segar" className="text-h2 text-arang-900">Ketersediaan dan tanggal</h2>
        <p className="mt-1 text-body text-arang-900">
          Setiap kos menampilkan kapan ketersediaan kamarnya terakhir dikonfirmasi. Lebih dari 30 hari, kami beri label “Perlu dikonfirmasi” dan turunkan urutannya. Lebih dari 90 hari, kos tidak tampil di hasil pencarian sampai dikonfirmasi lagi. Kalau kamu menemukan kos yang ternyata penuh, tombol “Kamarnya sudah penuh?” di halaman kos mengirim laporan langsung ke kami.
        </p>
      </section>

      <section aria-labelledby="salah">
        <h2 id="salah" className="text-h2 text-arang-900">Kalau ada yang tidak sesuai</h2>
        <p className="mt-1 text-body text-arang-900">
          Survei adalah potret satu hari. Kalau kondisi berubah, pemilik bisa mengajukan koreksi dan surveyor kami datang lagi; data lama tidak diubah sampai dicek ulang. Kamu juga bisa melaporkan lewat halaman kos.
        </p>
        <Link href="/cari" className="mt-4 inline-block rounded-sm text-body font-bold text-biru-600 hover:underline">Mulai cari kos</Link>
      </section>
    </article>
  );
}

const angka = (n: number | undefined) => (n == null ? "" : String(n).replace(".", ","));

function TabelArti({ judul, satuan, tingkat }: { judul: string; satuan: string; tingkat: Tingkat[] }) {
  return (
    <div className="rounded-2xl border border-biru-100 bg-putih">
      <h3 className="border-b border-biru-100 px-4 py-2 text-small font-bold text-arang-900">{judul}</h3>
      <dl className="divide-y divide-biru-100">
        {tingkat.map((t, i) => (
          <div key={t.kata} className="flex items-baseline justify-between gap-3 px-4 py-2">
            <dt className="text-small font-bold text-arang-900">{t.kata}</dt>
            <dd className="text-micro text-arang-500 tabular-nums">
              {i === tingkat.length - 1 ? `< ${angka(tingkat[i - 1]?.min)}` : `≥ ${angka(t.min)}`}{satuan}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
