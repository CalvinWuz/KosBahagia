# Hasil: tutorial singkat per bagian

Tanggal: 18 Oktober 2026. Dasar kerja: `docs/prompt-tutorial-singkat-per-bagian.md` (arahan client: "Tutorial singkat
per section, hanya section-section besar saja yang akan kena tutorial, agar tidak terlalu mengganggu client.").
Lanjutan dari versi 3 (`docs/hasil-iterasi-v3.md`) dan 3.1 (`docs/hasil-update-minor-v3-motion.md`).

**Status.** Diterapkan dan diuji di lokal (build produksi + Supabase lokal, data contoh). **Belum** di-commit, di-push,
atau di-deploy. Tidak ada migrasi, endpoint, layanan berbayar, atau dependency baru.

> Semua hasil di sini adalah pengujian internal otomatis (Playwright headless, Chromium dan WebKit) dengan data contoh.
> Belum diuji dengan pengguna atau pemilik kos sungguhan.

---

## 1. Ringkasan

Setiap bagian besar punya petunjuk 1–2 langkah yang muncul **hanya bila pengguna memintanya**. Saat pertama kali
membuka bagian itu ada satu baris kecil **"Butuh petunjuk? Lihat panduan singkat"** dengan tombol tutup; baris ini
ditawarkan sekali per browser. Setelahnya tersedia tombol tenang **"Petunjuk bagian ini"** untuk membuka ulang.
Tidak ada modal, overlay gelap, timer, fokus yang dipindah, atau gulir otomatis sebelum pengguna menekan sesuatu.

| Kelompok | Lokasi | Langkah | Isi |
|---|---|---:|---|
| Pencarian | `/cari` | 2 | **Atur kebutuhanmu** (menyorot bar lokasi + Filter + chip), lalu **Kenali hasil kos** (menyorot kartu hasil pertama). Hasil nol: langkah 2 menjadi **Belum ada yang cocok** dan menyorot kotak saran, bukan kartu. |
| Detail kos | `/kos/[slug]`, satu preferensi untuk semua kos | 2 | **Cek kamar dan biaya** (pemilih kamar + total di Ringkasan), lalu **Baca kondisi dan bukti** (dua kartu kondisi). Kos belum dinilai: langkah 2 menjelaskan bahwa angka belum ada, tanpa sorotan. |
| Simpanan | `/disimpan` (bila ada isi dan berhasil dimuat) | 1 | **Lanjutkan pilihanmu** (menyorot kartu pertama). |
| Bandingkan | `/banding` (bila ada 2–3 kandidat) | 1 | **Lihat perbedaan utama** (menyorot tabel). |
| Ringkasan mitra | `/mitra/dashboard` (sesi valid, ada kos tertaut) | 2 | **Pantau kos Bapak/Ibu** (kos pertama), lalu **Perbarui informasi** (tombol Perbarui ketersediaan / Ubah harga dan foto). |

Isi tiap langkah 19–23 kata. Beranda tidak punya tur: kartu tiga langkah versi 3 dipadatkan menjadi satu baris
"Butuh petunjuk? Lihat panduan singkat" menuju `/cara-menggunakan` (pilihan Calvin). Halaman area, masuk, OTP, daftar,
paket, statistik, token, error, dan halaman statis tidak diberi tutorial.

---

## 2. Cara kerjanya

**Status per kelompok** di `localStorage` `kb:tutorial-bagian:v1`, terpisah dari `kb:simpan`/`kb:banding`, tanpa ID
kos, nomor, atau data sesi. Tanpa kunci = belum ditawarkan; lalu `ditawarkan` (baris benar-benar terlihat ≥50 % di
layar dan intro logo sudah selesai), `ditutup` (tutup/Lewati/Escape), `selesai` (melewati semua langkah). Status hanya
naik, jadi membuka ulang atau kehilangan target tidak pernah menghapus "selesai".

**Tanpa kedip.** Skrip kecil sebelum paint (di kedua root layout) menyalin kelompok yang sudah punya status ke
`<html data-tutorial>`. CSS lalu memilih baris tawaran atau tombol tenang sejak paint pertama, jadi HTML server sama untuk
semua orang dan tidak ada yang hilang/muncul setelah hidrasi. Tanpa JavaScript (`@media (scripting: none)`) tombol
tutorial disembunyikan; halaman Cara menggunakan tetap bisa dibaca.

**Pengguna lama.** Siapa pun yang dulu menutup panduan versi 3 (`kb:panduan = v1`) tidak ditawari otomatis di sisi
pencari; tombol "Petunjuk bagian ini" langsung tersedia. Surface mitra tidak terpengaruh penanda ini.

**Panel.** Inline, nonmodal, tepat di dekat bagian yang dijelaskan: judul, maks. dua kalimat, "langkah n dari 2",
**Berikutnya/Kembali/Selesai**, **Lewati**, dan tombol tutup 44×44 px. Sasaran diberi garis biru lembut (outline),
bukan overlay. Gulir dan pindah fokus ke judul panel hanya setelah tindakan pengguna (buka, Berikutnya, Kembali),
halus kecuali reduced motion. Tidak menambah history.

**Penutupan bersih.** Escape menutup; fokus kembali ke "Petunjuk bagian ini" bila terlihat di layar, kalau tidak ke
judul bagian tempat panel berada (tanpa melompat ke atas). Panel tertutup sendiri tanpa mengubah status bila halaman
berganti, sasaran langkah hilang (mis. mode peta HP), atau lapisan lain terbuka (Filter, Menu, galeri, tur 360°, lewat
kait `saatLapisDibuka` di `lib/navigasi.ts`). Bila langkah berikutnya tidak ada di halaman, tombolnya menjadi
**Tutup**, bukan Selesai.

**Storage diblokir atau rusak.** JSON rusak dianggap kosong; storage yang menolak baca/tulis memakai salinan memori
untuk kunjungan itu saja (tidak dijanjikan bertahan setelah reload).

**Motion 3.1.** Tutorial tidak memutar intro dan tidak membuat transisi halaman. Tawaran baru dicatat "ditawarkan"
setelah `data-intro` hilang. Animasi panel: fade + 4 px, 200 ms, mati saat reduced motion.

---

## 3. File yang berubah

| File | Perubahan |
|---|---|
| `lib/tutorial-bagian.ts` (baru) | Kelompok, status, aturan kelayakan, storage aman + memori, skrip pre-paint |
| `lib/tutorial-bagian.test.ts` (baru) | 8 tes: data rusak, status hanya naik, penanda lama, storage diblokir, "Tawarkan lagi", skrip pre-paint |
| `components/panduan/TutorialBagian.tsx` (baru) | `TawaranTutorial`, `TombolTutorial`, `SlotTutorial` + panel |
| `components/panduan/PanduanSingkat.tsx` | Kartu tiga langkah beranda → satu baris tawaran; petunjuk satu baris `/cari` lama dihapus (diganti tutorial Pencarian) |
| `components/panduan/LangkahPanduan.tsx` | Varian ringkas yang tidak dipakai lagi dihapus |
| `components/panduan/TampilkanPanduanLagi.tsx` | Menjadi **Tawarkan lagi**: tawaran pencari muncul sekali lagi; simpanan, banding, filter, dan mitra tidak disentuh |
| `lib/panduan.ts` | Fungsi panduan lama yang tak terpakai dihapus; penanda v1 tetap dibaca |
| `lib/navigasi.ts` | Kait `saatLapisDibuka` (dipanggil saat Sheet/galeri/360° terbuka) |
| `app/globals.css` | Aturan tawaran/tombol per kelompok, garis sorot, fallback tanpa JavaScript |
| `app/(user)/layout.tsx`, `app/(mitra)/layout.tsx` | Skrip pre-paint tutorial; `suppressHydrationWarning` hanya pada `<html>` mitra (atributnya sendiri) |
| `app/(user)/page.tsx`, `app/(user)/cara-menggunakan/page.tsx` | Baris beranda; bagian "Petunjuk di setiap bagian" |
| `components/cari/HasilPencarian.tsx`, `components/kos/detail/RingkasanKeputusan.tsx`, `components/kos/detail/BuktiKebersihan.tsx`, `components/kos/DaftarSimpanan.tsx`, `components/kos/TabelBanding.tsx`, `app/(mitra)/mitra/dashboard/page.tsx` | Tawaran, tombol, slot langkah, penanda `data-tutorial` stabil |
| `components/kos/KosCard.tsx` | Foto kartu ringkas 80 px di bawah 380 px, agar tombol promosi tetap satu baris di 360/375 px (temuan saat uji) |
| `scripts/uji-tutorial.py` (baru), `scripts/uji-ux-v3.py` | Uji browser tutorial; skenario 21 versi 3 disesuaikan dengan baris beranda baru |

---

## 4. Cara mencoba (tanpa menghapus simpanan atau banding)

Jalankan `npm run build && npm run start -- --port 3011` dengan Supabase lokal, lalu di konsol browser:

- **Pengguna baru:** `localStorage.removeItem('kb:tutorial-bagian:v1'); localStorage.removeItem('kb:panduan')`, lalu
  muat ulang `/cari`, `/kos/kost-anggrek-cakra`, `/disimpan` (setelah menyimpan satu kos), `/banding` (2 kandidat).
- **Pengguna lama:** `localStorage.setItem('kb:panduan', 'v1')`: tidak ada tawaran, tombol "Petunjuk bagian ini" ada.
- **Tutup/Lewati/Selesai:** lihat `localStorage.getItem('kb:tutorial-bagian:v1')` setelah tiap tindakan.
- **Buka ulang:** tombol "Petunjuk bagian ini" di tiap bagian, atau **Tawarkan lagi** di `/cara-menggunakan`.
- **Mitra:** `/mitra/masuk`, nomor uji lokal `6281111111111`, kode `123456` (dua kos contoh tertaut lewat seed;
  tidak ada OTP sungguhan). `6282222222222` = akun tanpa kos.

Jangan memakai "Clear site data", karena itu juga menghapus simpanan dan perbandingan.

---

## 5. Hasil pemeriksaan (perintah yang benar-benar dijalankan)

| Perintah | Hasil |
|---|---|
| `npm run lint` | 0 masalah |
| `npm run typecheck` | Lolos |
| `npm test` | 124 lulus (116 sebelumnya + 8 tes `lib/tutorial-bagian.test.ts`) |
| `npm run build` | Lolos, 71 halaman |
| `npx supabase test db` | 135 lulus (tidak ada perubahan SQL; dijalankan untuk memastikan DB lokal bersih setelah uji mitra) |
| `python3 scripts/uji-tutorial.py` | **28/28**: 14 pemeriksaan × Chromium dan WebKit; rincian `docs/tangkapan/tutorial/hasil-uji.json` |
| `OUT_DIR=… python3 scripts/uji-ux-v3.py` (regresi v3, Chromium) | 27/27, termasuk axe-core 0 pelanggaran; skenario 21 sudah memakai baris beranda baru |
| `MESIN=chromium OUT_DIR=… python3 scripts/uji-ux-v3-ulang.py` | 11/11 (putaran ulang v3: simpanan, toast/tray, promosi, area, harga per kamar) |
| `MESIN=chromium OUT_DIR=… python3 scripts/uji-motion-v31.py` | 19/19 (transisi, intro logo, kondisi) |

Pemeriksaan tutorial (nomor sesuai prompt §10; semua lulus di kedua mesin):

| No | Yang diperiksa |
|---|---|
| 1 | Pengguna baru di HP `/cari`, PC detail, HP beranda: tepat satu tawaran, tanpa panel, dialog, pindah fokus, atau gulir; status "ditawarkan" baru tercatat setelah tawaran terlihat |
| 2 | Pencarian 2 langkah (sorot kontrol lalu kartu), Detail 2 langkah; isi 19–23 kata; setelah Selesai tidak ada tutorial lain yang terbuka sendiri |
| 3 | Tidak ditawarkan ulang setelah reload, back/forward, kos lain (muat penuh dan navigasi klien); dalam kunjungan yang sama tawaran tetap di tempatnya |
| 4 | Selesai → `selesai`, Lewati/tutup → `ditutup`; "Petunjuk bagian ini" membuka lagi dari langkah 1 |
| 5 | `kb:panduan = v1`: tanpa tawaran otomatis, tombol tenang ada; elemen panduan lama tidak ada lagi |
| 6 | `kb:simpan`, `kb:banding`, `?kamar=`, harga bar, dan panjang history sama sebelum/sesudah; saat ditutup 0 panggilan gulir |
| 7 | Hasil nol (langkah 2 menyorot kotak saran), kos belum dinilai (tanpa sorotan), simpanan kosong dan banding satu kandidat tanpa tutorial, mode peta HP tanpa tawaran; tanpa error konsol |
| 8 | Tiga klik cepat → 1 panel; membuka Filter atau Menu menutup tutorial (satu dialog saja, sorotan hilang); resize 700 px tanpa overflow; pindah halaman saat terbuka tidak meninggalkan panel/sorotan |
| 9 | Enter membuka dan fokus ke judul panel; Tab (Option+Tab di WebKit) ke tombol; Escape menutup dan fokus kembali ke "Petunjuk bagian ini"; history tidak bertambah; region berjudul, bukan tooltip/modal; tombol tutup 44×44 px |
| 10 | Reduced motion: animasi panel `none`; reload normal: intro logo ±710 ms dan tawaran baru dicatat sesudahnya |
| 11 | 360, 390, 768, 1440 px, landscape 844×390, teks 200 %: tidak ada overflow dan panel tidak keluar layar |
| 12 | Storage diblokir: tawaran tampil dan bisa ditutup (memori), tanpa error; JSON rusak: tetap jalan, tidak ada render berulang |
| 13 | Menampilkan dan membuka tutorial di `/cari` dan detail: 0 permintaan jaringan baru (tanpa peta, 360°, media, kode mitra) |
| 14 | Mitra (nomor uji lokal): tawaran ada, langkah 1 menyorot kos pertama, langkah 2 tombol aksinya; URL tetap dan 0 permintaan non-GET; akun tanpa kos tanpa tutorial (tombol "Daftarkan kos" tetap); halaman pencari tidak memuat materi mitra |

Temuan dan perbaikan selama uji: fokus setelah menutup jatuh ke `<body>` karena panel sudah lepas dari DOM saat tujuan
fokus dicari (sekarang dihitung sebelum menutup); membuka Filter saat tutorial terbuka memunculkan lagi baris
"Butuh petunjuk?" (sekarang langsung diganti tombol tenang); tombol kartu promosi turun ke dua baris di 360/375 px.

**Data lokal untuk uji mitra.** Tidak ada `owner_id` yang diubah: seed sudah menautkan `6281111111111` ke Kos Putri
Melati dan Kost Anggrek Cakra. Login uji membuat akun `6282222222222` (+ baris `owner`) dan sesi; setelah uji, akun itu
dan sesi dari run ini dihapus dari Supabase lokal. Kunjungan halaman selama uji menambah baris analitik
`kunjungan_kos` di DB lokal (seperti uji sebelumnya). Database cloud tidak disentuh.

---

## 6. Screenshot

`docs/tangkapan/tutorial/` (akhiran `-chromium` / `-webkit`): `01` tawaran pertama `/cari` HP, `02`–`03` langkah 1–2
Pencarian HP, `04` langkah 2 Detail HP, `05` hasil kosong HP, `06` langkah 1 Detail PC, `07` Detail di 360 px, `08`–`09`
mitra PC (tawaran, langkah 2), `10` Simpanan HP, `11` Bandingkan PC, `12` pengguna lama di `/cari`, `13` baris beranda HP.
Bukti versi 3/3.1 tidak ditimpa.

---

## 7. Keterbatasan

- Hanya browser headless (Playwright Chromium dan WebKit) di Mac ini. Safari asli, HP fisik, Firefox, dan pembaca layar
  (VoiceOver/TalkBack) belum diuji; struktur aksesibilitas dicek lewat DOM.
- Surface mitra diuji di `localhost/mitra` (fallback path), belum di subdomain `mitra.` yang memakai rewrite proxy.
- Saat panel ditutup, tombol "Petunjuk bagian ini" muncul di header bagian. Di Chromium scroll anchoring menyesuaikan
  `scrollY` beberapa puluh piksel; kode tutorial sendiri tidak memanggil gulir apa pun (diuji).
- Status disimpan per browser, bukan per akun; membersihkan data situs membuat tawaran muncul lagi sekali.
- Tutorial tidak diuji dengan pengguna; efektivitasnya (lebih sedikit kebingungan) belum terukur.

---

## 8. Perintah commit dan push

Tanpa migrasi, jadi tidak ada urutan penerapan khusus. Dokumen audit, prompt tindak lanjut audit, dan file presentasi
3.1 yang belum terlacak bukan bagian dari tugas ini dan tidak ikut di-add.

```bash
cd /Users/calvinn/KosBahagia
```

```bash
git add lib/tutorial-bagian.ts lib/tutorial-bagian.test.ts lib/panduan.ts lib/navigasi.ts components/panduan app/globals.css "app/(user)/layout.tsx" "app/(user)/page.tsx" "app/(user)/cara-menggunakan/page.tsx" "app/(mitra)/layout.tsx" "app/(mitra)/mitra/dashboard/page.tsx"
```

```bash
git add components/cari/HasilPencarian.tsx components/kos/DaftarSimpanan.tsx components/kos/KosCard.tsx components/kos/TabelBanding.tsx components/kos/detail/BuktiKebersihan.tsx components/kos/detail/RingkasanKeputusan.tsx scripts/uji-tutorial.py scripts/uji-ux-v3.py docs/hasil-tutorial-singkat-per-bagian.md docs/prompt-tutorial-singkat-per-bagian.md docs/tangkapan/tutorial
```

```bash
git status
```

```bash
git commit -m "Short section tutorials: offered once, opened on request" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

```bash
git push
```
