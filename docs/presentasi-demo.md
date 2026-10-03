# Persiapan demo Kos Bahagia

Bagian kamu: demo situs, singkat, dinilai dosen. Target **3 menit** untuk demo, sisanya tanya-jawab.
Situs yang dipakai: **https://kos-bahagia-umber.vercel.app**

> Naskah ini sudah disesuaikan dengan perbaikan audit Oktober 2026 (`docs/audit-2026-10.md`). Angka di bawah
> berlaku setelah migrasi dan data contoh baru diterapkan ke database produksi; sebelum itu situs masih versi lama.

---

## 1. Sebelum mulai (5 menit sebelum giliran)

- [ ] Buka browser dalam **jendela baru/incognito** supaya tidak ada simpanan atau riwayat dari latihan.
- [ ] Zoom browser **125 %** supaya angka harga dan skor terbaca dari belakang kelas.
- [ ] Buka 4 tab ini berurutan, lalu kembali ke tab 1:
  1. `https://kos-bahagia-umber.vercel.app`
  2. `https://kos-bahagia-umber.vercel.app/cari?area=binus-kemanggisan&radius=2000`
  3. `https://kos-bahagia-umber.vercel.app/kos/kost-palmerah-88`
  4. `https://kos-bahagia-umber.vercel.app/kos/rumah-kos-cendana`
  Semua halaman sudah termuat, jadi kalau Wi-Fi kelas lambat, demo tetap jalan.
- [ ] Tutup notifikasi (Do Not Disturb), tutup tab lain.
- [ ] Cadangan kalau internet mati: `docs/tangkapan/beranda.png`, `cari-mobile.png`, `detail-mobile.png`
  (buka dulu di Preview, minimize).
- [ ] Kalau dosen minta versi HP: tekan `Cmd+Option+I` → ikon HP (device toolbar) → pilih iPhone. Latihan sekali.

---

## 2. Naskah dan urutan klik

Format: **klik / tunjuk** → *kalimat yang diucapkan*. Angka dalam kurung adalah target detik.

### Pembuka (15 dtk)

Tab 1, beranda. Belum klik apa-apa.

> *Kos Bahagia adalah situs cari kos yang setiap listing-nya didatangi dan dicek langsung. Yang kami tunjukkan hari ini
> prototipe dengan data contoh, dan situsnya sendiri bilang begitu di banner atas.
> Saya akan tunjukkan alur penyewa dari awal sampai menghubungi pemilik, hanya 4 klik.*

### Langkah 1: Beranda (20 dtk)

**Tunjuk** judul dan kartu kos di kanan. Kartu itu bukan gambar statis: isinya diambil dari satu listing sungguhan di
database (sekarang Kost Bu Ning), dengan keterangan "Contoh tampilan dari data demo".

> *Ada tiga hal yang tidak ditampilkan situs kos lain, dan itu yang jadi inti produk ini:
> biaya bulanan sebenarnya, skor kebersihan dan kedap suara, dan catatan surveyor.*

**Scroll** sedikit ke tiga langkah "Cara kami menilai" (datang, ukur, tulis).

> *Tiap kos disurvei dengan rubrik yang sama, termasuk tes desibel untuk kedap suara.*

### Langkah 2: Cari (35 dtk)

**Klik** kotak "Cari area atau kampus", **ketik** `BINUS`, **pilih** "BINUS University Kampus Anggrek".
(Kalau autocomplete lambat, pindah ke tab 2 yang sudah termuat.)

> *Pencarian berdasarkan lokasi: kampus, stasiun, atau kecamatan. Radius default 2 km.*

**Tunjuk** harga di kartu pertama.

> *Perhatikan harga besar di kartu: itu **total per bulan**, sudah termasuk listrik, air, sampah, dan iuran.
> Sewa saja ditulis kecil di bawahnya. Di situs lain angka besar itu sewa, dan biaya lainnya baru ketahuan saat survei.*

**Tunjuk** badge skor di kartu, lalu **pilih** urutan **"Termurah"**.

> *Skor Bahagia 0 sampai 10, dihitung dari data survei. Kalau saya pilih Termurah, daftar utama benar-benar urut dari
> total paling murah. Kos yang membayar promosi tampil di kotak terpisah berlabel "Promosi berbayar", tidak menyelip
> di urutan. Di bawah pilihan urutan ada penjelasan arti urutannya.*

**Tunjuk** peta di kanan (desktop tampil otomatis). Arahkan kursor ke satu kartu; pin di peta ikut menyala.

> *Peta pakai MapLibre dan OpenFreeMap, jadi tidak ada biaya per tampilan seperti Google Maps.*

(Kalau ada kartu berlabel "Belum dikonfirmasi", tunjuk.)

> *Ketersediaan yang belum dikonfirmasi pemilik lebih dari 30 hari diberi label ini dan diturunkan peringkatnya. Lebih dari 90 hari disembunyikan.*

### Langkah 3: Detail kos (60 dtk)

**Klik** kartu **Kost Palmerah 88** (atau pindah ke tab 3).

**Tunjuk** blok **Ringkasan** di atas.

> *Ringkasan ini disusun otomatis dari data di bawahnya: untuk siapa, tipe kamar, biaya bulanan, uang masuk,
> ketersediaan tipe kamar ini, tanggal survei, serta kelebihan dan kekurangan utama.*

**Klik** tipe kamar **AC** di Ringkasan.

> *Begitu tipe kamar diganti, harga, status, uang masuk, tombol kontak, dan URL ikut berubah. Kalau tipe ini penuh,
> statusnya Penuh walaupun tipe lain masih ada kamar, dan tombolnya jadi "Tanya kapan tersedia".*

**Tunjuk** blok skor (8,2) dan **klik** "Lihat rincian skor" kalau tertutup.

> *Skor 8,2: kebersihan 4,5 dari 5, tapi kedap suara cuma 2 dari 5, berisik. Kami tampilkan kelemahan juga, karena
> kos ini paket premium dan paket berbayar tidak boleh mengubah skor. Transparansi biaya di sini menilai seberapa
> lengkap biayanya disebutkan, bukan seberapa besar.*

**Scroll** ke "Biaya" (kembali ke tipe Standar).

> *Sewa Rp1.300.000, estimasi total Rp1.525.000: listrik token diperkirakan Rp200.000, iuran keamanan Rp25.000.
> Tertulis "estimasi" karena listriknya dibayar sesuai pemakaian. Di bawahnya ada uang yang perlu disiapkan untuk masuk:
> bayar di muka plus deposit, masing-masing dihitung sekali.*

**Scroll** ke "Kebersihan & suara".

> *Ini hasil ukurnya: kamar mandi, dapur, koridor masing-masing dinilai, plus tes desibel di kamar yang disebutkan.
> Ada catatan batas pengukurannya juga: satu kali tes di satu kamar, bukan pengukuran laboratorium.*

**Klik** tombol **"Lihat 360°"** di galeri, putar sebentar, tutup (tombol back HP atau tanda silang).

> *Tur 360° dibuat tanpa library, dan baru dimuat saat tombolnya ditekan supaya halaman tetap ringan.*

**Scroll** ke "Lokasi".

> *Rute jalan kaki ke Stasiun Palmerah digambar sebagai ilustrasi langkah demi langkah; tombol "Lihat peta asli" membuka peta sebenarnya.*

**Scroll** ke "Catatan surveyor".

> *Tiga hal baik, tiga hal yang perlu tahu. Catatannya selalu sejalan dengan hasil ukur, misalnya: tembok antarkamar
> triplek, obrolan kamar sebelah ikut terdengar, sama dengan skor kedap suara 2 tadi.*

### Langkah 4: Chat pemilik (15 dtk)

**Tunjuk** tombol oranye **"Chat pemilik"** (di bawah pada HP, di sidebar pada desktop). **Klik**: karena ini prototipe,
yang muncul adalah pesan yang akan dikirim, bukan WhatsApp (nomor pemilik di data contoh tidak asli). Lalu **Tutup**.

> *Ini klik keempat. Di versi asli tombol ini membuka WhatsApp pemilik dengan pesan ini: nama kos, tipe kamar, dan
> total yang sama dengan di layar. Kami tidak memegang pembayaran atau booking; tiap klik ini dicatat sebagai lead,
> dan itulah yang dijual ke pemilik.*

### Langkah 5: Red flag (15 dtk)

**Pindah** ke tab 4, **Rumah Kos Cendana**. **Tunjuk** panel merah.

> *Kalau surveyor menemukan risiko keselamatan, ditampilkan di panel merah yang tidak bisa ditutup, apa pun paketnya.
> Di sini: bekas banjir 30 cm dan tangga darurat digembok saat survei.*

### Penutup (10 dtk)

> *Semua itu bisa dipakai tanpa login. Pemilik kos punya sisi terpisah di subdomain mitra untuk mengonfirmasi kamar
> lewat WhatsApp tiap Senin. Itu demo dari saya, silakan kalau ada pertanyaan.*

**Total ± 3 menit.** Kalau diminta lebih singkat, buang Langkah 5 dan bagian 360°.

### Kalau ada waktu ekstra (masing-masing 15 dtk)

- **Simpan dan bandingkan**: klik ikon banding di 2 kartu → panel "Perbandingan" muncul di bawah → "Bandingkan" → tabel
  `/banding`. *Tiap kolom satu tipe kamar; kamar AC yang dipilih tetap AC setelah reload atau dikirim lewat tautan.
  Tanpa akun, tersimpan di perangkat ini.*
- **Halaman area**: `/area/palmerah`. *Halaman SEO per kecamatan atau kampus, hanya dibuat kalau ada minimal 5 kos.*
- **Cara kami menilai**: `/cara-kami-menilai`. *Rubrik dan bobot skor terbuka untuk umum.*
- **Sisi mitra**: klik "Punya kos? Gabung jadi mitra" di footer. Tunjukkan halaman depannya saja, jangan login
  (OTP produksi belum diaktifkan).

---

## 3. Angka yang perlu hafal

| Angka | Arti |
|---|---|
| 47 | kos tayang (50 di seed, 3 draft) di 2 area: Palmerah (Jakarta Barat) dan Lowokwaru (Malang) |
| 4 | klik dari beranda ke WhatsApp |
| 30 / 20 / 20 / 15 / 15 | bobot skor: kebersihan / kedap suara / transparansi biaya / fasilitas-untuk-harga / sekitar |
| 30 hari / 90 hari | belum dikonfirmasi / disembunyikan |
| 2 km | radius default pencarian |
| 3 paket | free, premium, spotlight; tidak ada yang mengubah skor |
| 109 + 78 + 18 | asersi pgTAP di database + unit test TypeScript + skenario browser |

---

## 4. Pertanyaan yang mungkin ditanyakan dosen

Jawaban dibuat pendek, siap ucap. Kalau ditanya sesuatu yang di luar bagianmu, boleh bilang
*"itu bagian [nama teman], tapi singkatnya ..."* lalu pakai jawaban di sini.

### Produk

**Apa bedanya dengan Mamikos?**
Mamikos menang di jumlah listing. Kami tidak bersaing di situ; kami menang di akurasi karena tiap kos disurvei langsung.
Tiga hal yang tidak mereka tampilkan: total biaya sebenarnya, skor kebersihan dan kedap suara, catatan surveyor bernama.

**Kenapa harus disurvei sendiri? Tidak scalable.**
Betul, dan itu disengaja. Kami mulai satu kecamatan, bukan satu kota. Surveinya yang membuat datanya bisa dipercaya;
kalau kami scraping seperti kompetitor, kami jadi sama dengan mereka. Skalanya nanti lewat tim surveyor per area.

**Dari mana pendapatannya?**
Dari pemilik kos, bukan penyewa. Paket premium (foto profesional, tur 360°, prioritas di area) dan spotlight
(slot terbatas di atas hasil). Yang dijual ke pemilik adalah jumlah klik "Chat pemilik", dan itu kami catat di database.

**Kalau pemilik bayar, skornya naik?**
Tidak, dan itu dijaga di level database: kolom hasil survei tidak bisa diubah pemilik, ditolak oleh trigger.
Paket hanya memengaruhi urutan "Paling relevan" dan blok "Promosi berbayar" yang terpisah. Urutan Termurah,
Terdekat, dan Skor tertinggi tidak memakai paket sama sekali.

**Transparansi biaya itu menilai apa?**
Seberapa lengkap biayanya disebutkan: bulan bayar di muka, nominal semua biaya wajib, ketentuan deposit, dan harga
dicek dalam 90 hari. Porsi biaya di luar sewa tetap ditampilkan, tapi hanya sebagai informasi, tidak masuk skor.

**Kalau ada biaya yang belum diketahui?**
Tidak pernah dianggap nol. Totalnya ditulis "Total sementara" dengan nama biaya yang belum diketahui, tidak ikut filter
harga, dan ditaruh paling bawah saat diurutkan termurah.

**Kenapa tidak ada review pengguna?**
Review bintang mengundang review palsu, dan kami sudah punya data surveyor yang lebih konsisten. Kalau ada yang salah,
penyewa bisa lapor lewat "Sudah telepon dan ternyata penuh?" di blok Ketersediaan, dan kami cek dalam 1×24 jam.

**Kenapa tidak ada booking atau pembayaran?**
Kami jembatan, bukan perantara. Transaksi kos di Indonesia memang lewat WhatsApp dan survei langsung; kami mempercepat
sampai titik itu, tidak menggantikannya. Ini juga menghindari beban hukum dan modal untuk escrow.

**Kenapa penyewa tidak perlu login?**
Karena setiap langkah yang menambah gesekan sebelum WhatsApp mengurangi lead. Simpan dan bandingkan cukup pakai
penyimpanan browser.

**Bagaimana kalau datanya basi?**
Tanggal konfirmasi selalu ditampilkan. Lebih dari 30 hari diberi label dan diturunkan, lebih dari 90 hari
disembunyikan. Tiap Senin sistem mengirim WhatsApp ke pemilik dengan tautan sekali pakai untuk konfirmasi tanpa login.

### Teknis (versi singkat, cukup untuk bagian demo)

**Pakai teknologi apa?**
Next.js dengan App Router dan TypeScript di depan, Supabase (Postgres + PostGIS) di belakang, di-hosting di Vercel.
Peta MapLibre dengan tile OpenFreeMap, gratis.

**Kenapa Next.js, bukan React biasa?**
Orang cari kos lewat Google, jadi halaman harus dirender di server supaya bisa diindeks. Halaman detail dan area
dibuat statis saat build dan diperbarui berkala.

**Skornya dihitung di mana?**
Di database, sebagai view SQL, supaya urutan pencarian, kartu, dan halaman detail memakai angka yang sama dan tidak ada
kode aplikasi yang bisa "menyesuaikan" skor. Ada versi TypeScript-nya untuk menampilkan rincian, dan ada skrip yang
membuktikan keduanya sama.

**Bagaimana pencarian radius bekerja?**
PostGIS: fungsi `cari_kos_v3` menerima titik pusat dan radius, memakai indeks spasial, lalu menerapkan filter dan urutan.
Semua parameter ada di URL, jadi hasil pencarian bisa dibagikan.

**Keamanannya bagaimana?**
Row Level Security di semua tabel. Pengunjung anonim hanya bisa membaca kos yang tayang dan menulis klik atau laporan
tanpa bisa membacanya kembali. Pemilik hanya bisa menyentuh kos miliknya sendiri. Kunci rahasia tidak pernah sampai ke browser.

**Diuji bagaimana?**
Tiga lapis: pgTAP di database (109 asersi: pencarian, urutan, promosi, RLS, konsistensi data contoh), 78 unit test
TypeScript untuk biaya, skor, format, validasi, dan simpanan, dan 18 skenario browser dengan Playwright. Sebelum rilis ada skrip yang memblokir kalau masih ada
foto placeholder.

**Foto-fotonya asli?**
Belum, ini ilustrasi dummy yang dibuat dari kode supaya konsisten per kos; foto asli masuk saat survei sungguhan.
Data kos di demo ini juga data contoh yang dibuat deterministik supaya pengujian bisa diulang.

**Kenapa halaman terasa cepat?**
Halaman pertama dirender server, gambar dilayani sebagai AVIF/WebP dengan placeholder BlurHash supaya tidak ada
lompatan tata letak, dan komponen berat seperti peta dan 360° baru dimuat saat dibutuhkan.

**Bisa dipakai di HP?**
Ya, dirancang dari 360 px ke atas. Filter jadi bottom sheet, tombol back HP menutup sheet dan galeri, tombol
WhatsApp menempel di bawah.

**Aksesibilitas?**
Kontras minimal 4,5:1, fokus keyboard terlihat dan kembali ke tombol pembuka setelah dialog ditutup, semua gambar ada
alt (ilustrasi disebut ilustrasi), animasi mengikuti pengaturan reduce motion. Dicek dengan axe: 0 pelanggaran.

### Kalau ditanya yang tidak kamu tahu

> *Saya belum pegang detail itu, tapi prinsipnya [sebut prinsip terdekat: skor di database / tanpa login / RLS].
> Bisa saya cek dan kirim setelah presentasi.*

Jangan mengarang angka. Lebih baik "tidak tahu, akan saya cek" daripada salah dan dikoreksi.

---

## 5. Latihan

1. Jalankan naskah ini 2 kali dengan stopwatch. Kalau lebih dari 3,5 menit, potong bagian 360° dulu.
2. Latih satu kali versi HP (device toolbar), karena dosen sering minta.
3. Baca bagian 4 sekali, lalu minta teman tanya acak 5 pertanyaan.
