import type { Metadata } from "next";
import Link from "next/link";
import { BOBOT, HARI_HARGA_SEGAR, KRITERIA_TRANSPARANSI } from "@/lib/scoring";
import { SKALA_KEBERSIHAN, SKALA_KEDAP, SKALA_SELISIH_DB, type Tingkat } from "@/lib/skala";
import { MODE_DEMO, TEKS_DEMO } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Cara kami menilai",
  description: "Rubrik survei Kos Bahagia: apa yang kami ukur di lokasi, bagaimana Skor Bahagia dihitung, dan mengapa paket berbayar tidak bisa mengubahnya.",
  alternates: { canonical: "/cara-kami-menilai" },
};

const KOMPONEN = [
  { nama: "Kebersihan", bobot: BOBOT.kebersihan, cara: "Surveyor menilai kamar mandi, dapur bersama, dan koridor masing-masing 1–5 dengan rubrik tetap (bau, jamur, nat keramik, sampah, kondisi lantai). Skornya rata-rata dari yang ada; kalau kurang dari dua yang bisa dinilai, komponen ini kosong." },
  { nama: "Kedap suara", bobot: BOBOT.kedap, cara: "Kami catat material tembok, lalu ukur desibel saat sunyi dan saat ada suara dari kamar sebelah dengan alat ukur. Selisihnya, bersama material, menentukan skor 1–5." },
  { nama: "Transparansi biaya", bobot: BOBOT.transparansi, cara: "Seberapa lengkap biayanya disebutkan, bukan seberapa besar. Untuk setiap tipe kamar kami cek empat hal (daftar di bawah); tiap hal yang terpenuhi bernilai 1,25. Skornya rata-rata semua tipe kamar di kos itu, 0 sampai 5." },
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
          {MODE_DEMO && <strong>Situs ini masih prototipe dengan data contoh; cara menilai di bawah adalah metode yang dipakai saat survei sungguhan. </strong>}
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
          <li>Rumus: Skor = 10 × (jumlah bobot × komponen/5) ÷ jumlah bobot yang datanya ada. Komponen dibulatkan dua desimal, skor akhir satu desimal.</li>
          <li>Kalau kebersihan atau kedap suara belum bisa dinilai, kos itu tampil sebagai <strong>“Belum dinilai”</strong>. Kami tidak menebak angka dan tidak mengisinya dengan nol.</li>
          <li>Kalau data sekitar belum lengkap, bobotnya dibuang dari perhitungan, bukan diisi nilai tengah.</li>
          <li>Skor dihitung ulang otomatis setiap data survei atau biaya berubah; tidak ada yang mengetik skor secara manual.</li>
        </ul>

        <h3 id="transparansi" className="mt-6 text-body font-bold text-arang-900">Empat hal yang dicek untuk transparansi biaya</h3>
        <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-small text-arang-900">
          {KRITERIA_TRANSPARANSI.map((k) => (
            <li key={k.kunci}>{k.label}{k.kunci === "baru" ? ` (batas ${HARI_HARGA_SEGAR} hari)` : ""}.</li>
          ))}
        </ol>
        <p className="mt-2 text-small text-arang-900">
          Sebelum Oktober 2026 komponen ini dihitung dari porsi biaya di luar sewa. Angka itu mengukur struktur biaya, bukan kejelasannya, jadi sekarang hanya ditampilkan sebagai informasi “biaya di luar sewa” di halaman kos dan tidak lagi masuk skor.
        </p>
      </section>

      <section aria-labelledby="biaya">
        <h2 id="biaya" className="text-h2 text-arang-900">Cara kami menulis biaya</h2>
        <ul className="mt-2 flex flex-col gap-2 text-small text-arang-900">
          <li><strong>Total per bulan</strong> = sewa + semua biaya wajib bulanan yang nominalnya diketahui. Biaya tetap (listrik flat, air, sampah, iuran, WiFi wajib) masuk apa adanya.</li>
          <li><strong>Estimasi total</strong>: kalau listrik token atau meteran, kami pakai perkiraan surveyor untuk pemakaian normal. Tagihan aslimu bisa beda.</li>
          <li><strong>Total sementara</strong>: kalau ada biaya wajib yang nominalnya belum diketahui. Biaya itu tidak pernah kami anggap nol; kos seperti ini tidak ikut filter harga dan ditaruh paling bawah saat diurutkan termurah.</li>
          <li><strong>Kalau dipakai</strong>: parkir, laundry, dan biaya opsional lain tidak masuk total.</li>
          <li><strong>Uang masuk</strong> = total per bulan × bulan yang dibayar di muka + deposit + biaya sekali bayar, masing-masing dihitung sekali. Lama kontrak minimal ditulis terpisah karena tidak sama dengan bulan yang dibayar di muka.</li>
          <li>Ketersediaan dicatat per tipe kamar. Kamar kosong di tipe lain tidak membuat tipe pilihanmu tampil tersedia.</li>
        </ul>
      </section>

      <section aria-labelledby="jarak">
        <h2 id="jarak" className="scroll-mt-20 text-h2 text-arang-900">Cara kami menulis jarak dan fasilitas</h2>
        <ul className="mt-2 flex flex-col gap-2 text-small text-arang-900">
          <li><strong>Jarak garis lurus</strong>: di hasil pencarian dari kampus, stasiun, atau titik di peta, jarak dihitung lurus dari koordinat kos ke titik itu. Urutan Terdekat memakai angka yang sama. Ini bukan panjang rute jalan.</li>
          <li><strong>Menit jalan kaki dan jarak ke patokan</strong>: dicatat surveyor saat survei, dari patokan terdekat (kampus atau stasiun) ke kos. Kartu hanya menampilkan menitnya bila patokannya sama dengan tujuan pencarianmu.</li>
          <li><strong>Ilustrasi rute</strong> di halaman kos menunjukkan patokan yang dilewati, bukan peta berskala. Di <strong>peta asli</strong>, garis putus-putus hanya arah lurus, bukan rute jalan kaki.</li>
          <li><strong>Tempat di sekitar</strong> (minimarket, warung, laundry, transportasi): nama, jarak dari kos, dan harga yang dicatat surveyor. Kalau belum dicatat, kami menulis “Belum kami catat”, bukan “tidak ada”.</li>
          <li><strong>Fasilitas</strong>: kamar mandi dalam, AC, dan parkir dicatat per tipe kamar. Fasilitas lain dicatat per kos; yang dipakai bersama tidak berarti ada di setiap kamar. Fasilitas yang punya biaya sendiri, misalnya WiFi atau AC, ditulis bersama biayanya.</li>
        </ul>
      </section>

      <section aria-labelledby="batas">
        <h2 id="batas" className="text-h2 text-arang-900">Batas pengukuran</h2>
        <ul className="mt-2 flex flex-col gap-2 text-small text-arang-900">
          <li>Tes suara dilakukan sekali, di satu kamar (tercantum di halaman kos), pada jam survei: desibel saat sunyi lalu saat ada suara bicara dan TV dari kamar sebelah, diukur dengan aplikasi pengukur desibel di ponsel surveyor. Ini perbandingan antar-kos dengan cara yang sama, bukan pengukuran akustik laboratorium.</li>
          <li>Kamar lain, lantai lain, atau jam ramai (malam, akhir pekan) bisa lebih bising. Sumber bising sekitar yang kami lihat, misalnya bengkel atau jalan raya, ditulis terpisah.</li>
          <li>Kebersihan adalah kondisi pada hari kunjungan. Kami menilai bagian yang dipakai bersama; kamar yang masih ditempati tidak kami masuki.</li>
          <li>Catatan surveyor adalah kesan dan pengamatan dari kunjungan yang sama. Kalau angka terukur dan catatan terasa berbeda, angka terukur yang dipakai untuk skor.</li>
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
          Pemilik kos bisa membeli paket Premium atau Spotlight. Yang mereka dapat: foto profesional, tur 360°, label <strong>Mitra berbayar</strong> yang selalu tampil, dan posisi:
          Premium didahulukan hanya di urutan <strong>Paling relevan</strong>, setelah kos yang masih ada kamar dan datanya segar; Spotlight tampil di blok terpisah berlabel <strong>Promosi berbayar</strong> yang tetap mengikuti filtermu. Urutan <strong>Termurah</strong>, <strong>Terdekat</strong>, dan <strong>Skor tertinggi</strong> tidak memakai paket sama sekali.
          Yang tidak bisa mereka beli: perubahan Skor Bahagia, penghapusan catatan surveyor, atau penyembunyian catatan keselamatan. Aturan ini ditegakkan di basis data kami, bukan hanya di kebijakan.
        </p>
      </section>

      <section aria-labelledby="segar">
        <h2 id="segar" className="text-h2 text-arang-900">Ketersediaan dan tanggal</h2>
        <p className="mt-1 text-body text-arang-900">
          Setiap tipe kamar punya status sendiri: <strong>Tersedia</strong>, <strong>Penuh</strong>, atau <strong>Belum dikonfirmasi</strong>, lengkap dengan tanggal terakhir dicek. Lebih dari 30 hari tanpa konfirmasi, statusnya menjadi “Belum dikonfirmasi” dan kos turun di urutan Paling relevan. Lebih dari 90 hari, kos tidak tampil di hasil pencarian sampai dikonfirmasi lagi. Kalau kamu menemukan kamar yang ternyata penuh, tombol “Laporkan kamar sudah penuh” di halaman kos mengirim laporan ke kami (hanya kos dan tipe kamarnya, tanpa data dirimu).
        </p>
      </section>

      {MODE_DEMO && (
        <section id="data-contoh" aria-labelledby="data-contoh-judul" className="rounded-2xl border-2 border-arang-500/30 bg-putih p-5">
          <h2 id="data-contoh-judul" className="text-h2 text-arang-900">Tentang data contoh</h2>
          <p className="mt-2 text-body text-arang-900">{TEKS_DEMO.penjelasan}</p>
          <ul className="mt-2 flex flex-col gap-1 text-small text-arang-900">
            <li>Gambar kos adalah ilustrasi, bukan foto kondisi kos.</li>
            <li>Nomor WhatsApp pemilik tidak asli, jadi tombol kontak menampilkan pesan yang akan dikirim tanpa membuka WhatsApp.</li>
            <li>Simpanan dan daftar perbandingan hanya tersimpan di perangkat ini. Yang dikirim ke server kami hanya catatan klik tombol kontak, kunjungan halaman kos, dan laporan “kamar penuh”, tanpa data dirimu.</li>
          </ul>
        </section>
      )}

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
