# Hasil: kos asli di Jl. Sandang

Tanggal: 26 Oktober 2026. Dasar: permintaan Calvin untuk mengisi salah satu kos dengan kosnya sendiri (foto dan video
di `Downloads/Kos Bahagia`), mengedit videonya dulu, menjaga ukuran foto dan video tetap ringan, dan membuat peta jalan
dari kampus ke kos dengan screenshot Google Maps sebagai panduan.

**Status.** Diterapkan dan diuji di lokal. **Belum** di-commit, di-push, atau di-deploy. Database cloud tidak disentuh.

## Kos yang diganti

Slot **Kost Sandang Mulia** (slug `kost-sandang-mulia`, id tetap). Dipilih karena di data contoh kos ini memang sudah
berada di Jl. Sandang. Namanya masih nama contoh dan perlu diganti kalau kos ini punya nama asli.

| Sudah asli (dari foto, video, dan screenshot) | Masih data contoh |
|---|---|
| 9 foto + 1 foto jalan depan untuk langkah rute | Nama kos |
| Video tur kamar | Harga, biaya bulanan, deposit, biaya masuk |
| Titik lokasi (dari screenshot) dan alamat jalan | Skor dan hasil ukur (kebersihan, kedap suara, dB) |
| Rute 600 m dan waktu tempuh: jalan kaki 7, motor 3, mobil 4 menit | Aturan, tipe penghuni (campur), kontak/WhatsApp, nama surveyor |
| 3 lantai tanpa lift; tipe kamar AC + kamar mandi dalam | Ketersediaan (2 kamar kosong), jumlah kamar |
| Fasilitas yang terlihat: AC, kamar mandi dalam, kasur, lemari, meja belajar, parkir motor, CCTV, ruang bersama, jemuran | Fasilitas yang tidak terlihat (WiFi, water heater, mesin cuci, dll.) |
| Catatan surveyor: 3 hal baik, 3 hal yang perlu diketahui | Minimarket, warung, laundry, transportasi di sekitar |
| Tanggal survei 13 September 2026 (dari EXIF foto) | Ukuran kamar 3×3 m (perkiraan dari video) |

Di situs: label **"Foto dan video asli"** di pojok galeri (tidak menggeser tata letak), dan kalimat di bagian Catatan
surveyor: "Foto, video, lokasi, dan rute kos ini asli, diambil 13 September 2026. Harga, skor, aturan, dan kontaknya
masih data contoh." Banner prototipe dan penjelasan data contoh tidak lagi menyebut *semua* foto sebagai contoh.

## Foto

- Dari 51 JPG dipakai 6: tampak depan, ruang bersama, koridor, ruang duduk, parkir, rooftop, plus jalan depan untuk
  langkah terakhir rute. Sesi foto tidak memotret kamar, jadi foto kamar (3) diambil dari frame video 4K yang bersih.
- **Disamarkan** sebelum diekspor: spanduk iklan les Mandarin di gerbang (wajah dan nomor HP pihak ketiga), dua orang di
  rooftop, dan pelat motor di luar gerbang pada foto parkir. File ARW tidak dipakai.
- 1600 px, WebP q78 (q68 kalau masih di atas 160 KB), blurhash. Total foto 0,9 MB di repo. Yang benar-benar dikirim ke
  HP lewat `next/image` berupa AVIF **14–35 KB per foto**.

## Video

- 37 klip mentah (4K vertikal, ±7 GB). Tidak dipakai: `20260904_C6494` (acara lain), klip berisi orang, dan klip
  presenter yang berbicara.
- Hasil edit `public/media/sandang/tur-kamar.mp4`: **21 detik, 720×1280, H.264, tanpa suara, 1,7 MB**, poster 30 KB.
  Urutan: kamar (pan) → kasur → meja belajar → kamar mandi dalam → AC di atas pintu → penutup "600 m dari BINUS
  Anggrek, 7 menit jalan kaki". Crossfade 0,4 detik, warna sedikit dinaikkan, label kecil Plus Jakarta Sans.
- Di situs: tombol **"Video kamar (0:21, 1,7 MB)"** di galeri. Video baru diunduh setelah diketuk (diperiksa: halaman
  dimuat tanpa request video), diputar layar penuh dengan kontrol bawaan, tidak autoplay bila reduced motion. Tombol
  kembali di HP menutupnya.
- Skema: jenis media baru `video` (migrasi `20261026000100_media_video.sql`); poster, durasi, dan ukuran disimpan di
  kolom `tur`.
- Edit bisa diulang: `scripts/proses-media-sandang.py` (perintah ada di kepala file).

## Rute kampus ke kos

Mengikuti rute motor tercepat di screenshot (600 m). Garis jalannya diambil dari OpenStreetMap (gratis): gerbang
BINUS Anggrek → Jl. Rawa Belong → Jl. KH Syahdan → Jl. U → Jl. Sandang (di OSM ruas ini bernama "Jalan Rawa Belong II
D"). Titik kos dihitung dari posisi "Lokasi Anda" di screenshot, ±60 m di timur ujung Jl. U.

1. Dari gerbang BINUS Anggrek, keluar ke Jl. Rawa Belong lalu ke kiri (utara) ±80 m
2. Belok kanan ke Jl. KH Syahdan, lurus ±270 m
3. Belok kanan ke Jl. U, tepat di depan kampus BINUS Syahdan, lurus ±150 m sampai ujung
4. Belok kiri ke Jl. Sandang; kos ±50 m di kanan jalan, gerbang hitam nomor 6 (dengan foto jalan depan)

- **Cara ke sini**: untuk kos dengan rute tercatat, gambar kini mengikuti bentuk jalan sebenarnya dengan skala: nama
  jalan, skala 100 m (layar ≥640 px), atribusi OpenStreetMap, dan chip waktu tempuh jalan kaki, motor, mobil. Kos lain
  tetap memakai ilustrasi lama.
- **Lihat peta asli**: garis biru mengikuti jalan dari gerbang kampus, bukan lagi garis lurus putus-putus.

## Data dan database

- `supabase/seed/generate.ts`: slot diisi data asli tanpa menggeser PRNG. **49 kos lain identik byte per byte** di
  `01_seed.sql` (dibandingkan dengan versi sebelumnya).
- `supabase/patch/kos-nyata-sandang.sql` (dibuat oleh generator): mengganti satu kos di database yang sudah berisi seed;
  baris `kos` diperbarui di tempat, baris turunannya diganti.
- Database **lokal**: migrasi diterapkan (`supabase migration up --local`), lalu patch. Data lokal terakhir di-reset
  3 Oktober, jadi Anggrek Cakra sudah lewat 30 hari ("Belum dikonfirmasi") dan beberapa uji gagal karena umur data.
  Cap waktu relatif data seed digeser +22 hari agar sama dengan seed baru; tidak ada baris yang dihapus dan akun tidak
  disentuh. Laporan ketersediaan "pemilik" untuk Kos Putri Melati pukul 07.28 WIB hari ini tidak diubah.
- **Cloud tidak disentuh.** Untuk tayang di produksi perlu tiga langkah, dan itu keputusanmu: jalankan migrasi
  `20261026000100_media_video.sql`, jalankan `supabase/patch/kos-nyata-sandang.sql` (mengandaikan cloud diisi dari seed
  yang sama), lalu deploy. File media ada di `public/media/sandang/` sehingga ikut deploy.

## Perbaikan kecil yang ikut

- Teks 200% di HP: bar kontak bawah dan baris status ketersediaan melebar saat status "Belum dikonfirmasi" (bug lama
  yang baru muncul karena data lokal menua). Sekarang tombol turun ke bawah harga dan teks status boleh pindah baris.
- Uji 31 (`uji-ux-v3-ulang.py`) mengandaikan blok promosi hanya berisi satu kartu; sekarang menerima satu (lebar penuh)
  atau dua (masing-masing ±49%), tergantung data.
- Dua literal pgTAP berubah karena kos ini: 6 kos (bukan 5) dengan skor kebersihan dan kedap ≥ 4, dan 3 kos (bukan 2)
  dalam 500 m dari titik kampus.
- Uji motion 14 (`uji-motion-v31.py`): batas loop "halaman diam di sekitar judul" memakai `scrollY` yang ikut bergerak,
  jadi loop berjalan sampai dasar halaman (±1.900 posisi, belasan menit per mesin; macet total saat layar Mac tidur).
  Sekarang batasnya dihitung sekali; grup 12–15 selesai dalam 1 menit. Halaman aplikasinya sendiri tidak berubah.
- Catatan "foto asli" sempat diletakkan di bawah galeri dan mendorong tawaran tutorial keluar layar pertama di HP (uji
  tutorial 3 menangkapnya). Sekarang di galeri hanya label kecil, kalimat lengkapnya di Catatan surveyor.

## Hasil pemeriksaan

| Perintah | Hasil |
|---|---|
| `npm run lint`, `npm run typecheck` | Bersih |
| `npm test` | 129 lulus (3 tes baru untuk rute jalan) |
| `npm run build` | Lolos |
| `npx supabase test db` | 135/135 |
| `npm run cek:skor-db` | 0 beda |
| `python3 scripts/uji-ux-v3.py` | 27/27 (Chromium dan WebKit) |
| `python3 scripts/uji-ux-v3-ulang.py` | 22/22 (Chromium dan WebKit) |
| `python3 scripts/uji-tutorial.py` skenario 1–13 | 26/26 (Chromium dan WebKit); skenario 14 (login mitra) tidak dijalankan |
| `python3 scripts/uji-motion-v31.py` | 32/32 (Chromium dan WebKit); cek StrictMode di `next dev` tidak dijalankan (perlu `DEV=`) |

Diperiksa manual di browser (HP 375 px, tablet, PC 1280 px): galeri dan label, tombol dan pemutar video, minimap rute,
peta asli dengan garis rute, kartu di hasil pencarian. Belum diuji di Safari asli atau HP fisik.

## Perlu darimu

1. Nama kos asli (sekarang masih "Kost Sandang Mulia").
2. Harga sewa dan biaya (listrik, air, WiFi, deposit), tipe kos (putra/putri/campur), aturan, jumlah kamar, dan ukuran
   kamar. Kontak tetap mode demo, tidak membuka WhatsApp.
3. Apakah ingin versi video dengan presenter (klip yang menjelaskan kamar secara lisan)?
4. Apakah migrasi dan patch mau dijalankan ke cloud.

## Perintah commit dan push

Dokumen audit, prompt tindak lanjut audit, dan file presentasi 3.1 yang belum terlacak tidak ikut.

```bash
cd /Users/calvinn/KosBahagia
```

```bash
git add components/kos/DetailKos.tsx components/kos/Minimap.tsx components/kos/detail components/layout/BannerDemo.tsx components/ui/Icon.tsx lib/demo.ts lib/kos/rute.ts lib/kos/rute.test.ts lib/supabase/types.ts public/media/sandang scripts/proses-media-sandang.py scripts/uji-ux-v3-ulang.py scripts/uji-motion-v31.py supabase/migrations/20261026000100_media_video.sql supabase/patch/kos-nyata-sandang.sql supabase/seed/01_seed.sql supabase/seed/generate.ts supabase/tests/cari_kos.test.sql docs/hasil-kos-nyata-sandang.md
```

```bash
git status
```

```bash
git commit -m "Real kos on Jl. Sandang with photos, room video and street route"
```

```bash
git push
```
