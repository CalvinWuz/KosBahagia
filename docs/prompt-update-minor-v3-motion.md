# Prompt update minor versi 3 — Motion dan ringkasan kondisi kos

Tanggal: 9 Oktober 2026.

Dokumen ini merupakan prompt lanjutan untuk Claude Code setelah UX versi 3 selesai diimplementasikan. Fokusnya hanya tiga tambahan dari Calvin: perpindahan lebih halus, intro logo saat refresh, serta penyederhanaan informasi kebersihan dan kedap suara.

Dokumen ini tidak mengimplementasikan perubahan aplikasi. Calvin melakukan commit dan push sendiri.

## Cara memakai

Buka Claude Code pada `/Users/calvinn/KosBahagia`, kemudian kirim:

> Baca seluruh `/Users/calvinn/KosBahagia/docs/prompt-update-minor-v3-motion.md`. Jalankan bagian “Prompt implementasi” sebagai update minor pada versi 3 yang sekarang. Baca implementasi terbaru terlebih dahulu; jangan mengulang enam pekerjaan versi 3 yang sudah selesai. Kerjakan kode dan verifikasinya. Aku akan commit dan push sendiri.

## Permintaan Calvin

> Perpindahan dari Cari kos ke halaman lain masih kaku. Buat lebih smooth dan animasikan bila membantu. Saat refresh, logo Kos Bahagia muncul, senyumnya muncul, lalu logo mengecil dan bergerak ke tempat logo di header. Informasi kebersihan dan kedap suara tetap bagus, tetapi terlalu banyak; sederhanakan tampilannya.

Versi 3 tetap menjadi dasar. Ini update minor, bukan pembangunan ulang atau penambahan fitur bisnis baru.

---

## Prompt implementasi

### 1. Tujuan dan lingkup

Kerjakan tiga hasil berikut pada website Kos Bahagia:

1. Navigasi antarhalaman terasa halus, cepat, dan konsisten.
2. Logo memiliki intro khas saat refresh: muncul → senyum tergambar → mengecil dan menuju header.
3. Kebersihan dan kedap suara mudah dipahami dalam satu pandangan; data lengkap tetap tersedia ketika dibutuhkan.

Pilih motion yang ringan dan sesuai karakter Kos Bahagia. Pertahankan logo rumah tersenyum, font Plus Jakarta Sans, warna, dan komponen versi 3 yang sudah ada.

Lingkup pekerjaan ada pada frontend, motion, penyajian informasi, aksesibilitas, dan verifikasi alur. Perubahan formula skor, database, aturan filter, serta urutan pencarian tidak diperlukan untuk tugas ini.

Calvin akan commit dan push sendiri. Selesaikan implementasi lokal yang siap direview; berikan perintah penyerahan yang jelas.

### 2. Baca kondisi terbaru

Mulai dengan `git status --short` dan pertahankan perubahan pengguna.

Baca instruksi repository:

- `/Users/calvinn/KosBahagia/AGENTS.md`.
- `/Users/calvinn/KosBahagia/CLAUDE.md`.
- Instruksi induk dan referensi RTK yang berlaku.
- `/Users/calvinn/KosBahagia/docs/hasil-iterasi-v3.md`.
- `/Users/calvinn/KosBahagia/docs/prompt-ux-v3-kuesioner.md` sebagai konteks enam perubahan yang sudah selesai.

Baca guide Next.js yang terpasang sebelum menentukan mekanisme navigasi:

- `/Users/calvinn/KosBahagia/node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`.
- `/Users/calvinn/KosBahagia/node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`.
- Dokumentasi template/layout/link yang relevan dengan pilihan implementasi.

Gunakan `ui-ux-pro-max` untuk kenyamanan interaksi dan aksesibilitas, serta `frontend-design` untuk kualitas motion. Terapkan rekomendasi yang relevan pada website dan design system ini.

Periksa versi runtime, React, dan TypeScript aktual. Jangan menganggap contoh API dari versi lain langsung dapat dipakai. Jangan mengganti versi framework hanya demi animasi.

### 3. Pertahankan fondasi versi 3

- Label Simpan/Bandingkan dan state tersimpan/dalam banding tetap jelas.
- Menu utama, panduan singkat, filter multi-tipe, dan filter kamar mandi dalam tetap bekerja.
- Harga, status, fasilitas, serta kandidat banding tetap mengikuti tipe kamar yang dipilih.
- State URL, scroll yang perlu dipulihkan, dan localStorage tidak hilang akibat wrapper animasi.
- Skor tetap dihitung dari sumber/rubrik yang sama. Jangan mengubah angka untuk membuat copy terlihat bagus.
- Paket berbayar tetap tidak memengaruhi skor atau menyembunyikan red flags.
- Peringatan keselamatan, biaya belum diketahui, status penuh, serta data perlu dikonfirmasi tetap terlihat.
- Label contoh/ilustrasi dan perilaku kontak mode demo tetap dijaga.
- Surface mitra dan pencari kos tetap terpisah.

Permintaan Calvin tentang transisi dan intro logo merupakan arahan eksplisit untuk update ini. Terapkan dengan menjaga kecepatan pencarian, aksesibilitas, dan reduced motion meskipun instruksi motion lama lebih terbatas.

### 4. Transisi halaman yang halus

#### 4.1 Pola gerak

Gunakan transisi pendek dengan titik orientasi yang tetap:

- Pergantian konten utama: crossfade sekitar **180–240 ms**.
- Perpindahan posisi, bila diperlukan: kecil, sekitar **4–8 px**, bukan sapuan satu layar penuh.
- Header, logo header, bar navigasi, dan elemen global tidak ikut terbang ketika konten berganti.
- Menu/Sheet/accordion memakai gerak yang konsisten dengan komponen yang sudah ada, sekitar **150–250 ms**.
- Jangan menambahkan animasi masuk pada setiap elemen daftar. Konten tidak muncul satu per satu dengan delay panjang.

Alur utama yang perlu terasa halus:

- Beranda → Cari kos.
- Cari kos → Detail → kembali ke hasil.
- Cari kos/Detail → Simpanan.
- Cari kos/Detail → Bandingkan.
- Menu → Cara menggunakan / Cara kami menilai.
- Pergantian detail antar-kos melalui tautan yang tersedia.

Jika menerapkan arah maju/mundur, arah harus sesuai konteks navigasi. Untuk navigasi yang arahnya tidak dapat diketahui dengan benar, gunakan crossfade netral. Browser Back tidak boleh selalu terlihat seperti masuk ke halaman baru.

#### 4.2 Integrasi teknis

Utamakan API transisi yang benar-benar tersedia pada versi Next.js/React terpasang, berdasarkan guide lokal. Gunakan satu mekanisme yang jelas.

Pastikan:

- Posisi wrapper mengikuti pola framework yang benar. Layout yang persisten tidak otomatis menghasilkan enter/exit seperti page yang berubah.
- Header tetap stabil saat konten bertransisi.
- Browser tanpa dukungan tetap bernavigasi normal, dengan fallback ringan bila diperlukan.
- SSR dan metadata tetap berfungsi; jangan mengubah semua halaman menjadi Client Component.
- Tidak ada timeout yang menahan navigasi hanya agar animasi selesai.
- Tidak ada layar kosong antara halaman keluar dan halaman masuk.
- `Link`, prefetch, loading UI, tautan eksternal, hash anchor, dan link yang dibuka di tab baru tetap bekerja.
- Jangan mengambil alih semua click pada anchor atau semua history event.
- Navigasi cepat berturut-turut dapat membatalkan/menyelesaikan animasi sebelumnya secara aman.
- Transisi tidak menambahkan entry history palsu.

Perubahan query di halaman yang sama bukan navigasi ke halaman baru:

- Filter, urutan, pagination, pusat peta, dan pilihan tipe kamar tidak memutar ulang intro halaman.
- Toggle Daftar/Peta tetap menggunakan pola in-place yang ringan.
- Pemilihan filter tidak mereset state, membuat seluruh daftar menghilang, atau menunggu animasi sebelum menjalankan pencarian.
- Peta/360° tidak dimuat ulang hanya karena wrapper animasi; hindari transisi snapshot yang membuat canvas berkedip atau hitam.

Gunakan skeleton/progres ketika memang ada request yang belum selesai. Animasi tidak menggantikan feedback loading atau menyembunyikan error.

#### 4.3 Batas performa

Gunakan opacity/transform; hindari blur besar, perubahan layout per frame, atau screenshot viewport buatan yang berat.

Pertahankan dynamic import untuk peta, panorama, dan komponen berat. Utamakan CSS, Web Animations API, atau integrasi React/Next.js yang tersedia. Dependency motion baru hanya jika ada kebutuhan nyata yang belum dapat ditangani alat yang ada; jelaskan alasan dan dampaknya.

### 5. Intro logo saat refresh

#### 5.1 Urutan visual

Durasi sasaran keseluruhan sekitar **1–1,3 detik**:

1. **Logo muncul:** mark rumah muncul di tengah viewport, dengan fade dan scale kecil sekitar 200–250 ms.
2. **Senyum terbentuk:** garis senyum putih tergambar dari awal ke akhir sekitar 250–350 ms. Bentuk akhirnya sama dengan logo asli.
3. **Logo menuju header:** mark mengecil dan bergerak mulus selama sekitar 450–650 ms ke slot logo header, lalu menyerahkan tampilan ke logo asli.

Tahap boleh sedikit overlap agar tidak terasa seperti tiga jeda terpisah. Hindari pantulan besar, putaran, confetti, dan efek tambahan yang mengaburkan urutan ini.

Animasikan mark rumah, bukan seluruh wordmark “Kos Bahagia”. Wordmark dan menu di header tetap stabil.

#### 5.2 Target akhir harus nyata

Gunakan elemen logo header sebagai anchor yang jelas, misalnya melalui ref atau atribut data. Ukur posisi dan ukuran akhirnya dengan `getBoundingClientRect()`; jangan memakai koordinat tetap untuk desktop/HP.

- Gerak berakhir pada mark header yang memang terlihat.
- Cegah logo ganda ketika overlay menyerahkan tampilan ke header.
- Bila logo asli disembunyikan sesaat, sembunyikan hanya visual mark tersebut dan pulihkan pada semua jalur selesai/batal/error.
- Jangan menyembunyikan seluruh header atau tautan beranda.
- Jika viewport, orientasi, atau layout berubah selama intro, batalkan atau sesuaikan gerak secara aman.
- Posisi tidak dihitung dengan membaca layout terus-menerus setiap frame.

**Kondisi mobile penting:** header global saat ini disembunyikan pada `/cari` dan `/kos/[slug]`; kedua halaman punya bar sendiri. Jangan menerbangkan logo ke header yang tersembunyi atau keluar layar.

Untuk halaman tersebut:

- Jika logo sudah memiliki slot terlihat pada implementasi terbaru, gunakan slot itu.
- Jika belum, boleh menambahkan mark beranda yang ringkas pada bar mobile hanya bila tetap muat, tidak menggeser kontrol utama, dan nama aksesibelnya jelas.
- Jika tidak tersedia slot yang layak atau pengukuran gagal, lewati gerak ke header dan akhiri intro dengan fade singkat. Pertahankan bar yang nyaman; jangan menambah header kedua.
- Dokumentasikan fallback yang dipilih. Tahap penuh wajib bekerja pada beranda HP dan PC serta halaman lain yang mempunyai anchor terlihat.

#### 5.3 Kapan intro berjalan

- Jalankan pada **refresh dokumen/full reload**, sebagaimana permintaan Calvin.
- Jangan menjalankannya lagi saat navigasi client-side, perubahan query, pembukaan Sheet, pergantian kamar, atau `router.refresh()` yang tidak memuat ulang dokumen.
- Refresh berikutnya tetap dapat memainkan intro; jangan memakai penanda permanen “sudah pernah dilihat” yang menonaktifkan semua refresh selanjutnya.
- Satu reload menghasilkan satu intro, termasuk ketika development StrictMode menjalankan efek lebih dari sekali.
- Pemulihan halaman melalui Back/Forward Cache tidak memutar ulang intro.
- Jika deteksi reload atau API browser yang diperlukan tidak tersedia, fallback ke header normal.

#### 5.4 Tidak menghambat pengguna

Intro merupakan lapisan dekoratif:

- Halaman tetap dirender dan dapat digunakan selama intro.
- Lapisan menggunakan `pointer-events: none` dan tidak menjebak fokus.
- Gunakan `aria-hidden` pada duplikat dekoratif.
- Tidak mengunci scroll atau menunggu fetch data listing selesai.
- Jangan menambah waktu minimum splash/loader yang membuat pencarian lambat.
- Jika pengguna berpindah halaman atau mulai berinteraksi sebelum selesai, akhiri intro dengan aman.
- Tanpa JavaScript, halaman dan logo header tetap terlihat normal.
- Dengan reduced motion, tampilkan logo header langsung dan lewati gerak dekoratif.

Pisahkan cleanup intro dari mekanisme transisi halaman. Animasi, listener, observer, serta frame yang tertunda harus dibersihkan pada unmount, pembatalan, dan pergantian preferensi motion.

### 6. Sederhanakan kebersihan dan kedap suara

#### 6.1 Bentuk default

Gunakan satu bagian ringkas **Kebersihan & kedap suara** dengan dua kartu/baris:

| Informasi | Isi yang langsung terlihat |
|---|---|
| Kebersihan | Nama aspek, angka `/5`, label singkat dari rubrik, dan paling banyak satu kalimat penjelasan bila diperlukan. |
| Kedap suara | Nama aspek, angka `/5`, label singkat, dan satu kalimat arti praktisnya. |

Contoh bentuk, bukan angka yang harus dimasukkan:

- **Kebersihan 4,5/5 — Sangat bersih.**
- **Kedap suara 2/5 — Berisik. Suara dari kamar sebelah masih terdengar.**

Gunakan nilai dan kata dari data yang sedang dilihat. Angka rendah harus tetap memberi gambaran kekurangan; jangan menggantinya dengan kata positif.

Tambahkan satu konteks survei ringkas untuk bagian ini: tanggal, kamar yang diukur bila diketahui, serta label contoh bila berlaku. Sediakan tombol bantuan **Cara dinilai** dengan akses tap/keyboard.

HP boleh menumpuk dua kartu secara vertikal; PC dapat berdampingan. Tidak perlu menampilkan tabel raw, beberapa batang meter, metode, serta paragraf batas ukur sekaligus dalam keadaan tertutup.

#### 6.2 Rincian tetap tersedia

Pindahkan bukti ke dua accordion yang default-nya tertutup:

- **Lihat bukti kebersihan**: skor kamar mandi/dapur/koridor, pihak pembersih, jadwal membersihkan, dan pengangkutan sampah yang tercatat.
- **Lihat bukti kedap suara**: material tembok, dB ambient/tes/selisih, kamar yang diukur, sumber bising, serta batas pengukuran.

Pakai kembali komponen Accordion versi 3. Hindari beberapa accordion bersarang untuk membaca satu bukti.

Pertahankan:

- Angka dan rumus persis seperti sebelumnya.
- Makna “makin tinggi skor kedap, makin baik menahan suara”.
- dB sebagai hasil ukur, bukan nilai `/5`.
- Label data yang belum tersedia. Jangan membuat nilai nol atau nilai rata-rata palsu.
- Keterbatasan pengukuran tetap dapat dibaca bersama buktinya.
- Red flags tetap terbuka dalam panel keselamatan dan tidak dipindahkan ke accordion bukti.
- Anchor/navigasi bagian menuju isi yang terlihat; anchor bukti tertentu membuka rincian yang diperlukan.

#### 6.3 Kurangi pengulangan antarbagiannya

Saat ini `SkorRincian` menampilkan dua skor rubrik, kemudian `BuktiKebersihan` menampilkan ulang angka dan banyak bukti.

Rapikan pembagian tugas:

- **Skor Bahagia**: nilai total `/10`, satu penjelasan singkat, dan accordion perhitungan lima komponen.
- **Kebersihan & kedap suara**: tempat utama untuk dua skor `/5`, arti praktis, dan bukti yang dapat dibuka.
- Jika dua indikator tetap perlu muncul dekat Skor Bahagia, gunakan tautan ringkas menuju bagian kondisi; jangan menduplikasi kartu, penjelasan, dan metode lengkap.
- Dalam rincian formula, tampilkan bobot/nilai komponennya; referensikan bukti kondisi yang sudah ada daripada mengulang seluruh raw measurement.
- Bantuan `ArtiSkala` tetap digunakan sebagai satu sumber penjelasan, dengan copy ringkas dan nama pemicu yang jelas.

Pada kartu hasil dan tabel banding, pertahankan versi ringkas yang konsisten. Jangan menambahkan seluruh bukti hanya untuk menyeragamkan komponen.

**Sasaran:** tampilan default lebih pendek dan mudah dipindai, sementara pengguna tetap dapat membuka semua informasi yang relevan.

### 7. Bagian kode yang diperiksa

| Area | Titik awal |
|---|---|
| Shell dan layout pencari | `/Users/calvinn/KosBahagia/app/(user)/layout.tsx`, halaman di route group `/Users/calvinn/KosBahagia/app/(user)/` |
| Header dan slot logo | `/Users/calvinn/KosBahagia/components/layout/Header.tsx`, `/Users/calvinn/KosBahagia/components/layout/Navigasi.tsx`, `/Users/calvinn/KosBahagia/components/ui/Logo.tsx` |
| Header mobile dan navigasi hasil | `/Users/calvinn/KosBahagia/components/cari/HasilPencarian.tsx`, `/Users/calvinn/KosBahagia/components/kos/DetailKos.tsx` |
| History dan feedback tautan | `/Users/calvinn/KosBahagia/lib/navigasi.ts`, `/Users/calvinn/KosBahagia/components/ui/StatusTaut.tsx` |
| Kondisi dan skor | `/Users/calvinn/KosBahagia/components/kos/detail/BuktiKebersihan.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/SkorRincian.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/ArtiSkala.tsx` |
| Nilai dan label | `/Users/calvinn/KosBahagia/lib/skala.ts`, `/Users/calvinn/KosBahagia/lib/format.ts`, `/Users/calvinn/KosBahagia/lib/scoring.ts` |
| Accordion dan anchor | `/Users/calvinn/KosBahagia/components/ui/Accordion.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/NavBagian.tsx`, `/Users/calvinn/KosBahagia/components/kos/detail/bagian.tsx` |
| Token motion | `/Users/calvinn/KosBahagia/app/globals.css` |

Komponen baru dapat ditambahkan bila memisahkan tanggung jawab motion dengan jelas. Hindari beberapa komponen yang masing-masing menangkap seluruh event navigasi.

### 8. Standar dan batas pekerjaan

- TypeScript strict dan pola Next.js yang sesuai versi terpasang.
- Token motion, easing, dan keyframes disimpan terpusat.
- Hormati `prefers-reduced-motion` pada CSS dan animasi JavaScript; jangan mengandalkan CSS saja untuk menghentikan WAAPI.
- Header dan kontrol tetap bisa digunakan pada 360 px, landscape, dan zoom 200%.
- Fokus keyboard, `aria-expanded`, serta urutan tab tetap benar.
- Nama class/path baru mengikuti konvensi repository.
- Tidak ada migrasi, perubahan scoring, fitur booking/review/pembayaran, atau redesign beranda menyeluruh untuk update minor ini.
- Jangan commit, push, deploy, mengubah environment, atau menerapkan perubahan ke cloud.
- Hasil pengujian internal dibedakan dari validasi responden baru.

### 9. Verifikasi

Jalankan scripts relevan yang sudah ada:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Unit test tambahan hanya bila ada logika baru yang perlu diuji, misalnya deteksi reload atau perhitungan target. Utamakan pengujian browser untuk perilaku animasi. Jangan menulis test yang hanya mengulang kode.

Uji di 360, 390, 768, dan 1440 px; reduced motion; keyboard; serta browser alternatif yang tersedia.

| No. | Skenario | Hasil yang harus terlihat |
|---|---|---|
| 1 | Beranda → Cari → Detail → kembali | Transisi halus; lokasi/filter/scroll tetap masuk akal; header tidak melompat. |
| 2 | Cari → Simpanan/Bandingkan/bantuan | Animasi konsisten; state tersimpan dan kandidat tetap benar. |
| 3 | Navigasi cepat berulang | Tidak ada blank page, overlay tertinggal, atau klik yang diblokir. |
| 4 | Ubah filter, query, urutan, kamar, dan mode peta | Tidak memainkan ulang intro atau seluruh transisi halaman; hasil tetap benar. |
| 5 | Refresh beranda di HP/PC | Satu intro: rumah muncul, senyum tergambar, logo berakhir di slot header. |
| 6 | Refresh ulang | Intro dapat berjalan lagi; penanda session lama tidak memblokirnya. |
| 7 | Refresh halaman dengan header mobile khusus | Target terlihat dan nyaman atau fallback aman; tidak terbang ke elemen tersembunyi. |
| 8 | Resize/scroll/navigasi saat intro | Target disesuaikan atau intro dibatalkan; logo asli selalu dipulihkan. |
| 9 | JavaScript mati / dukungan transisi tidak ada | Website dan header normal; tidak ada konten yang selamanya tersembunyi. |
| 10 | Reduced motion sejak awal atau berubah saat berjalan | Intro dekoratif dilewati/dihentikan; navigasi tetap berfungsi. |
| 11 | Back/forward cache dan StrictMode | Tidak terjadi intro ganda, listener bocor, atau history tambahan. |
| 12 | Buka detail dengan skor tinggi/rendah/null | Dua ringkasan kondisi jelas dan jujur; null bukan nol; label konsisten. |
| 13 | Buka/tutup dua bukti ukur dan bantuan | Semua data lama tetap dapat dibaca; keyboard dan fokus benar. |
| 14 | Anchor menuju kondisi/bukti | Tujuan terlihat, bagian yang diperlukan terbuka, tidak tertutup sticky bar. |
| 15 | Detail dengan red flag dan biaya belum lengkap | Peringatan tetap terbuka dan terlihat; penyederhanaan tidak menyembunyikannya. |
| 16 | Refresh/navigasi ke detail dengan peta/360° | Tidak memuat komponen berat berulang atau menghasilkan canvas hitam. |
| 17 | Zoom 200%, landscape, header dengan teks panjang | Kontrol tetap terbaca; tidak ada overflow halaman atau logo menutupi tombol. |
| 18 | Alur filter multi-tipe, simpan, dan banding per kamar | Perilaku versi 3 tetap bekerja setelah wrapper motion ditambahkan. |

Ambil bukti sebelum/sesudah bagian kondisi. Rekam video pendek untuk transisi dan intro logo, karena screenshot saja tidak membuktikan timing maupun gerak.

Jika browser/environment tidak tersedia, laporkan pemeriksaan yang belum dijalankan. Jangan menulis seluruh skenario lulus berdasarkan inspeksi kode.

### 10. Penyerahan

Selesaikan implementasi dan verifikasi, kemudian berikan:

1. Ringkasan tiga perubahan dan manfaatnya.
2. Daftar file yang berubah.
3. Mekanisme transisi yang dipilih dan fallback browser.
4. Kapan intro berjalan, bagaimana target header diukur, serta fallback header mobile.
5. Bukti bahwa angka/rubrik tetap sama dan data lengkap masih dapat dibuka.
6. Hasil pemeriksaan yang benar-benar dijalankan dan keterbatasan aktual.
7. Rekaman singkat intro/navigasi dan screenshot kondisi default/bukti terbuka pada HP/PC.
8. Catatan hasil update minor, dengan referensi ke hasil versi 3. Jangan mengganti laporan lama seolah temuan baru berasal dari kuesioner.
9. Perintah commit/push dengan file yang spesifik untuk Calvin.

Jangan berhenti pada mockup atau rencana. Terapkan pada kode terbaru, periksa browser, dan perbaiki regresi yang ditemukan.

**Definisi selesai:** navigasi lebih halus tanpa mengorbankan state/kecepatan, intro mengikuti urutan yang diminta dan selesai dengan aman, serta informasi kebersihan/kedap suara jauh lebih ringkas dalam keadaan default tanpa menghilangkan data atau peringatan.

---

## Catatan penyusun

Prompt ini dibuat dari permintaan Calvin dan inspeksi repository pada 9 Oktober 2026. Repository memuat implementasi serta dokumentasi UX versi 3. Pemeriksaan sesi penyusunan menunjukkan belum ada intro logo khusus dan belum ada mekanisme transisi halaman pada bagian layout yang diperiksa; dua skor kondisi masih muncul pada beberapa bagian.

Itu adalah temuan inspeksi kode. Dokumen ini tidak menyatakan perubahan motion sudah diterapkan atau diuji di browser.
