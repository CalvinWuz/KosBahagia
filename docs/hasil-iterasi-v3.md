# Hasil iterasi UX versi 3

Tanggal: 7 Oktober 2026. Dasar kerja: `docs/prompt-ux-v3-kuesioner.md` (enam arahan dari kuesioner versi 2,
63 responden, 4–5 Oktober 2026).

**Status.** Semua perubahan sudah diterapkan di repo dan diuji di lokal (build produksi + Supabase lokal, data
contoh). **Belum** di-commit, di-push, di-deploy, dan migrasi baru **belum** diterapkan ke Supabase cloud;
urutannya ada di bagian 8 dan perintah commit di bagian 9.

> **Bedakan dua jenis hasil.** Semua angka "lulus" di dokumen ini adalah pengujian internal otomatis terhadap data
> contoh. Belum ada pengujian ulang dengan responden, jadi dokumen ini tidak menyatakan bahwa pengalaman pengguna
> versi 3 sudah meningkat. Angka kuesioner tetap dari `docs/laporan/laporan-uji-prototipe.md`. Skenario untuk sesi
> berikutnya ada di bagian 11.

---

## 1. Ringkasan per arahan

| Arahan | Yang berubah |
|---|---|
| 1. Label Simpan/Bandingkan + tautan di header | Tombol berteks di semua kartu, detail, simpanan, promosi, dan kartu peta: **Simpan** → **Tersimpan**, **Bandingkan** → **Dalam banding** (teks + ikon + `aria-pressed`, nama aksesibel menyebut akibat tekan ulang). Menu utama **Cari kos · Simpanan · Bandingkan · Cara menggunakan** dengan jumlah: inline di PC, tombol berlabel **Menu** di HP, termasuk di bar khusus `/cari` dan `/kos`. Halaman banding kosong/satu kandidat menjelaskan langkahnya. |
| 2. Penjelasan dekat skor, biaya, jarak | Skor: badge "Skor Bahagia …/10" di kartu, "Kebersihan 4,3/5: bersih" dan "Kedap suara 1/5: obrolan kamar sebelah ikut terdengar" di detail, sheet **Arti skor** (bobot, skala /5, dB = hasil ukur bukan skor, tanggal dan kamar yang diukur). Biaya: satu kalimat komponen dari `lib/biaya.ts` di kartu, ringkasan, dan rincian ("Sewa + listrik (estimasi) + sampah; air termasuk sewa"), tautan **Lihat rincian biaya**, biaya yang belum diketahui selalu tampil namanya. Jarak: "garis lurus ke …" vs "menit jalan kaki, dicatat surveyor", sheet **Cara jarak dihitung**, bagian baru di `/cara-kami-menilai#jarak`. |
| 3. Lebih lega; harga, lokasi, status dulu | Kartu disusun ulang: nama → total → lokasi + tipe penghuni → kamar + status + waktu konfirmasi → bukti singkat → tombol. Detail: rincian panjang dilipat dengan judul "Lihat …" dan ringkasan saat tertutup; navigasi bagian, tautan "Lihat rincian biaya", dan anchor langsung membuka bagian terlipat sebelum scroll/fokus. Fasilitas dikelompokkan per sumber data. |
| 4. Filter kamar mandi dalam + tipe multi-pilih | Bug nyata diperbaiki sampai database (bagian 3). Kamar mandi dalam dan AC menjadi syarat positif per tipe kamar; tipe kos bisa lebih dari satu (`?tipe=putra,campur`); baris **Filter aktif** dengan hapus per pilihan dan **Hapus semua**; label negatif "Sembunyikan…" diganti pilihan positif; saran pelonggaran per pilihan dengan jumlah yang valid. |
| 5. Panduan pengguna baru | Kartu tiga langkah di beranda dan petunjuk satu baris di `/cari` (bisa dilewati, tidak menghalangi pencarian), halaman `/cara-menggunakan` di menu. Penanda "sudah dibaca" `kb:panduan` ber-versi, terpisah dari simpanan, dipasang sebelum render pertama sehingga tidak berkedip. |
| 6. Info sekitar + menu navigasi | Sekitar dikelompokkan: kebutuhan harian, makan (harga sekali makan yang tercatat, sebelumnya tidak pernah tampil), laundry (terdekat + laundry di kos), transportasi, lingkungan. Data kosong ditulis "Belum kami catat", bukan "Tidak ada yang dekat". Menu: lihat arahan 1. |

---

## 2. Temuan kuesioner → implementasi → lokasi → bukti

Nomor skenario merujuk ke bagian 6; screenshot ada di `docs/tangkapan/v3/`.

| Temuan (grid v2) | Implementasi | Lokasi | Bukti |
|---|---|---|---|
| Chip "Kamar mandi dalam" ikut memilih "tanpa kamar mandi dalam" (bug) | Satu kontrol positif per syarat; label negatif dihapus; satu state di URL untuk chip cepat, sheet, dan ringkasan | `components/cari/FilterSheet.tsx`, `FilterAktif.tsx`, `lib/cari/filter-aktif.ts` | `sebelum/02-…png` vs `03-filter-sheet-tipe-hp.png`; skenario 6, 15 |
| Kartu hasil filter kamar mandi dalam menampilkan kamar tanpa kamar mandi dalam | Kamar acuan dipilih di antara tipe kamar yang memenuhi syarat; harga + syarat kamar harus di kamar yang sama | `supabase/migrations/20261007000100_cari_v4_tipe_kamar.sql` | pgTAP `ux_v3_filter.test.sql`; skenario 10, 11; `05-km-dalam-kamar-acuan-hp.png` |
| Tipe putra/putri/campur ingin dipilih lebih dari satu | `tipe` jadi daftar di URL, parser/serializer, RPC `p_tipe tipe_kos[]` | `lib/cari-params.ts`, `lib/cari/ambil.ts`, migrasi | unit `cari-params.test.ts`; skenario 6–9 |
| Alur filter membingungkan | Baris "Filter aktif", bantuan "pilihan langsung diterapkan", kelompok Tipe kos / Kamar / Aturan / Sekitar / Fasilitas lain | `FilterSheet.tsx`, `HasilPencarian.tsx` | `04-filter-aktif-hp.png`; skenario 15 |
| Tidak tahu tombol untuk membandingkan; ikon panah tidak dikenali | Tombol berteks + state berteks | `components/kos/KosCard.tsx` (`AksiKartu`) | `01-kartu-label-hp.png`, `06-detail-header-label-hp.png`; skenario 2–5 |
| "Kos yang saya pilih sudah tersimpan atau belum?" | Label **Tersimpan**, toast, jumlah di Menu, halaman Simpanan | `AksiKartu`, `components/layout/Navigasi.tsx` | `01-kartu-tersimpan-hp.png`; skenario 2, 3 |
| Tidak ada menu navigasi di header | Menu utama PC + HP, termasuk bar khusus `/cari` dan `/kos` | `Navigasi.tsx`, `Header.tsx`, `HasilPencarian.tsx`, `DetailKos.tsx` | `13-menu-hp.png`, `14-nav-desktop.png`; skenario 23 |
| Skor kebersihan dan kebisingan dinilai dengan cara apa? | Kalimat arti di dekat angka + sheet "Arti skor" | `SkorRincian.tsx`, `ArtiSkala.tsx`, `lib/skala.ts` (`artiKedap`) | `08-bantuan-skor-hp.png`, `08b-skor-dijelaskan-hp.png`; skenario 17 |
| Estimasi total bulanan dihitung dari mana? | Kalimat komponen dari `teksKomponen`, catatan estimasi listrik, "Lihat rincian biaya" | `lib/biaya.ts`, `RingkasanKeputusan.tsx`, `RincianBiaya.tsx`, `KosCard.tsx` | unit `biaya.test.ts`; `07b-…png`, `10-rincian-biaya-terbuka-hp.png`; skenario 17, 20 |
| Jarak ke kampus dihitung bagaimana? | Acuan dan metode di dekat angka + sheet "Cara jarak dihitung" + `/cara-kami-menilai#jarak` | `BantuanJarak.tsx`, `HasilPencarian.tsx`, `DetailKos.tsx`, `CaraKeSini.tsx` | `09-bantuan-jarak-hp.png`; skenario 17 |
| Fasilitas mana yang di kamar dan mana yang bersama? | Kelompok: di tipe kamar ini / di kamar (dicatat per kos) / dipakai bersama / tidak termasuk / belum dicatat / tidak tercatat; biaya fasilitas ditulis di sampingnya | `DaftarFasilitas.tsx` | `11-fasilitas-hp.png`; skenario 18 |
| Rincian biaya, fasilitas, jarak perlu dibaca ulang; terlalu banyak tulisan di HP | Rincian dilipat dengan ringkasan; kartu dikelompokkan; anchor membuka bagian terlipat | `Accordion.tsx`, `lib/bagian.ts`, `NavBagian.tsx`, `BuktiKebersihan.tsx` | skenario 19, 24 |
| Harga dan lokasi paling cepat terlihat di kartu | Urutan kartu baru | `KosCard.tsx` | `01-kartu-label-hp.png`; skenario 1 |
| Status kamar dan waktu pembaruan perlu jelas | Baris kamar + status + "Dikonfirmasi … lalu" di kartu; detail tetap | `KosCard.tsx` | skenario 1, 10 |
| Harus ada tutorial | Panduan tiga langkah | `components/panduan/`, `app/(user)/cara-menggunakan/page.tsx`, `lib/panduan.ts` | `15-…`, `16-…`, `17-cara-menggunakan-desktop.png`; skenario 21 |
| Info sekitar lebih rinci: laundry, toko bahan makanan | Kelompok kebutuhan; harga makan dan laundry bila tercatat; "Belum kami catat" untuk data kosong | `SekitarKos.tsx` | `12-sekitar-sebagian-hp.png`; skenario 22 |
| Saran filter saat kosong | Tiga pelonggaran terbaik, masing-masing satu perubahan dengan jumlah nyata | `lib/cari/longgar.ts`, `HasilPencarian.tsx` | unit `longgar.test.ts`; `21-hasil-nol-saran-hp.png`; skenario 16 |
| Mana informasi contoh? | Label "Data contoh" dan banner tetap; panduan dan halaman cara menggunakan menyebutnya | tidak berubah + `LangkahPanduan.tsx` | skenario 26 |

---

## 3. Reproduksi bug filter (sebelum perbaikan)

Diambil dari versi 2 di lokal sebelum kode diubah (`docs/tangkapan/v3/sebelum/`).

1. **Kebingungan label.** `/cari?area=binus-kemanggisan&fasilitas=kamar-mandi-dalam`, buka Filter: chip
   "Kamar mandi dalam" (Fasilitas) dan "tanpa kamar mandi dalam" (Sembunyikan) sama-sama aktif, karena keduanya
   menulis slug yang sama. Maksudnya sama, labelnya bertentangan.
2. **Kesalahan data/query.** `cari_kos_v3` memilih kamar acuan hanya dari harga, sedangkan syarat kamar mandi dalam
   dicek pada tingkat kos. Pada filter kamar mandi dalam (radius 5 km dari BINUS), **7 dari 11 kartu** menampilkan
   kamar "Standar (kipas)" yang tidak punya kamar mandi dalam, lengkap dengan harga dan status kamar itu.
3. **Harga + kamar mandi dalam lolos lewat dua kamar berbeda.** Total ≤ Rp1.500.000 + kamar mandi dalam
   menghasilkan 2 kos (Kos Putri Melati, Kost Putri Aisyah): kamar Standar memenuhi harga, kamar AC memenuhi kamar
   mandi dalam. Seharusnya 0.
4. **Tipe kos** masih satu nilai dari URL sampai argumen RPC.

Sesudah: 11/11 kartu menunjuk kamar yang punya kamar mandi dalam (beserta harga dan statusnya sendiri, misalnya
Anggrek Cakra "AC + kamar mandi dalam, Rp2.195.000, Penuh"), harga ≤ Rp1,5 jt + kamar mandi dalam = 0, dan
`tipe=putra,campur` hanya mengembalikan dua tipe itu.

---

## 4. Kontrak data dan URL

**Migrasi baru:** `supabase/migrations/20261007000100_cari_v4_tipe_kamar.sql` (hanya menambah; migrasi lama tidak
diubah).

| Fungsi | Isi |
|---|---|
| `kos_cocok_v2(...)` | Himpunan hasil. `p_tipe tipe_kos[]`: NULL/kosong = semua, satu atau lebih = salah satunya (OR), digabung AND dengan filter lain. Kamar acuan = tipe kamar termurah yang masih ada kamar **di antara** tipe yang memenuhi harga (total lengkap), kamar mandi dalam (`kamar_mandi_dalam is true`; NULL tidak memenuhi), dan AC (`boleh_ac`). Slug fasilitas lain tetap dicek di `kos_fasilitas`. |
| `cari_kos_v4(...)` | Hasil utama, aturan urutan sama dengan `cari_kos_v3`. |
| `kos_promosi_v2(...)` | Maks. 2 spotlight yang lolos filter yang sama. |
| `posisi_di_area` | Kini memanggil `cari_kos_v4` (tanpa filter, hasilnya sama) supaya fungsi lama bisa dihapus nanti. |

Nama baru dipakai karena tipe argumen `p_tipe` berubah; mengganti fungsi lama dengan argumen berbeda akan membuat
overload yang ambigu bagi PostgREST. Ini perubahan kontrak, bukan penomoran iterasi desain. `cari_kos_v3`,
`kos_promosi`, dan `kos_cocok` **dibiarkan** untuk frontend yang sedang live sampai frontend baru ter-deploy.
`lib/supabase/types.ts` diregenerasi dengan `npm run db:types` (diff hanya tiga fungsi baru).

**URL `/cari`:** `tipe=putra,campur` (urutan tetap putra, putri, campur; duplikat dan nilai asing dibuang;
`tipe=putra` lama tetap terbaca; `%2C` dan `tipe=a&tipe=b` juga terbaca). `fasilitas` tanpa duplikat. Perubahan
filter mengembalikan `hal` ke 1. Parameter lokasi, radius, teks, harga, urutan, dan `tampil=peta` dipertahankan.

**Hitungan filter (badge "Filter"):** satu per kebutuhan. Rentang harga = 1, tipe kos = 1 berapa pun tipe yang
dipilih, setiap fasilitas = 1, setiap batas skor dan aturan = 1. Ringkasan "Filter aktif" tetap menyebut setiap
pilihan, termasuk setiap tipe, dan setiap chip bisa dihapus sendiri.

**Penyimpanan perangkat:** `kb:panduan` (baru, `"v1"`) terpisah dari `kb:simpan` dan `kb:banding` (tidak berubah).
`kb:cari-terakhir` (sessionStorage, baru) dipakai tautan "Cari kos" di menu untuk kembali ke pencarian terakhir di
tab yang sama.

---

## 5. File penting

**Baru:** `supabase/migrations/20261007000100_cari_v4_tipe_kamar.sql`, `supabase/tests/ux_v3_filter.test.sql`,
`lib/cari/filter-aktif.ts` (+ test), `lib/cari/fasilitas.ts`, `lib/cari/longgar.test.ts`, `lib/bagian.ts`,
`lib/panduan.ts`, `components/cari/FilterAktif.tsx`, `components/layout/Navigasi.tsx`, `components/ui/Bantuan.tsx`,
`components/kos/BantuanJarak.tsx`, `components/panduan/` (LangkahPanduan, PanduanSingkat, TampilkanPanduanLagi),
`app/(user)/cara-menggunakan/page.tsx`, `scripts/uji-ux-v3.py`, `docs/tangkapan/v3/`.

**Diubah (utama):** `lib/cari-params.ts`, `lib/cari/ambil.ts`, `lib/cari/longgar.ts`, `lib/biaya.ts`
(`teksKomponen`), `lib/skala.ts` (`artiKedap`), `lib/format.ts` (`formatSkala`), `lib/navigasi.ts`,
`lib/kos/ringkasan.ts` dan `lib/kos/banding.ts` (kamar mandi dalam yang belum dicatat tidak lagi dipinjam dari data
kos), `components/cari/FilterSheet.tsx`, `components/cari/HasilPencarian.tsx`, `components/kos/KosCard.tsx`,
`components/kos/DetailKos.tsx`, `components/kos/detail/*` (Ringkasan, RincianBiaya, SkorRincian, ArtiSkala,
BuktiKebersihan, DaftarFasilitas, SekitarKos, CaraKeSini, NavBagian, Ketersediaan, bagian),
`components/ui/Accordion.tsx` (ringkasan saat tertutup, dibuka dari anchor), `components/ui/Button.tsx` (opsi
`bungkus` untuk label panjang), `components/ui/Icon.tsx` (IconMenu, IconInfo), `components/layout/Header.tsx`,
`Footer.tsx`, halaman banding/beranda/cara-kami-menilai, `app/(user)/layout.tsx`, `app/globals.css`,
`app/sitemap.ts`, `lib/supabase/types.ts` (generated), `eslint.config.mjs` (abaikan `docs/presentasi/**`, skrip
CommonJS pembuat slide yang bukan kode aplikasi).

---

## 6. Hasil pemeriksaan (perintah yang benar-benar dijalankan)

| Perintah | Hasil |
|---|---|
| `npm run lint` | 0 masalah |
| `npm run typecheck` | Lolos |
| `npm test` | 103 lulus (sebelumnya 78): round-trip multi-tipe, URL lama, duplikat, nilai asing, hitungan filter, pengosongan filter, chip filter aktif, saran pelonggaran, `teksKomponen`, `artiKedap`, kamar mandi dalam belum dicatat |
| `npx supabase test db` | 135 lulus (sebelumnya 109), termasuk 26 di `ux_v3_filter.test.sql`; hitungan dibandingkan dengan query independen |
| `npm run cek:skor-db` | 47 kos, 77 tipe kamar: 0 beda (formula skor tidak diubah) |
| `npm run build` | Lolos; detail kos tetap SSG, `/cara-menggunakan` statis |
| `python3 scripts/uji-ux-v3.py` (build produksi `next start` + Supabase lokal, Chromium) | **26/26 skenario + axe 0 pelanggaran**; rincian per skenario di `docs/tangkapan/v3/hasil-uji.json` |

Skenario yang dijalankan skrip (nomor sesuai tabel prompt §14):

| No. | Hasil |
|---|---|
| 1 | Beranda → preset → hasil → detail; kartu memuat total, status, kamar |
| 2–3 | Simpan dari kartu tanpa pindah halaman, buka lewat Menu, bertahan setelah reload; hapus dari daftar dan detail, kartu ikut berubah |
| 4–5 | Banding mempertahankan kamar AC (Rp2.195.000, Penuh) dan tipe penghuni; kandidat keempat menampilkan pilihan ganti, tiga lainnya utuh |
| 6–9 | Putra + Campur 23 kos = DB; hapus Putra → Campur 14 = DB; tanpa tipe = ketiganya = 36; URL lama dan multi-tipe (nilai asing dibuang) konsisten |
| 10–12 | Kamar acuan kamar mandi dalam benar sampai detail; harga + kamar mandi dalam + tipe = DB; daftar, promosi, dan jumlah memakai filter yang sama |
| 13 | Respons lama ditahan 2,5 detik; hasil akhir tetap milik pilihan terbaru |
| 14–15 | Reload, tautan di konteks baru, back/forward; FilterSheet ditutup lewat Escape/back/tombol = satu entri history, pilihan tetap, fokus kembali ke tombol Filter |
| 16 | Rentang harga terbalik → error; hasil nol → tiga saran dengan jumlah yang sama dengan DB |
| 17–19 | Bantuan skor/jarak lewat tap dan Enter, Escape menutup, fokus kembali; "Lihat rincian biaya", chip Biaya/Fasilitas/Sekitar, dan `#rincian-biaya` langsung membuka bagian terlipat di bawah header |
| 20 | Belum dinilai, total sementara dengan nama biaya yang belum diketahui, panel keselamatan tidak bisa dilipat |
| 21 | Panduan tampil pertama kali, ditutup (fokus pindah ke bagian berikut), tidak berkedip setelah reload, dibuka ulang; tanpa localStorage situs tetap jalan |
| 22 | Sekitar kosong/sebagian → "Belum kami catat"; harga makan/laundry hanya bila tercatat |
| 23 | Menu dari bar khusus `/cari` dan `/kos`; Escape menutup; "Cari kos" kembali ke pencarian terakhir dengan filternya |
| 24 | Tanpa overflow horizontal di 320/360/390/768/1440 px, teks 200% di 390 px, dan 640 px (1280 px pada zoom 200%); reduced motion mematikan transisi; Tab + Enter pada Simpan tidak membuka detail |
| 25 | Termurah dan Skor tertinggi setelah filter = urutan `cari_kos_v4`; promosi tetap terpisah |
| 26 | Mode demo: tombol kontak menampilkan pesan, tidak membuka WhatsApp; label "Data contoh" ada |

Yang ditemukan dan diperbaiki selama pengujian: header global, bar `/cari` dan `/kos`, tombol kartu, langkah
panduan, harga di kartu, dan baris label–nilai melebar saat teks 200%; tombol berlabel panjang (saran pelonggaran,
"Tukar jadi …", "Laporkan kamar sudah penuh") kini bisa membungkus.

**Belum bisa dilakukan / batas pemeriksaan:**
- Hanya Chromium (Playwright). Safari/iOS dan Firefox belum diuji.
- Tombol back fisik Android, cubit-zoom, dan pembaca layar (VoiceOver/TalkBack) belum diuji di perangkat nyata.
- Konsistensi peta dibuktikan dari kode (peta menerima array hasil yang sama, digambar di kanvas) dan screenshot
  `02-hasil-filter-peta-desktop.png`, bukan dari DOM.
- Lighthouse/performa tidak diukur ulang pada iterasi ini.
- Semua uji memakai Supabase lokal; database cloud tidak disentuh. Uji skenario 26 dan kunjungan detail menulis
  baris analitik (`klik_wa`, `kunjungan_kos`) ke database **lokal** saja.

---

## 7. Screenshot

`docs/tangkapan/v3/` (HP 390 px @2x, PC 1440 px), dibuat oleh `scripts/uji-ux-v3.py` dari build produksi:

| File | Isi |
|---|---|
| `sebelum/01-hasil-km-dalam-kamar-standar.png`, `sebelum/02-filter-sheet-dua-chip-aktif.png` | Versi 2: kamar acuan salah dan dua chip bertentangan |
| `01-kartu-label-hp.png`, `01-kartu-tersimpan-hp.png` | Kartu dengan urutan baru dan tombol berlabel; state Tersimpan |
| `02-hasil-filter-peta-desktop.png`, `14-nav-desktop.png` | PC: filter aktif, peta, menu utama |
| `03-filter-sheet-tipe-hp.png`, `04-filter-aktif-hp.png` | Filter multi-tipe dan baris filter aktif |
| `05-km-dalam-kamar-acuan-hp.png` | Filter kamar mandi dalam: kartu menunjuk kamar yang benar |
| `06-detail-header-label-hp.png`, `07-…`, `07b-…`, `22-detail-desktop.png` | Detail HP/PC: header berlabel, layar pertama, ringkasan |
| `08-bantuan-skor-hp.png`, `08b-skor-dijelaskan-hp.png`, `09-bantuan-jarak-hp.png`, `10-rincian-biaya-terbuka-hp.png` | Penjelasan skor, jarak, biaya |
| `11-fasilitas-hp.png`, `12-sekitar-sebagian-hp.png` | Fasilitas per sumber data, info sekitar |
| `13-menu-hp.png` | Menu di HP |
| `15-panduan-beranda-hp.png`, `16-panduan-cari-hp.png`, `17-cara-menggunakan-desktop.png` | Panduan |
| `18-banding-kosong-hp.png`, `18b-banding-satu-hp.png`, `19-banding-dua-kos-hp.png`, `20-ganti-kandidat-keempat-hp.png` | Banding |
| `21-hasil-nol-saran-hp.png` | Hasil nol dengan pilihan pelonggaran |

---

## 8. Urutan penerapan (dikerjakan Calvin)

Frontend baru memanggil `cari_kos_v4` dan `kos_promosi_v2`. **Migrasi harus lebih dulu**; kalau frontend ter-deploy
sebelum migrasi, `/cari` menampilkan "Hasil tidak bisa dimuat". Migrasinya hanya menambah fungsi, jadi frontend yang
sedang live tetap jalan setelah migrasi diterapkan.

1. Review perubahan di lokal (`npm run dev`, Supabase lokal sudah berisi migrasi baru).
2. Terapkan migrasi ke Supabase cloud (`db push` membaca file migrasi lokal, tidak perlu commit dulu):

   ```bash
   npx supabase db push
   ```

3. Pastikan fungsi baru ada, misalnya dari SQL Editor Supabase:
   `select proname from pg_proc where proname in ('cari_kos_v4','kos_promosi_v2','kos_cocok_v2');` (3 baris).
4. Commit dan push (bagian 9); Vercel mem-build dan men-deploy frontend baru.
5. Bila halaman statis masih memakai data lama, redeploy dan purge Data Cache di Vercel.
6. Setelah frontend baru live dan stabil, buat migrasi berikutnya untuk menghapus `cari_kos_v3`, `kos_promosi`, dan
   `kos_cocok` (`posisi_di_area` sudah pindah ke `cari_kos_v4`).

Tidak ada perubahan data contoh; tidak perlu menjalankan file `supabase/sinkron/`.

---

## 9. Perintah commit dan push

File hasil tugas ini saja (tidak termasuk `docs/presentasi/` yang belum di-commit dari pekerjaan sebelumnya):

```bash
git add supabase/migrations/20261007000100_cari_v4_tipe_kamar.sql supabase/tests/ux_v3_filter.test.sql lib/supabase/types.ts lib/cari-params.ts lib/cari-params.test.ts lib/cari/ambil.ts lib/cari/longgar.ts lib/cari/longgar.test.ts lib/cari/filter-aktif.ts lib/cari/filter-aktif.test.ts lib/cari/fasilitas.ts lib/biaya.ts lib/biaya.test.ts lib/skala.ts lib/skala.test.ts lib/format.ts lib/navigasi.ts lib/bagian.ts lib/panduan.ts lib/kos/ringkasan.ts lib/kos/ringkasan.test.ts lib/kos/banding.ts
```

```bash
git add components/cari/FilterSheet.tsx components/cari/FilterAktif.tsx components/cari/HasilPencarian.tsx components/kos/KosCard.tsx components/kos/SkorBadge.tsx components/kos/DetailKos.tsx components/kos/BantuanJarak.tsx components/kos/BandingDariTray.tsx components/kos/DaftarSimpanan.tsx components/kos/TabelBanding.tsx components/kos/TrayBanding.tsx components/kos/detail components/layout/Header.tsx components/layout/Footer.tsx components/layout/Navigasi.tsx components/panduan components/ui/Accordion.tsx components/ui/Bantuan.tsx components/ui/Button.tsx components/ui/Icon.tsx
```

```bash
git add "app/(user)/cara-menggunakan" "app/(user)/banding/page.tsx" "app/(user)/cara-kami-menilai/page.tsx" "app/(user)/layout.tsx" "app/(user)/page.tsx" app/globals.css app/sitemap.ts eslint.config.mjs scripts/uji-ux-v3.py docs/hasil-iterasi-v3.md docs/tangkapan/v3 docs/prompt-ux-v3-kuesioner.md README.md
```

```bash
git commit -m "UX v3: labelled save/compare, explained numbers, room-level filters, guide" -m "Search moves to cari_kos_v4/kos_promosi_v2 (new migration): kos type is any-of, and price, kamar mandi dalam and AC are met by the one room type the card shows. Adds the active-filter row, main menu, score/cost/distance help, folded detail sections that open from anchors, grouped facilities and surroundings, and the new-user guide. See docs/hasil-iterasi-v3.md." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

```bash
git push
```

Jalankan `git status` sebelum commit untuk memastikan tidak ada file lain yang ikut.

---

## 10. Keterbatasan data dan kebutuhan tersisa

- Hanya **kamar mandi dalam, AC, dan parkir** yang dicatat per tipe kamar. Fasilitas kamar lain (kasur, lemari,
  water heater, jendela) dicatat per kos; halaman detail menyebutnya "dicatat per kos" dan filternya di kelompok
  "Fasilitas lain".
- Model data belum membedakan "tidak ada" dari "tidak tercatat" untuk fasilitas tingkat kos; detail menampilkannya
  sebagai "tidak tercatat saat survei" dan menyarankan bertanya ke pemilik.
- `kos_sekitar` hanya punya nama, jarak dari kos, dan satu harga (sekali makan, per kg) per tempat; tidak ada
  koordinat tempat, jam buka, atau data **toko bahan makanan** (minimarket tidak disebut toko bahan makanan).
  Peta per tempat tidak bisa ditampilkan tanpa koordinat.
- Metode jarak ke patokan (`landmark_jarak_m`) tidak tersimpan; tampilan menyebutnya "dicatat surveyor". Untuk
  data survei sungguhan, pertimbangkan kolom metode atau definisi baku di panduan surveyor.
- Kamar mandi dalam yang `NULL` tidak lagi dipinjam dari data kos (pencarian, ringkasan, banding); data contoh saat
  ini tidak punya nilai NULL, data nyata perlu diisi per tipe kamar.
- Di luar enam arahan dan tidak dikerjakan: foto per tipe kamar, rute dengan Street View, nomor chat demo ke tim,
  review publik, pembayaran.
- Hasil pengujian dengan responden baru belum ada (bagian 11).

---

## 11. Validasi berikutnya dengan pengguna

Jangan menyatakan UX versi 3 lebih baik sebelum sesi ini dijalankan. Baseline tetap laporan 63 responden.

Tugas tanpa bantuan (5–10 peserta, HP dan PC):

1. Temukan kos sesuai budget, tipe penghuni, dan kamar mandi dalam.
2. Jelaskan total bulanan, komponen estimasinya, arti skor, dan acuan jaraknya.
3. Simpan satu pilihan dan tunjukkan cara membuka simpanan.
4. Bandingkan dua pilihan dan jelaskan perbedaannya.
5. Cari laundry atau transportasi di sekitar kos.
6. Kembali ke pencarian tanpa kehilangan kebutuhan yang dipilih.

Catat per tugas: berhasil/tidak, waktu, salah tekan, ragu lebih dari 3 detik, dan apakah butuh bantuan. Pertanyaan
lanjutan yang netral: "Bagian mana yang membantu kamu memutuskan?", "Ada yang bikin ragu?", "Kalau bisa mengubah
satu hal, apa?". Masukkan temuannya ke grid versi 3 di `docs/feedback-grid-dan-iterasi.md` dengan tanda sumber.

Target kualitatif: tombol ditemukan tanpa petunjuk lisan, angka dijelaskan dengan benar, filter selesai dengan lebih
sedikit kebingungan. Angka baru hanya ditulis setelah datanya terkumpul.
