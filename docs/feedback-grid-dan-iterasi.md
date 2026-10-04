# Feedback Capture Grid dan Iterasi Desain Kos Bahagia

Materi untuk tugas 3–6 (Next Session Preparation). Sumbernya **hasil uji prototipe versi 1**, yaitu audit UX
terhadap https://kos-bahagia-umber.vercel.app (pengujian tugas: cari, buka detail, pilih kamar, banding,
filter, keyboard, ponsel). Iterasinya adalah **versi 2** yang sudah live (Oktober 2026).

> Saat hasil Google Form dan wawancara masuk, tambahkan temuan dari responden ke grid yang sama dan beri tanda
> sumbernya. Jangan menulis kutipan responden yang belum ada.

---

## 3. Feedback Capture Grid

Grid 4 kotak: apa yang **disukai**, apa yang **dikritik**, **pertanyaan** yang muncul, dan **ide** baru.

| ➕ **Yang disukai** | ➖ **Kritik** |
|---|---|
| • Total biaya per bulan ditampilkan sebagai angka utama, bukan sewa saja | • Hero beranda bilang skor 8,1 dan "kedap suara", tapi di halaman kos 6,9 dan "berisik" |
| • Ada skor kebersihan dan kedap suara dari survei | • Catatan surveyor bertentangan dengan hasil ukur (gypsum vs "bata plester") |
| • Catatan surveyor: hal bagus dan hal yang perlu diketahui | • Pilih kamar AC yang penuh, tapi tetap tertulis "4 kamar tersedia" |
| • Perhitungan biaya di halaman detail sudah benar | • Halaman banding kembali ke kamar standar dan tidak menyebut putra/putri |
| • Saat hasil kosong, ada saran filter yang bisa dilonggarkan beserta jumlahnya | • "Termurah" tetap mendahulukan kos berbayar (Rp2,35 jt sebelum Rp865 rb) |
| • Bisa simpan dan bandingkan kos tanpa login | • Kartu menulis "sewa Rp1,3 jt" padahal total Rp1,265 jt (terlihat lebih mahal dari total) |
| • Tampilan biru-jingga, ikon, dan bahasa yang sederhana | • Harga minimal Rp2 jt dan maksimal Rp1,5 jt diterima dan menghasilkan "0 kos" |
| | • Tekan Escape di filter, fokus keyboard hilang ke awal halaman |
| | • Data contoh tampil seperti hasil survei sungguhan |

| ❓ **Pertanyaan** | 💡 **Ide** |
|---|---|
| • Kartu di beranda itu kos sungguhan atau contoh? | • Ringkasan keputusan di atas halaman kos: biaya, uang masuk, status, kelebihan dan kekurangan |
| • Kenapa urutan "Termurah" tidak urut dari yang termurah? | • Hitungan "uang yang perlu disiapkan untuk masuk" (bayar di muka + deposit) |
| • Label "Mitra" artinya pemiliknya membayar? | • Promosi berbayar dipisah ke kotak sendiri |
| • Jarak di kartu itu ke kampus yang saya cari atau ke tempat lain? | • Perbandingan ringkas berdampingan di ponsel |
| • Berapa uang yang harus disiapkan saat pertama masuk? | • Tombol "Tanya kapan tersedia" kalau kamar penuh |
| • Kos campur berarti boleh bawa pasangan? | • Petunjuk dan tombol kontrol di tur 360° |
| • Skor "transparansi biaya" sebenarnya mengukur apa? | • Penanda "data contoh" di bagian survei |
| • Data survei ini nyata atau contoh? | • *(dari tim)* Foto kamar ikut berubah sesuai tipe kamar |
| | • *(dari tim)* Rute jalan kaki biru beranimasi dan Street View di tiap belokan |

### Grid versi 2: hasil kuesioner (63 responden, 4–5 Oktober 2026)

Sumber: Google Form setelah responden mencoba versi 2. Angka dalam kurung adalah jumlah responden.
Detail dan grafiknya ada di `docs/laporan/laporan-uji-prototipe.md`.

| ➕ **Yang disukai** | ➖ **Kritik** |
|---|---|
| • Simpan dan bandingkan kos (10) | • Sulit menilai kecocokan kos dari informasi ringkas (7) |
| • Kartu kos: foto dan ringkasan berdekatan (8) | • Rincian biaya, fasilitas, dan jarak perlu dibaca ulang (7) |
| • Desain simpel, rapi, warna nyaman (8) | • Alur filter membingungkan; chip "kamar mandi dalam" ikut memilih "tanpa kamar mandi dalam" (6) |
| • Informasi lengkap dan detail (7) | • Terlalu banyak tulisan, terasa penuh di HP (5) |
| • Total biaya dan rinciannya (6) | • Tidak tahu tombol mana untuk membandingkan, ikon panah tidak dikenali (4) |
| • Harga, lokasi, kenyamanan dalam satu tempat (5) | • Label tombol harus dibaca dulu (3) |
| • Skor kebersihan dan kedap suara; tur 360° | • Tidak ada menu navigasi di header; loading terasa lama |

| ❓ **Pertanyaan** | 💡 **Ide** |
|---|---|
| • Skor kebersihan dan kebisingan dinilai dengan cara apa? | • Penjelasan skor, estimasi biaya, dan jarak di tempat angkanya (9) |
| • Estimasi total bulanan dihitung dari mana? | • Tata letak lebih lega dan dikelompokkan per bagian (7) |
| • Fasilitas mana yang di kamar dan mana yang dipakai bersama? | • Label "Simpan" / "Bandingkan" dan akses daftar lebih mudah (7) |
| • Mana informasi contoh dan mana yang nanti diperbarui pemilik? | • Info sekitar lebih rinci: laundry, toko bahan makanan (5) |
| • Kos yang saya pilih sudah tersimpan atau belum? | • Saran filter saat kosong, tombol ulang pencarian, penanda loading (5) |
| • Jarak ke kampus dihitung bagaimana? | • Filter putra/putri/campur bisa pilih lebih dari satu; tutorial singkat; review kos |

**Perbandingan dengan grid versi 1:** masalah konsistensi data, status kamar, dan urutan Termurah dari audit
versi 1 **tidak lagi muncul**. Yang muncul sekarang lebih ke kejelasan dan kepadatan tampilan.

---

## 4. Presentasi Feedback Grid (naskah ±3 menit)

**Pembuka (20 dtk)**
> *Kami menguji prototipe versi 1 dengan skenario tugas: mencari kos, memahami satu kos, memilih tipe kamar,
> membandingkan, dan menghubungi pemilik. Semua masukan kami kelompokkan ke empat kotak.*

**Yang disukai (40 dtk)**
> *Nilai utama produk diterima: total biaya per bulan, skor kebersihan dan kedap suara, serta catatan surveyor.
> Fitur simpan dan banding tanpa login, dan saran saat hasil kosong, juga dinilai sudah baik. Ini yang kami pertahankan.*

**Kritik (60 dtk)** — sebut 3 terbesar:
> *Masalah terbesar adalah **kepercayaan**. Pertama, data tidak konsisten: beranda dan halaman kos menyebut skor berbeda
> untuk kos yang sama. Kedua, **tipe kamar**: kamar AC yang penuh tampak tersedia karena tipe lain masih kosong.
> Ketiga, urutan **Termurah** didahului kos berbayar. Untuk produk yang menjual kejujuran data, tiga hal ini paling fatal.*

**Pertanyaan (30 dtk)**
> *Pertanyaan yang muncul menunjukkan informasi yang belum jelas: arti label "Mitra", jarak diukur ke mana,
> dan berapa uang yang harus disiapkan saat masuk.*

**Ide (30 dtk)**
> *Dari situ muncul ide: ringkasan keputusan di atas halaman kos, hitungan uang masuk, dan blok promosi yang dipisah.*

**Penutup (20 dtk)**
> *Kami memprioritaskan masalah berdasarkan dampak ke kepercayaan pengguna dan kemudahan memperbaikinya.
> Hasil iterasinya kami tunjukkan berikutnya.*

---

## 5. Prototype Iteration and Feedback Session

### a. Memilih yang diperbaiki

Prioritas = seberapa besar dampaknya ke keputusan pengguna × seberapa sering terjadi.

| Prioritas | Masalah | Alasan |
|---|---|---|
| 1 | Data tidak konsisten (hero, label, catatan) | Merusak nilai utama: kepercayaan |
| 2 | Status tipe kamar menyesatkan | Pengguna bisa menghubungi pemilik untuk kamar yang penuh |
| 3 | Banding kehilangan tipe kamar | Perbandingan jadi salah |
| 4 | Urutan Termurah dan label promosi | Terkesan menipu |
| 5 | Biaya: format, estimasi, uang masuk | Pengguna harus menghitung sendiri |
| 6 | Validasi filter harga | Hasil "0 kos" membingungkan |
| 7 | Makna skor transparansi | Label tidak sesuai yang diukur |
| 8–10 | Ringkasan, tampilan ponsel, keyboard, penanda data demo | Kenyamanan dan kejujuran |

### b. Cara memvalidasi perbaikan

- Setiap kritik dijadikan skenario uji otomatis di browser (16 skenario). Semuanya lulus di situs live versi 2.
- Data dicek otomatis supaya catatan surveyor tidak bertentangan lagi dengan hasil ukur.
- Aksesibilitas dicek dengan axe: 0 pelanggaran.

### c. Sesi feedback berikutnya (untuk versi 2)

Pakai Google Form `docs/kuesioner-uji-prototipe.md` (target 200 responden), ditambah uji langsung 5–10 orang:

1. Minta peserta mengerjakan 4 tugas yang sama tanpa dibantu.
2. Catat: tugas berhasil atau tidak, waktu, di mana ragu lebih dari 3 detik, dan kata-kata yang diucapkan.
3. Setelah selesai, tanyakan:
   - "Bagian mana yang paling membantu kamu memutuskan?"
   - "Ada yang bikin kamu ragu atau tidak percaya?"
   - "Kalau bisa mengubah satu hal, apa?"
4. Masukkan hasilnya ke grid baru (versi 2) dan bandingkan dengan grid versi 1.

---

## 6. Design Iteration (versi 1 → versi 2)

| Masalah di versi 1 | Perubahan di versi 2 | Bukti |
|---|---|---|
| Hero berisi angka ketikan | Hero mengambil satu kos sungguhan dan diberi label "Contoh tampilan dari data demo" | `tangkapan/beranda.png` → `tangkapan/audit/01-hero-data-asli.png` |
| "Termurah" didahului kos berbayar | Daftar utama urut murni; kos berbayar dipindah ke blok "Promosi berbayar" | `audit/02-termurah-promosi-terpisah.png` |
| Kamar AC penuh tampak tersedia | Status per tipe kamar; tombol berubah menjadi "Tanya kapan tersedia" | `audit/05-ringkasan-kamar-penuh-mobile.png` |
| Pengguna menghitung biaya sendiri | Ringkasan keputusan dan "Uang yang perlu disiapkan untuk masuk" | `audit/06-uang-masuk-mobile.png` |
| Biaya yang belum diketahui dianggap nol | Ditulis "Total sementara" beserta biaya yang belum diketahui | `audit/04-biaya-belum-diketahui.png` |
| Banding kembali ke kamar standar | Banding per kos dan tipe kamar, bertahan saat reload dan dibagikan | `audit/03-banding-desktop.png`, `audit/07-banding-ringkas-mobile.png` |
| Rentang harga terbalik menghasilkan "0 kos" | Error di bawah kolom, angka tidak hilang | `audit/08-validasi-harga-mobile.png` |
| Chat ke nomor contoh | Di mode prototipe, tombol menampilkan pesan saja | `audit/09-kontak-mode-demo-mobile.png` |
| Transparansi = besar biaya tambahan | Transparansi = kelengkapan informasi biaya (4 cek) | halaman `/cara-kami-menilai` |
| Fokus keyboard hilang | Fokus kembali ke tombol pembuka | uji browser skenario 13 |

**Angka sebelum vs sesudah**

| | Versi 1 | Versi 2 |
|---|---|---|
| Skenario audit lulus | gagal di 10 area audit | 18/18 pemeriksaan lulus |
| Performa halaman detail (Lighthouse) | 89 | 95 |
| Waktu muncul gambar utama detail (LCP) | 3,78 s | 2,91 s |
| Pelanggaran aksesibilitas (axe) | belum diukur | 0 |

**Rencana iterasi berikutnya (versi 3)**, diurutkan dari hasil kuesioner (63 responden):
1. Tombol simpan dan banding diberi label teks, ditambah tautan Simpanan dan Banding di header
2. Penjelasan singkat di samping skor, estimasi biaya, dan jarak
3. Kartu dan halaman detail lebih lega: harga, lokasi, status lebih dulu, detail bisa dilipat
4. Perbaikan filter: pisahkan chip kamar mandi dalam, tipe kos bisa pilih lebih dari satu, filter aktif terlihat
5. Panduan singkat untuk pengguna baru
6. Info sekitar lebih rinci dan menu navigasi di header
7. Dari ide tim: foto per tipe kamar, rute biru beranimasi, chat demo ke nomor tim
