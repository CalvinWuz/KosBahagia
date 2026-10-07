# Prompt implementasi UX versi 3 — Kos Bahagia

Tanggal penyusunan: 7 Oktober 2026.

Dokumen ini disiapkan untuk Calvin sebagai prompt kerja lengkap bagi Claude Code. Penyusunan dokumen tidak mengubah kode aplikasi. Calvin melakukan commit dan push sendiri.

## Cara memakai

Buka Claude Code pada repository `/Users/calvinn/KosBahagia`, lalu kirim:

> Baca seluruh `/Users/calvinn/KosBahagia/docs/prompt-ux-v3-kuesioner.md`. Jalankan bagian “Prompt utama untuk Claude Code” sebagai tugas implementasi. Pakai hasil kuesioner dan enam arahan versi 3 sebagai dasar. Kerjakan sampai implementasi dan pengujian selesai. Aku akan commit dan push sendiri.

Referensi utama adalah tiga screenshot yang diberikan Calvin:

1. **“Rencana versi 3 (dari hasil kuesioner)”**: enam perubahan beserta jumlah jawaban.
2. **“Kesimpulan”**: konsep diterima, kejelasan masih kurang, versi 3 berfokus pada kejelasan.
3. **“Grid hasil kuesioner”**: yang disukai, kritik, pertanyaan, dan ide.

Isi screenshot ditranskripsikan di bawah agar prompt tetap dapat digunakan ketika file screenshot sementara sudah tidak tersedia. Screenshot adalah sumber temuan dan arahan; tampilan slide bukan desain yang harus disalin ke website.

---

## Prompt utama untuk Claude Code

### 1. Peran, tujuan, dan lingkup kerja

Kamu mengerjakan peningkatan UX Kos Bahagia dari versi 2 ke versi 3. Gunakan keahlian product design, frontend, aksesibilitas, dan backend pencarian untuk menyelesaikan masalah yang ditemukan dalam kuesioner.

Repository: `/Users/calvinn/KosBahagia`.

Tujuan utama: pengguna lebih cepat memahami kos yang sedang dilihat, mengenali tindakan Simpan/Bandingkan, memahami asal angka, dan menggunakan filter tanpa kebingungan, baik di HP maupun PC.

Implementasikan enam arahan yang sudah disepakati. Pertahankan nilai produk yang disukai: total biaya bulanan, informasi lengkap, kartu dengan foto dan ringkasan, desain sederhana, serta simpan dan banding.

Versi 3 adalah iterasi kejelasan dan kemudahan penggunaan. Pertahankan identitas Kos Bahagia: logo, Plus Jakarta Sans, palet biru-jingga, ilustrasi, dan karakter beranda. Perubahan visual harus membantu pengguna menyelesaikan tugas.

Tanggung jawabmu mencakup kode aplikasi, perubahan lokal pada kontrak pencarian bila diperlukan, migrasi baru yang aman, pengujian, dan dokumentasi hasil. Calvin melakukan commit dan push sendiri. Berikan hasil yang siap diperiksa serta perintah yang dapat dijalankan Calvin untuk langkah berikutnya.

### 2. Baca konteks sebelum mengubah kode

Mulai dengan `git status --short`. Kenali perubahan pengguna yang sudah ada dan pertahankan.

Baca instruksi yang berlaku:

- `/Users/calvinn/AGENTS.md`, bila ada, beserta referensi instruksinya.
- `/Users/calvinn/KosBahagia/AGENTS.md`.
- `/Users/calvinn/KosBahagia/CLAUDE.md`.
- `/Users/calvinn/.claude/RTK.md`, bila dirujuk dan tersedia.
- Dokumentasi Next.js yang relevan di `/Users/calvinn/KosBahagia/node_modules/next/dist/docs/` sebelum mengubah pola routing atau API framework. Ikuti versi yang terpasang.

Baca konteks produk dan iterasi sebelumnya:

- `/Users/calvinn/KosBahagia/README.md`.
- `/Users/calvinn/KosBahagia/docs/feedback-grid-dan-iterasi.md`.
- `/Users/calvinn/KosBahagia/docs/laporan/laporan-uji-prototipe.md`.
- `/Users/calvinn/KosBahagia/docs/audit-2026-10.md`.
- `/Users/calvinn/KosBahagia/docs/rencana-ux.md`.

Gunakan skill `ui-ux-pro-max` untuk struktur informasi, navigasi, feedback, aksesibilitas, dan perilaku responsif. Gunakan `frontend-design` untuk komponen yang perlu dipoles. Baca file skill yang benar-benar tersedia; ikuti bagian yang relevan untuk website Next.js dan design system yang sudah ada.

Lakukan audit singkat dengan browser bila tersedia. Catat mana fitur yang sudah ada tetapi kurang ditemukan dan mana yang benar-benar belum ada. Perbaiki atau gunakan kembali komponen tersebut agar tidak muncul dua pola untuk fungsi yang sama.

### 3. Dasar dari kuesioner

Laporan repository mencatat **63 responden** pada **4–5 Oktober 2026** untuk pengujian versi 2. Gunakan laporan tersebut sebagai konteks; jangan membuat angka, kutipan, atau hasil validasi baru.

Dari screenshot:

| Kelompok | Temuan |
|---|---|
| Yang disukai | Simpan dan bandingkan; kartu dengan foto dan ringkasan; desain sederhana dan rapi; informasi lengkap dan total biaya. |
| Kritik | Sulit menilai kecocokan dari ringkasan; rincian biaya/fasilitas perlu dibaca ulang; alur filter membingungkan, khususnya kamar mandi dalam; terlalu banyak tulisan di HP. |
| Pertanyaan | Bagaimana kebersihan dinilai? Dari mana estimasi bulanan? Fasilitas mana milik kamar dan mana yang bersama? Apakah kos sudah tersimpan? |
| Ide | Penjelasan skor, biaya, dan jarak di tempatnya; tata letak lebih lega; label Simpan/Bandingkan; informasi sekitar lebih rinci. |

Enam arahan yang wajib ditangani:

| Arahan | Jumlah jawaban pada slide | Hasil yang dituju |
|---|---:|---|
| Label teks “Simpan” / “Bandingkan” dan tautan di header | 11 | Tindakan dan akses daftar mudah ditemukan. |
| Penjelasan singkat dekat skor, biaya, dan jarak | 16 | Angka dipahami ketika pengguna melihatnya. |
| Tampilan lebih lega; harga, lokasi, status lebih dulu | 12 | Informasi penting cepat dipindai, khususnya di HP. |
| Filter kamar mandi dalam dan tipe kos multi-pilih | Bug + 11 | Pilihan jelas dan benar sampai hasil query. |
| Panduan singkat pengguna baru | 4 | Pengguna dapat memulai tanpa bantuan. |
| Informasi sekitar lebih rinci dan menu navigasi | 6 | Pengguna memahami lingkungan dan tahu jalan ke fitur utama. |

Jumlah jawaban pada slide menggabungkan tema dari pertanyaan tertentu. Jangan menjumlahkan seluruh angka menjadi jumlah responden unik atau menganggap semua kategori saling eksklusif.

Prioritas pengerjaan: reproduksi dan perbaiki filter terlebih dahulu, lalu label tindakan dan penjelasan angka, susun kepadatan tampilan, kemudian panduan dan informasi sekitar. Keenamnya tetap termasuk lingkup wajib.

### 4. Perilaku versi 2 yang harus dijaga

Periksa kembali setelah setiap perubahan besar:

- Harga utama tetap total bulanan untuk tipe kamar yang sedang ditampilkan. Sewa merupakan komponen pendukung.
- `Total per bulan`, `Estimasi total per bulan`, dan `Total sementara` dibedakan sesuai data. Biaya belum diketahui tidak dianggap nol.
- Uang masuk dan biaya bulanan tetap dibedakan; deposit dan pembayaran di muka tidak ditambahkan sebagai biaya bulanan berulang.
- Harga, fasilitas, ketersediaan, ringkasan, dan kontak mengikuti tipe kamar yang dipilih.
- Simpan dan banding tetap dapat digunakan tanpa login, sebagaimana implementasi saat ini. Data disimpan di perangkat; jangan mengesankan sudah tersinkron ke akun.
- Kandidat banding mempertahankan identitas kos dan tipe kamar. Batas tiga kandidat dan mekanisme mengganti kandidat keempat tetap bekerja.
- Skor dan label berasal dari data/rubrik yang sama. Paket berbayar tidak mengubah skor atau menyembunyikan catatan keselamatan.
- Promosi berbayar tetap terpisah dari daftar utama. Urutan “Termurah”, “Terdekat”, dan “Skor tertinggi” tetap sesuai pilihan.
- Catatan keselamatan/red flags selalu terlihat dan tidak disembunyikan dalam accordion.
- Label data contoh, ilustrasi, dan perilaku kontak mode demo tetap berlaku.
- Tombol kembali, history browser, filter berbasis URL, pilihan kamar, serta state simpan/banding tetap terjaga.
- Jarak garis lurus, waktu jalan yang tercatat, dan ilustrasi rute tetap dibedakan.
- Permukaan pencari kos tetap terpisah dari dashboard pemilik.

Untuk tugas ini, mempertahankan simpan/banding tanpa login merupakan instruksi eksplisit. Gunakan keputusan produk terbaru dan implementasi yang sudah ada ketika dokumen lama berbeda.

### 5. Arahan 1 — Simpan/Bandingkan mudah dikenali

**Masalah:** ikon saja kurang dipahami, pengguna ragu apakah tindakan berhasil, dan daftar sulit ditemukan.

**Perubahan wajib:**

1. Berikan teks yang terlihat pada tombol tindakan:
   - Belum disimpan: **Simpan**.
   - Sudah disimpan: **Tersimpan**.
   - Belum dipilih untuk banding: **Bandingkan**.
   - Sudah dipilih: **Dalam banding**.
2. Gunakan teks bersama ikon dari sistem ikon yang sudah ada. Warna, bentuk ikon, dan `aria-pressed` memperkuat state; teks tetap menjelaskannya.
3. Terapkan pada kartu hasil, detail, simpanan, kartu promosi, dan varian lain yang menggunakan komponen tindakan bersama. Varian peta yang ringkas harus tetap memiliki akses ke tindakan berlabel tanpa menyempitkan kartu secara berlebihan.
4. Sesuaikan nama aksesibel dengan state yang benar. Jika tombol “Tersimpan” menghapus item ketika ditekan, nama aksesibel atau bantuan singkat menjelaskan tindakan tersebut.
5. Pertahankan toast yang singkat, tautan ke daftar, dan persistensi state setelah reload.
6. Di header/menu navigasi, berikan tautan **Simpanan** ke `/disimpan` dan **Bandingkan** ke `/banding`, dengan jumlah yang relevan. Jangan menampilkan state kosong seolah terjadi galat.
7. Pastikan tersedia akses tersebut dari header khusus mobile di `/cari` dan `/kos/[slug]`, karena header global sekarang disembunyikan pada dua halaman itu.
8. Ketika belum ada kandidat, halaman banding menjelaskan cara memilih kos dan memberikan tautan pencarian. Ketika baru satu kandidat, jelaskan untuk menambahkan setidaknya satu lagi.
9. Menekan Simpan/Bandingkan pada kartu tidak membuka halaman detail akibat stretched link. Hindari elemen interaktif bersarang.

**Kriteria selesai:** pengguna bisa menemukan tombol, mengetahui state, membuka daftarnya, menambah/menghapus pilihan, mengganti kandidat keempat, dan melihat state yang benar setelah reload tanpa bantuan lisan.

### 6. Arahan 2 — Jelaskan skor, biaya, dan jarak di tempatnya

Gunakan dua lapis informasi: label atau kalimat pendek di dekat angka, kemudian bantuan detail yang dibuka bila diperlukan. Bantuan harus bekerja lewat tap dan keyboard, bukan hanya hover.

#### 6.1 Skor

- Bedakan **Skor Bahagia /10**, **Kebersihan /5**, dan **Kedap suara /5**.
- Jelaskan bahwa angka kedap suara yang lebih tinggi berarti lebih baik menahan suara. Bedakan dengan dB yang merupakan hasil ukur, bukan skor.
- Gunakan kata dari `lib/skala.ts` dan hasil hitung dari sumber yang sudah ada.
- Letakkan penjelasan singkat dekat badge/chip angka. Contoh: “Kebersihan 4/5 — bersih” atau “Kedap suara 4/5 — lebih baik menahan suara”. Sesuaikan dengan nilai/rubrik sebenarnya.
- Gunakan kembali `ArtiSkala`, `SkorRincian`, dan halaman `/cara-kami-menilai`.
- Bantuan detail menjelaskan bagian yang dinilai, tanggal dan batas pengukuran bila tersedia, serta bahwa kondisi dapat berubah.
- Skor Bahagia mempertahankan bobot: kebersihan 30%, kedap suara 20%, transparansi biaya 20%, fasilitas terhadap harga 15%, sekitar 15%.
- Transparansi biaya mengikuti rubrik terbaru tentang kelengkapan informasi. Jangan mengembalikannya menjadi persentase biaya tambahan.
- Data yang belum cukup tetap **Belum dinilai**. Mode demo tetap menunjukkan bahwa ini contoh data.

#### 6.2 Biaya

- Label harga ditentukan oleh `lib/biaya.ts`; jangan menulis label terpisah yang bisa bertentangan dengan detail.
- Dekat total, tampilkan konteks ringkas mengenai komponen dan sumber estimasi. Contoh: “Sewa + biaya wajib; listrik mengikuti pemakaian” jika benar pada data itu.
- Jelaskan listrik estimasi sebagai estimasi pemakaian yang tercatat, bukan tarif tetap atau nominal yang dijamin.
- Untuk total sementara, nama komponen yang belum diketahui tetap terlihat sebelum membuka rincian.
- Tautan **Lihat rincian biaya** mengarah ke rincian tipe kamar yang sedang dipilih.
- Bedakan fasilitas yang tersedia, biaya yang termasuk sewa, dan biaya opsional. Jangan menyamakan “ada Wi-Fi” dengan “Wi-Fi gratis”.
- Perubahan tipe kamar memperbarui angka dan bantuan terkait secara konsisten.

#### 6.3 Jarak

- Selalu sebutkan acuan: kampus yang dipilih, stasiun, pusat area, atau titik pencarian di peta.
- Jarak dari query spasial harus dijelaskan sebagai **garis lurus**, bila memang itulah perhitungannya.
- Waktu jalan tercatat hanya dipakai untuk landmark yang sesuai. Jangan menghitung atau menampilkan waktu perjalanan palsu.
- Jika memakai perkiraan waktu yang baru, jelaskan metode dan label estimasinya; utamakan data yang sudah ada.
- Peta inset dengan garis arah tidak boleh diberi label seolah rute jalan kaki hasil routing.
- Untuk nilai kosong tampilkan **Belum dicatat**, tanpa mengganti dengan nol atau perkiraan tersembunyi.

**Kriteria selesai:** pengguna bisa menjawab arti skala, komponen biaya, dan tujuan jarak dari tampilan yang sedang dilihat, tanpa harus mencari penjelasan di footer.

### 7. Arahan 3 — Tampilan lebih lega dan mudah dipindai

#### 7.1 Kartu kos

Susun hirarki yang jelas:

1. Foto/ilustrasi dan nama kos.
2. Total biaya bulanan dengan status lengkap/estimasi/sementara.
3. Lokasi/acuan jarak dan tipe penghuni.
4. Status tipe kamar beserta waktu konfirmasi.
5. Ringkasan skor atau hal penting yang singkat.
6. Tombol Simpan dan Bandingkan yang terbaca.

Susunan spasial dapat menyesuaikan breakpoint, tetapi harga, lokasi, dan status tidak tenggelam di bawah tumpukan badge.

Batasi informasi sekunder, bukan informasi yang penting untuk keputusan. Peringatan keselamatan, biaya belum diketahui, status penuh, dan data perlu dikonfirmasi tetap mudah ditemukan.

Gunakan spacing, grouping, dan pemilihan kalimat; pertahankan ukuran teks yang layak. Jangan membuat tampilan lebih lega dengan mengecilkan font sampai sulit dibaca.

#### 7.2 Detail kos

- Gunakan ringkasan keputusan yang sudah ada sebagai titik awal; jangan membuat ringkasan kedua dengan hitungan terpisah.
- Informasi awal: harga, lokasi, penghuni, tipe kamar, ketersediaan, penjelasan penting biaya, serta kelebihan/kekurangan utama.
- Rincian panjang boleh dilipat: metode skor, komponen biaya lengkap, daftar fasilitas panjang, aturan tambahan, dan penjelasan sekitar.
- Peringatan keselamatan, komponen biaya belum diketahui, serta status kamar tetap terlihat.
- Accordion memiliki judul yang menjelaskan isi. Contoh: **Lihat rincian biaya** atau **Lihat semua fasilitas**, dengan ringkasan singkat ketika tertutup.
- Ketika pengguna menekan navigasi “Biaya”, “Fasilitas”, atau “Sekitar”, bagian tujuan harus dapat terlihat. Buka bagian yang diperlukan sebelum memindahkan scroll/fokus.
- Tautan anchor langsung dan bantuan “Lihat rincian” tetap bekerja jika tujuan berada dalam bagian yang terlipat.

#### 7.3 Fasilitas

Gunakan kembali pengelompokan yang sudah ada:

- **Di kamar**: fasilitas pada tipe kamar yang dipilih.
- **Dipakai bersama**: fasilitas untuk penghuni kos.
- **Tidak tersedia** dan **Belum dicatat** dibedakan sesuai kemampuan data.

Jangan menganggap fasilitas bersama dimiliki setiap kamar. Ketika tipe kamar berubah, fasilitas kamar yang memang berbeda ikut berubah. Bila model data belum bisa membedakan tidak tersedia dari belum tercatat, tampilkan batas informasi secara jujur.

#### 7.4 HP dan PC

- HP: alur satu kolom, paragraf singkat, kontrol berlabel, konten penting lebih dulu.
- PC: ruang lebih lebar, ringkasan/sidebar bila membantu, dengan urutan informasi yang konsisten.
- Hindari header ganda, navigasi berlapis yang terlalu tinggi, dan tabrakan menu dengan tray banding atau bar kontak.
- Konten tetap dapat dibaca saat zoom 200% dan di layar kecil.
- Selesaikan masalah horizontal overflow pada tingkat halaman. Scroll horizontal lokal hanya digunakan bila sesuai, seperti navigasi bagian atau tabel yang memang perlu.
- Perhatikan padding untuk sticky bar dan safe area perangkat.

**Kriteria selesai:** pengguna dapat mengenali biaya, lokasi, dan status sebelum perlu membaca seluruh detail; informasi lengkap tetap dapat diakses.

### 8. Arahan 4 — Filter konsisten dari UI sampai database

#### 8.1 Reproduksi sebelum perbaikan

Catat langkah dan hasil aktual untuk:

- Chip cepat **Kamar mandi dalam** di hasil pencarian.
- Kontrol **tanpa kamar mandi dalam** dalam kelompok “Sembunyikan”.
- Pilihan fasilitas kamar mandi dalam di FilterSheet.
- Pemilihan putra/putri/campur.

Pada kode saat dokumen ini disusun, beberapa kontrol kamar mandi mengacu ke slug fasilitas yang sama. Label negatif dalam kelompok “Sembunyikan” membuat maksudnya sulit dibaca. Tipe kos masih satu nilai sampai argumen RPC.

Bedakan kebingungan label dari kesalahan data/query yang sebenarnya. Berikan bukti reproduksi dan perbaikan untuk keduanya jika ditemukan.

#### 8.2 Kamar mandi dalam

- Jadikan **Kamar mandi dalam** syarat positif yang jelas.
- Hilangkan duplikasi kontrol negatif yang membuat pengguna mengira pilihan saling bertentangan.
- Chip cepat, FilterSheet, dan ringkasan filter aktif memakai satu sumber state.
- Chip ringkasan merupakan representasi pilihan aktif, dengan tombol menghapus pilihan tersebut.
- Menyalakan filter menghasilkan tipe kamar yang benar-benar memenuhi syarat.
- Periksa `tipe_kamar.kamar_mandi_dalam`, flags fasilitas pada tingkat kos, dan pemilihan kamar acuan dalam query.
- Jika sebuah kos punya kamar standar tanpa kamar mandi dalam dan kamar lain dengan kamar mandi dalam, filter harus memilih kamar yang memenuhi syarat. Harga, status, fasilitas, dan tautan detail kemudian menunjuk kamar tersebut.
- Filter harga dan fasilitas kamar harus terpenuhi oleh tipe kamar yang sama. Jangan meloloskan kos karena kamar A cocok harga sedangkan kamar B cocok fasilitas.
- Nilai yang belum diketahui tidak otomatis dianggap memenuhi syarat eksplisit.
- Terapkan konsistensi yang sama pada blok promosi.

#### 8.3 Tipe kos multi-pilih

Pengguna dapat memilih Putra, Putri, dan Campur lebih dari satu.

Semantik:

- Tidak ada pilihan: semua tipe.
- Satu pilihan: hanya tipe tersebut.
- Beberapa pilihan: OR antar tipe.
- Ketiganya dipilih: hasil setara semua tipe.
- Tipe yang dipilih dikombinasikan dengan filter lain menggunakan AND.
- Menekan pilihan yang aktif hanya menghapus pilihan tersebut.

URL contoh: `/cari?tipe=putra,campur`.

Perbarui parser dan pembentuk URL secara bersama:

- URL lama `tipe=putra` tetap bekerja.
- Nilai tidak dikenal dibuang; daftar kosong tidak menyebabkan error.
- Hapus duplikasi dan gunakan urutan stabil untuk serialisasi.
- Refresh, tautan dibagikan, tombol kembali/maju, dan mode peta mempertahankan pilihan.
- Parameter lokasi, radius, kata pencarian, harga, dan urutan tetap dipertahankan.
- Perubahan filter mengembalikan pagination ke awal.

**Ini perubahan kontrak frontend dan backend.** Jangan berhenti setelah chip menjadi checkbox.

Audit dan sesuaikan:

- `lib/cari-params.ts`.
- `lib/cari/ambil.ts`, termasuk argumen hasil, hitungan, dan promosi.
- `lib/cari/longgar.ts`, preset, serta semua pemanggil yang mengasumsikan tipe tunggal.
- RPC hasil utama, RPC promosi, dan helper pencocokan bersama.
- Generated database types.

Saat ini aplikasi menggunakan RPC `cari_kos_v3`, `kos_promosi`, dan helper `kos_cocok`. Nama RPC “v3” sudah ada sebelum iterasi UX ini. Jangan menyamakan nomor iterasi desain dengan kebutuhan mengganti nama fungsi.

Gunakan migrasi baru yang kompatibel. Jika perlu kontrak RPC baru, pilih strategi yang jelas tanpa overload ambigu; dokumentasikan cara aplikasi berpindah kontrak. Pertahankan fungsi lama bila diperlukan untuk deployment yang masih memakainya. Jangan mengubah migrasi yang sudah diterapkan atau membuat type palsu untuk menutupi kontrak yang belum sesuai.

#### 8.4 Feedback filter

- Pilihan terpilih terlihat lewat teks/state, bukan warna saja.
- “Filter aktif” menyediakan cara menghapus satu pilihan dan **Hapus semua**.
- Definisikan hitungan filter secara konsisten. Contoh: kelompok tipe dihitung satu filter meskipun dua tipe dipilih; ringkasan teks tetap menyebut semua tipe.
- Saat menghitung hasil, tampilkan state memuat. Jangan menyatakan angka lama sebagai hasil terbaru.
- Respons request lama tidak boleh menimpa hasil pilihan yang lebih baru.
- “Lihat N kos” sesuai query aktual.
- Pertahankan filter live yang sudah ada: memilih langsung memperbarui pencarian; tombol hasil menutup sheet. Tambahkan bantuan singkat jika pola itu kurang jelas.
- Satu sesi FilterSheet tetap satu langkah history. Back menutup sheet dan mempertahankan pilihan terakhir.
- Validasi harga yang sudah ada tetap bekerja; nilai minimum lebih besar dari maksimum tetap ditunjukkan sebagai kesalahan input.
- Jika hasil nol, berikan pilihan melonggarkan filter yang relevan beserta jumlah yang valid. Jangan menghapus filter secara diam-diam.

**Kriteria selesai:** filter aktif, URL, count, daftar utama, promosi, mode peta, dan kamar pada detail semuanya konsisten.

### 9. Arahan 5 — Panduan singkat pengguna baru

Buat panduan ringan dengan tiga langkah:

1. **Cari lokasi dan atur kebutuhanmu.**
2. **Cek biaya, kondisi, dan simpan pilihan.**
3. **Bandingkan pilihan, lalu hubungi pemilik.**

- Panduan menjelaskan fitur yang tersedia sekarang.
- Tampilkan sebagai bantuan ringkas yang dapat dilewati. Pencarian tidak harus menunggu pengguna menyelesaikan tutorial.
- Sediakan akses **Cara menggunakan** melalui navigasi agar dapat dibuka ulang.
- Pakai halaman/Sheet ringan sesuai pola yang sudah ada. Hindari library onboarding besar dan overlay berantai yang mudah rusak.
- Jika ada penanda sudah dibaca, gunakan storage ber-versi yang terpisah dari data simpan/banding, dengan akses browser yang aman untuk SSR.
- Bila storage tidak tersedia, aplikasi tetap dapat dipakai.
- Sertakan penjelasan singkat bahwa simpanan tersimpan pada perangkat ini.
- Panduan bekerja dengan tap dan keyboard serta tidak merusak state pencarian ketika dibuka/ditutup.

**Kriteria selesai:** pengguna baru memahami alur dan bisa melewati panduan; pengguna lama tidak terganggu dan dapat membukanya kembali.

### 10. Arahan 6 — Info sekitar dan navigasi

#### 10.1 Info sekitar

Perbaiki bagian `SekitarKos` dengan pengelompokan yang membantu kebutuhan sehari-hari:

- Kebutuhan harian: minimarket/toko bahan makanan jika datanya tersedia.
- Makan: warung/tempat makan dan kisaran harga bila tercatat.
- Laundry: nama, jarak, serta harga per kg bila tercatat.
- Transportasi: titik transit, jenis layanan, dan akses gang.
- Lingkungan: penerangan, informasi banjir, serta catatan yang tersedia.

Tampilkan nama, jarak, acuan/metode jarak bila diketahui, biaya yang tercatat, dan cara melihat lokasinya jika data koordinat tersedia. Pakai pola ringkas konsisten; rincian tambahan dapat dibuka.

Perbaiki bahasa untuk nilai kosong. Data null tidak otomatis berarti **Tidak ada yang dekat**. Gunakan **Belum dicatat** apabila memang belum ada informasi. Pernyataan tidak ada harus didukung data.

Jangan menambahkan nama toko, koordinat, harga laundry, jam buka, atau waktu jalan yang tidak ada. Warung makan tidak otomatis disebut toko bahan makanan. Jangan mengganti dummy menjadi klaim tempat nyata.

Gunakan MapLibre/OpenFreeMap dan ilustrasi rute yang sudah ada bila relevan. Jangan menambahkan layanan peta/POI berbayar untuk memenuhi iterasi ini. Peta ditampilkan bila membantu tugas pengguna, bukan diwajibkan pada setiap kartu sekitar.

Jika penambahan field diperlukan, gunakan migrasi lokal minimal dan schema yang jelas. Prioritaskan pemanfaatan data yang sudah ada; tampilkan keterbatasan data secara jujur.

#### 10.2 Menu navigasi

Menu utama pencari kos menyediakan akses berlabel:

- **Cari kos**.
- **Simpanan**.
- **Bandingkan**.
- **Cara menggunakan**.

Logo tetap mengarah ke beranda; **Cara kami menilai** tetap mudah dicapai dari konteks skor dan bantuan.

PC dapat menampilkan menu langsung. HP dapat menggunakan menu ringkas yang terbaca, asalkan akses dari header khusus pencarian/detail tersedia. Pilih pola yang konsisten dan tidak menambah beberapa bar navigasi permanen.

Ketentuan:

- State halaman aktif jelas.
- Menu menggunakan tautan untuk navigasi dan tombol untuk membuka kontrol.
- Menu dapat ditutup dengan Escape/back sesuai pola aplikasi; fokus kembali ke pemicu.
- Navigasi tidak menghapus data simpan/banding atau filter tanpa sebab.
- Dashboard/fitur pemilik tetap masuk melalui jalur mitra yang sudah ada.
- Setelah membuka detail lalu kembali, pencarian tetap berada pada konteks lokasi, filter, dan posisi yang masuk akal.

**Kriteria selesai:** pengguna bisa mencapai fitur utama dari halaman yang sedang dipakai tanpa harus mencari tautan di footer.

### 11. Peta bagian kode yang perlu diperiksa

Daftar ini titik awal, bukan kewajiban mengubah semua file. Pastikan nama/path masih sesuai ketika bekerja.

| Area | File awal yang relevan |
|---|---|
| Header dan permukaan mobile | `/Users/calvinn/KosBahagia/components/layout/Header.tsx`, `/Users/calvinn/KosBahagia/components/cari/HasilPencarian.tsx`, `/Users/calvinn/KosBahagia/components/kos/DetailKos.tsx` |
| Simpan/banding | `/Users/calvinn/KosBahagia/components/kos/KosCard.tsx` termasuk `AksiKartu`, `/Users/calvinn/KosBahagia/components/kos/TrayBanding.tsx`, `/Users/calvinn/KosBahagia/components/kos/DaftarSimpanan.tsx`, `/Users/calvinn/KosBahagia/components/kos/TabelBanding.tsx`, `/Users/calvinn/KosBahagia/lib/simpan.ts` |
| Identitas kamar pada banding | `/Users/calvinn/KosBahagia/lib/kos/kunci-banding.ts`, `/Users/calvinn/KosBahagia/lib/kos/banding.ts` |
| Skor dan bantuan | `/Users/calvinn/KosBahagia/components/kos/SkorBadge.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/ArtiSkala.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/SkorRincian.tsx`, `/Users/calvinn/KosBahagia/lib/skala.ts`, `/Users/calvinn/KosBahagia/lib/scoring.ts` |
| Biaya, ringkasan, status, fasilitas | `/Users/calvinn/KosBahagia/components/kos/detail/RincianBiaya.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/RingkasanKeputusan.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/DaftarFasilitas.tsx`, `/Users/calvinn/KosBahagia/lib/biaya.ts`, `/Users/calvinn/KosBahagia/lib/kamar.ts` |
| Filter dan URL | `/Users/calvinn/KosBahagia/components/cari/FilterSheet.tsx`, `/Users/calvinn/KosBahagia/lib/cari-params.ts`, `/Users/calvinn/KosBahagia/lib/cari/ambil.ts`, `/Users/calvinn/KosBahagia/lib/cari/longgar.ts`, `/Users/calvinn/KosBahagia/components/cari/PresetGrid.tsx` |
| Sekitar dan peta | `/Users/calvinn/KosBahagia/components/kos/detail/SekitarKos.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/CaraKeSini.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/PetaInset.tsx`, `/Users/calvinn/KosBahagia/components/kos/Minimap.tsx`, `/Users/calvinn/KosBahagia/lib/kos/detail.ts` |
| Navigasi dan lapisan | `/Users/calvinn/KosBahagia/lib/navigasi.ts`, `/Users/calvinn/KosBahagia/components/ui/Sheet.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/NavBagian.tsx` |
| Kontrak data | `/Users/calvinn/KosBahagia/supabase/migrations/20261003000100_biaya_kamar_skor.sql`, `/Users/calvinn/KosBahagia/supabase/migrations/20261003000200_cari_v3_promosi.sql`, `/Users/calvinn/KosBahagia/lib/supabase/types.ts` |
| Halaman terkait | `/Users/calvinn/KosBahagia/app/(user)/page.tsx`, `/Users/calvinn/KosBahagia/app/(user)/cari/page.tsx`, `/Users/calvinn/KosBahagia/app/(user)/disimpan/page.tsx`, `/Users/calvinn/KosBahagia/app/(user)/banding/page.tsx`, `/Users/calvinn/KosBahagia/app/(user)/cara-kami-menilai/page.tsx` |
| Design system | `/Users/calvinn/KosBahagia/app/globals.css`, `/Users/calvinn/KosBahagia/components/ui/` |
| Pengujian | `/Users/calvinn/KosBahagia/lib/cari-params.test.ts`, `/Users/calvinn/KosBahagia/lib/simpan.test.ts`, `/Users/calvinn/KosBahagia/lib/biaya.test.ts`, `/Users/calvinn/KosBahagia/supabase/tests/` |

### 12. Standar implementasi

- TypeScript strict, tanpa `any` atau cast yang menyembunyikan kontrak salah.
- Server Component sebagai default; Client Component pada interaksi yang memerlukannya.
- Gunakan komponen Sheet, Accordion, Button, Chip, toast, dan ikon yang sudah ada.
- Gunakan token warna dan tipografi dari design system; tambahan token hanya jika diperlukan dan didefinisikan di tempat pusat.
- Bahasa UI Indonesia, ringkas, dan menyebut hasil tindakan.
- Target sentuh sekurang-kurangnya 44 × 44 CSS px; ukuran teks utama mobile mengikuti design system.
- Label input, fokus keyboard, kontras, dan nama aksesibel benar.
- Informasi bantu penting dapat dibuka dengan tap/keyboard; tidak bergantung pada `title`/hover.
- Hormati reduced motion; animasi singkat membantu transisi dan feedback.
- Pertahankan lazy loading peta, panorama, dan bagian berat lainnya.
- Tetap gunakan RLS dan generated types. Kunci service role tidak masuk client.
- Hindari dependencies baru yang sekadar menggandakan kemampuan komponen yang tersedia.
- Uji konteks state yang bermakna, bukan hanya apakah komponen berhasil dirender.
- Jangan menambah review publik, pembayaran, booking, chatbot, atau fitur promosi video sebagai perluasan tugas ini.
- Foto per tipe kamar, rute baru dengan Street View, dan perubahan nomor chat dari daftar ide tim berada di luar enam arahan ini, kecuali Calvin memberi instruksi tambahan.
- Jangan membuat commit, push, deploy Vercel, mengubah environment produksi, atau menerapkan migrasi ke Supabase cloud. Siapkan migrasi/perintah untuk diperiksa Calvin.
- Jangan menjalankan reset database yang menghapus data pengguna. Gunakan database lokal uji yang memang aman atau fixture terisolasi.

### 13. Urutan pengerjaan

1. **Audit awal:** pahami state kode, reproduksi masalah filter dan tombol, lihat HP/PC.
2. **Pemetaan:** ringkas temuan → perubahan → file → kriteria selesai. Jelaskan keputusan rutin, lalu lanjut implementasi tanpa meminta persetujuan berulang.
3. **Filter:** perbaiki semantics kamar mandi, multi-pilih tipe, URL, RPC, count, promosi, dan kamar acuan.
4. **Tindakan dan navigasi:** label, state, akses daftar, menu HP/PC.
5. **Kejelasan angka:** bantuan kontekstual skor, biaya, jarak.
6. **Kepadatan:** rapikan kartu/detail, facilities, accordion, serta anchor tujuan.
7. **Panduan dan sekitar:** selesaikan bantuan pengguna baru dan informasi lingkungan.
8. **Validasi:** jalankan pemeriksaan kode dan skenario browser, perbaiki masalah yang ditemukan.
9. **Penyerahan:** dokumentasikan hasil, bukti, keterbatasan aktual, dan perintah commit/push/migrasi bagi Calvin.

Jika ada informasi yang benar-benar menghalangi keputusan produk, ajukan pertanyaan singkat sambil melanjutkan pekerjaan independen. Jangan berhenti pada audit atau usulan saja. Jika tool atau environment membuat suatu pemeriksaan tidak dapat dijalankan, laporkan tepat pemeriksaan itu dan jangan menyebutnya lulus.

### 14. Pengujian yang wajib

Gunakan scripts yang sudah tersedia di `package.json`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Jika kontrak SQL, pemilihan kamar, atau filter berubah, tambahkan pengujian pgTAP yang relevan dan jalankan pada database lokal uji. Jalankan `npm run cek:skor-db` bila biaya/skor atau pemilihan data yang memengaruhinya berubah dan environment tersedia. Jangan membuat perubahan formula skor hanya untuk memenuhi UI.

Tambah/ubah unit test untuk round-trip multi-tipe URL, URL lama, deduplikasi, nilai invalid, hitungan filter, dan pengosongan filter.

Uji browser pada lebar **360, 390, 768, dan 1440 px**, keyboard, serta reduced motion. Gunakan fixture stabil; mock transport dapat digunakan untuk skenario tertentu, tetapi pengujian filter SQL harus memeriksa hasil backend sebenarnya.

| No. | Skenario | Hasil yang diharapkan |
|---|---|---|
| 1 | Buka beranda, cari lokasi, lalu detail | Alur utama tetap jelas; harga/lokasi/status terbaca. |
| 2 | Simpan dari kartu, buka simpanan, reload | Label dan isi daftar konsisten; tidak perlu login. |
| 3 | Hapus simpanan dari kartu/detail/daftar | State terkait ikut diperbarui. |
| 4 | Banding dua kos dengan tipe kamar tertentu | Tipe, harga, fasilitas, dan status tetap benar. |
| 5 | Tambah kandidat keempat | Mekanisme mengganti bekerja; tiga kandidat sebelumnya tidak terhapus diam-diam. |
| 6 | Pilih Putra + Campur | Hasil hanya kedua tipe; Putri tidak ikut. |
| 7 | Hapus Putra dari pilihan di atas | Campur tetap aktif. |
| 8 | Tidak ada tipe dipilih / semua tipe dipilih | Keduanya menghasilkan cakupan seluruh tipe. |
| 9 | Buka URL tipe tunggal lama dan URL multi-tipe | Parser, UI, count, dan query konsisten. |
| 10 | Filter kamar mandi dalam pada kos yang punya tipe kamar berbeda | Kamar acuan memenuhi syarat, termasuk harga/status/detail. |
| 11 | Gabungkan harga + kamar mandi + tipe | Satu tipe kamar memenuhi semua syarat tingkat kamar; kos memenuhi tipe penghuni. |
| 12 | Bandingkan daftar utama, promosi, count, dan peta | Semua memakai filter yang sama; promosi tetap terpisah. |
| 13 | Ubah filter cepat saat request masih berjalan | Hasil lama tidak menimpa pilihan baru. |
| 14 | Refresh, share URL, back/forward | Filter, mode tampilan, dan konteks pencarian bertahan. |
| 15 | Tutup FilterSheet lewat back/Escape/tombol | Satu sesi history; pilihan terakhir terjaga dan fokus kembali. |
| 16 | Rentang harga salah dan hasil nol yang valid | Salah input diberi error; hasil nol diberi tindakan pemulihan. |
| 17 | Buka bantuan skor/biaya/jarak dengan tap dan keyboard | Isi sesuai data; bantuan bisa ditutup; fokus kembali. |
| 18 | Ganti tipe kamar pada detail | Biaya, fasilitas, status, ringkasan, dan bantuan ikut berubah. |
| 19 | Klik anchor biaya/fasilitas/sekitar ketika bagian terlipat | Bagian terbuka dan tujuan tidak tertutup sticky bar. |
| 20 | Skor null, biaya belum diketahui, kamar penuh, red flag | Informasi penting tetap terlihat dan tidak dibuat-buat. |
| 21 | Buka panduan pertama kali, lewati, buka ulang | Tidak menghalangi pencarian atau merusak storage. |
| 22 | Data sekitar kosong/sebagian dan harga laundry tidak tersedia | “Belum dicatat” benar; tidak ada tempat/jarak/biaya palsu. |
| 23 | Menu dari header khusus pencarian dan detail HP | Cari, Simpanan, Bandingkan, dan bantuan dapat dicapai. |
| 24 | HP, PC, zoom 200%, keyboard, reduced motion | Label terbaca, tidak ada overflow halaman, CTA tidak menutupi konten. |
| 25 | Urut Termurah/Terdekat/Skor tertinggi setelah filter | Urutan utama tetap benar dan independen dari promosi. |
| 26 | Mode demo dan kontak | Label contoh tetap ada; kontak mengikuti perilaku demo yang berlaku. |

### 15. Bukti dan keluaran akhir

Berikan:

1. Ringkasan perubahan yang menjawab enam arahan.
2. Tabel temuan kuesioner → implementasi → lokasi → bukti verifikasi.
3. Daftar file penting, migrasi baru, dan perubahan kontrak data bila ada.
4. Screenshot hasil HP dan PC untuk kartu, detail, filter, navigasi, bantuan, panduan, dan sekitar. Simpan bukti di folder baru agar tidak menimpa bukti versi 2.
5. Hasil pemeriksaan: perintah yang benar-benar dijalankan, hasilnya, dan pemeriksaan yang belum bisa dilakukan.
6. Catatan singkat di `/Users/calvinn/KosBahagia/docs/hasil-iterasi-v3.md`. Bedakan hasil implementasi/pengujian internal dari hasil pengujian responden baru.
7. Perintah yang dapat dijalankan Calvin untuk commit dan push, dengan daftar file hasil tugas yang spesifik.
8. Jika backend berubah, urutan penerapan migrasi dan deployment agar frontend tidak memakai RPC yang belum tersedia. Ini instruksi untuk Calvin, bukan tindakan otomatis pada produksi.
9. Daftar keterbatasan data atau kebutuhan yang memang tersisa.

**Definisi selesai:** enam arahan diterapkan end-to-end, jalur keputusan pengguna menjadi lebih jelas, regresi versi 2 diperiksa, dan hasil dapat direview Calvin.

### 16. Validasi kembali dengan pengguna

Setelah implementasi, siapkan skenario uji singkat untuk pengujian berikutnya. Jangan mengklaim UX versi 3 sudah meningkat secara terukur sebelum pengujian tersebut dilakukan.

Tugas untuk peserta tanpa dibantu:

1. Temukan kos sesuai budget, tipe penghuni, dan kamar mandi dalam.
2. Jelaskan total bulanan, komponen estimasi, arti skor, serta acuan jaraknya.
3. Simpan satu pilihan dan tunjukkan cara membuka simpanan.
4. Bandingkan dua pilihan dan jelaskan perbedaannya.
5. Cari laundry/transportasi di sekitar kos.
6. Kembali ke pencarian tanpa kehilangan kebutuhan yang dipilih.

Catat keberhasilan tugas, waktu, salah tekan, keraguan, dan apakah peserta membutuhkan bantuan. Gunakan pertanyaan lanjutan yang netral, lalu masukkan temuan ke grid versi 3.

Target kualitatifnya: pengguna menemukan tindakan, memahami angka, dan menyelesaikan filter dengan lebih sedikit kebingungan. Angka baseline tetap memakai laporan asli; hasil baru hanya ditulis setelah data dikumpulkan.

---

## Catatan penyusun untuk Calvin

Prompt ini memanfaatkan screenshot dan kode repository yang tersedia pada 7 Oktober 2026. Pemeriksaan kode menunjukkan beberapa fondasi sudah ada: ringkasan keputusan, bantuan arti skala, fasilitas kamar/bersama, state simpan/banding, navigasi bagian, biaya estimasi/sementara, dan promosi terpisah. Karena itu, instruksi mengutamakan perbaikan kejelasan serta penggunaan kembali komponen tersebut.

Temuan teknis merupakan hasil pemeriksaan kode, bukan bukti pengujian browser pada sesi penyusunan prompt. Dokumen ini tidak menyatakan bug sudah diperbaiki atau seluruh skenario pengujian sudah dijalankan.
