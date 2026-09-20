# Rencana perbaikan UX

Hasil audit alur nyata di produksi (`kos-bahagia-umber.vercel.app`), 20 September 2026.
Diuji di HP (390 × 844, sentuh) dan PC (1440 × 900), semua alur penyewa dan halaman masuk mitra.
Setiap butir menyebut **apa yang terjadi sekarang**, **usulan**, **file yang berubah**, dan **dampaknya**.

## Status: semua 25 butir sudah dikerjakan (belum di-commit)

Diverifikasi di build produksi lokal (`next build` + `next start`, basis data cloud) dengan Playwright:
25 skenario alur (sheet + tombol back, ganti area, peta HP, lightbox, tombol Kembali, deep link,
header search, banding tidak melebar) lolos; axe-core bersih di 7 halaman × 2 lebar; `typecheck`,
`lint`, 20 unit test lolos; JS awal `/cari` ≈ 183 KB gzip (sebelumnya 167, brotli di Vercel lebih kecil).

Penyimpangan dari rencana:
- Butir 5/6 (history): dibuat satu mekanisme di `lib/navigasi.ts` (`useLapisRiwayat`) yang dipakai Sheet,
  Lightbox, dan viewer 360°. Aturannya: satu sesi lapisan = paling banyak satu entri history; back di HP
  menutup lapisan; perubahan filter yang sudah diterapkan tidak dibatalkan oleh back.
- Butir 9: judul dipindah ke atas galeri hanya di `lg`; urutan blok 3–12 tidak diubah (sesuai komentar di kode).
- Butir 13: tray banding juga menampilkan ✕ per kos dan bisa disembunyikan; toast punya aksi ("Lihat simpanan", "Bandingkan").
- Butir 14: bar progres memakai `useLinkStatus` di dalam `Link` kartu (bukan global), jadi hanya kartu yang diketuk yang meredup.
- Tambahan yang ditemukan saat mengerjakan: `kekuatanKos` dipindah ke `lib/kos/kekuatan.ts` supaya `supabase-js`
  tidak ikut ke bundle browser; `data-scroll-behavior="smooth"` di `<html>` untuk peringatan Next.

Yang perlu dicek manual di HP sungguhan (tidak bisa disimulasikan Playwright): tombol back fisik Android saat sheet /
lightbox / 360° terbuka; cubit-zoom di lightbox; pengiriman ulang OTP di `/mitra/masuk`.

---

Prioritas:
- **P0**: bug atau jalan buntu; pengguna gagal atau bingung.
- **P1**: gesekan besar di alur utama (cari → detail → chat).
- **P2**: polesan; terasa, tapi tidak menghambat.

---

## Ringkasan

| # | Halaman | Masalah | Usulan singkat | Prio |
|---|---|---|---|---|
| 1 | Detail kos (HP) | Tidak ada tombol kembali; header generik (logo, cari, simpanan) | Header khusus detail: ← kembali, nama kos saat scroll, simpan/banding | P0 |
| 2 | Banding (HP) | Tabel lebih lebar dari layar; kos kedua terpotong, seluruh halaman ikut melebar | Tabel scroll sendiri, kolom label sticky, kolom min 220 px | P0 |
| 3 | Cari (HP) | Peta kosong sampai disentuh | `map.resize()` setelah mount + `ResizeObserver` | P0 |
| 4 | Cari (HP) | Tombol **Filter** tersembunyi di ujung baris chip (harus geser dulu) | Pinned di kiri, chip scroll di kanannya | P0 |
| 5 | Cari | Tiap sentuhan di sheet filter menambah 1 entri history; tombol back harus ditekan berkali-kali | `replaceState` selama sheet terbuka, satu `pushState` saat "Lihat N kos" | P1 |
| 6 | Semua sheet/lightbox/360 | Tombol back HP menutup halaman, bukan sheet-nya | Push state saat buka, `popstate` menutup | P1 |
| 7 | Cari | Tidak bisa ganti area/kampus dari halaman hasil (harus balik ke beranda) | Judul area jadi tombol "Palmerah ▾" yang membuka sheet pencarian; header "Cari kos di mana?" membuka sheet yang sama dari halaman mana pun | P1 |
| 8 | Cari (HP) | ← selalu ke beranda walau datang dari halaman area | `history.back()` jika ada riwayat internal, beranda jika tidak | P1 |
| 9 | Detail (PC) | Layar pertama hanya foto + blok 360; nama, skor, alamat di bawah lipatan | Judul + skor di atas galeri; galeri grid 1 besar + 4 kecil (tinggi 420 px); 360 jadi tombol overlay | P1 |
| 10 | Detail (HP) | Halaman ±7.500 px tanpa jalan pintas; catatan surveyor (pembeda utama) di ±4.800 px | Chip navigasi bagian sticky: Biaya · Skor · Fasilitas · Lokasi · Catatan · Ketersediaan | P1 |
| 11 | Detail | Tap foto tidak melakukan apa-apa (Lightbox hanya dipakai minimap) | Tap foto → Lightbox layar penuh, cubit zoom, geser | P1 |
| 12 | Detail, kartu, filter | Angka kebersihan/kedap suara (4,5/5, 32 dB) tanpa arti kata | Label kata di samping angka; filter slider 1–5 → chip bertingkat | P1 |
| 13 | Simpan / banding | Tidak ada umpan balik selain ikon berubah; tray banding tidak terlihat | Toast bawah + tray mengambang "2 kos dibandingkan · Bandingkan" + badge di ikon simpanan | P1 |
| 14 | Semua tautan | Tidak ada tanda halaman sedang dimuat saat pindah halaman | Bar progres tipis di atas (`useLinkStatus`) + kartu redup saat ditekan | P1 |
| 15 | Area (HP) | Semua 36 kos dirender penuh (±19.000 px); FAQ di paling bawah | Tampilkan 6, tombol "Lihat semua 36 kos"; FAQ naik ke atas daftar | P1 |
| 16 | Cari (HP) | Area sticky 144 px (header + chip + hitung/urut) | Baris hitung/urut tidak sticky → sticky 100 px | P2 |
| 17 | Cari (HP) | Satu kartu memenuhi satu layar | Foto kartu 16:10 di HP (4:3 di PC) | P2 |
| 18 | Cari | Chip "Km dalam" tidak terbaca | "Kamar mandi dalam" | P2 |
| 19 | Cari | Status peta/daftar hilang saat kembali dari detail | `tampil=peta` di URL | P2 |
| 20 | Cari (PC) | Geser peta tidak memengaruhi hasil; hover kartu tidak menyorot marker | Tombol "Cari di area peta ini"; hover ↔ marker | P2 |
| 21 | Detail | Fasilitas satu kolom panjang, yang tidak ada dicoret satu per satu | Grid 2 kolom; yang tidak ada dilipat "Tidak tersedia (6)" | P2 |
| 22 | Banding | Nama kos bukan tautan; tak ada hapus per kolom; tak ada slot tambah | Nama → detail; ✕ per kolom; kolom "+ Tambah kos" | P2 |
| 23 | Disimpan | Tidak ada aksi lanjutan | "Bandingkan yang tersimpan" bila 2–3; urut termurah | P2 |
| 24 | Beranda | Tidak ada jalan cepat ke pencarian terakhir | Kartu "Lanjutkan: Palmerah, ≤ Rp1,5 jt" dari `kb:riwayat-cari` | P2 |
| 25 | Mitra masuk | Tautan "Masuk" di header saat sudah di halaman masuk; tanpa jalan ke landing | Sembunyikan tautan aktif; logo → landing | P2 |

Sudah dibetulkan sebelum audit ini: halaman detail sempat 404 saat DB lambat (`lib/kos/detail.ts`, commit `3c5342c`).

---

## A. Navigasi dan tombol kembali

### 1. Header khusus halaman detail (P0)

**Sekarang.** `/kos/[slug]` memakai `components/layout/Header.tsx` yang sama dengan halaman lain:
logo, kotak "Cari kos di mana?", ikon simpanan. Tidak ada ←. Di HP, satu-satunya cara kembali ke
hasil adalah tombol back browser; pengguna yang datang dari tautan WhatsApp tidak punya jalan ke hasil sama sekali.

**Usulan.**
- HP: header 56 px berisi ← · nama kos (muncul setelah galeri lewat, `IntersectionObserver`) · ikon simpan · ikon banding.
  ← memanggil `history.back()` jika `document.referrer` satu origin dan `history.length > 1`; jika tidak, ke `/cari?area=<area kos>`.
- PC: breadcrumb `Beranda › Palmerah › Kost Anggrek Cakra` di atas judul; header global tetap.

**Berubah di.** `components/layout/Header.tsx` (prop `varian="detail"` atau komponen baru
`components/kos/detail/HeaderDetail.tsx`), `app/(user)/kos/[slug]/page.tsx`, `lib/navigasi.ts` (baru: `kembaliAtau(href)`).

**Dampak.** Empat ketukan ke WhatsApp tidak berubah. Ikon simpan/banding pindah dari samping judul ke header;
`AksiKartu` di judul dihapus supaya tidak ganda.

### 8. Tombol ← di `/cari` (P1)

**Sekarang.** `<Link href="/">`. Datang dari `/area/palmerah` → ← malah ke beranda.

**Usulan.** Sama dengan butir 1: `kembaliAtau("/")`.

**Berubah di.** `components/cari/HasilPencarian.tsx` baris ~205.

### 6. Tombol back HP menutup sheet, bukan halaman (P1)

**Sekarang.** Sheet filter, sheet pencarian, Lightbox, dan viewer 360° tidak menyentuh history.
Di Android, back saat sheet terbuka = keluar dari `/cari` dengan sheet masih terbuka sepersekian detik.

**Usulan.** `Sheet` dan `Lightbox` mendapat perilaku: saat `open` menjadi `true`, `history.pushState({sheet: id})`;
`popstate` memanggil `onClose`; saat ditutup lewat tombol ✕, `history.back()` supaya entri bersih.
Satu hook `useTutupDenganBack(open, onClose)` dipakai keempatnya.

**Berubah di.** `components/ui/Sheet.tsx`, `components/ui/Lightbox.tsx`, `components/kos/tur360/*` (pemicu), `lib/navigasi.ts`.

**Dampak.** Harus berjalan bersama butir 5, kalau tidak entri history filter dan sheet saling tumpang tindih.

### 5. Satu entri history per sesi filter (P1)

**Sekarang.** `FilterSheet` memanggil `terapkan` di setiap chip/slider; `terapkan` selalu `pushState`.
Lima sentuhan di sheet = lima entri history. Kembali dari detail lalu tekan back lagi → mundur satu filter, bukan ke beranda.

**Usulan.** `terapkan(ubah, { mode: "replace" | "push" })`. Selama sheet terbuka: `replace`.
"Lihat N kos": `push` sekali dengan state akhir. Chip cepat di luar sheet tetap `push` (satu chip = satu langkah, itu benar).
"Hapus semua" di sheet tidak menutup sheet (sekarang juga tidak, dipertahankan) tapi angka "Lihat N kos" langsung berubah.

**Berubah di.** `components/cari/HasilPencarian.tsx` (`terapkan`), `components/cari/FilterSheet.tsx`.

### 7. Ganti area tanpa balik ke beranda (P1)

**Sekarang.** Sheet pencarian (area populer, saran, riwayat) hanya ada di `PencarianHero` di beranda.
Di `/cari`, judul "Palmerah" adalah teks mati. Kotak "Cari kos di mana?" di header adalah `<Link href="/cari">`,
jadi di `/cari` sendiri tidak melakukan apa-apa, dan dari `/kos` melempar ke area default.

**Usulan.**
- Pisahkan sheet dari `PencarianHero` menjadi `components/cari/PencarianSheet.tsx` (isi sama: input, saran live, area populer, riwayat).
- Di `/cari`: judul jadi tombol `Palmerah ▾` yang membuka sheet; memilih area/kampus → `terapkan` dengan `area` baru, filter dipertahankan.
- Di header global: kotak "Cari kos di mana?" jadi tombol yang membuka sheet yang sama; memilih → `router.push(hrefCari(...))`.

**Berubah di.** `components/cari/PencarianHero.tsx` (dipecah), `components/cari/PencarianSheet.tsx` (baru),
`components/layout/Header.tsx`, `components/cari/HasilPencarian.tsx`.

**Dampak.** Bundle awal `/cari` bertambah sedikit (sheet dimuat lazy lewat `next/dynamic`, jadi mendekati nol).

### 14. Umpan balik saat pindah halaman (P1)

**Sekarang.** Tap kartu di 3G: 1–2 detik tidak ada apa-apa, lalu halaman berganti. Pengguna sering tap dua kali.

**Usulan.** Komponen `ProgresNavigasi` memakai `useLinkStatus()` (Next 16): bar 2 px biru di atas layar saat `pending`.
`KosCard` yang sedang dituju diberi `opacity-70` lewat status yang sama. Menghormati `prefers-reduced-motion`.

**Berubah di.** `components/layout/ProgresNavigasi.tsx` (baru), `app/(user)/layout.tsx`, `components/kos/KosCard.tsx`.

---

## B. Halaman hasil `/cari`

### 3. Peta HP kosong sampai disentuh (P0)

**Sekarang.** Tap "Peta": kanvas abu-abu, hanya tombol +/− dan atribusi. Setelah satu sentuhan (zoom) baru tergambar.
Penyebab: `PetaHasil` dimuat lazy ke kontainer yang baru saja muncul; MapLibre mengukur kontainer sebelum layout final.

**Usulan.** Setelah `map.on("load")`: `requestAnimationFrame(() => map.resize())`, lalu `fitBounds`.
Tambah `ResizeObserver` di kontainer → `map.resize()`. Tampilkan skeleton "Memuat peta…" sampai `load`.

**Berubah di.** `components/cari/PetaHasil.tsx`.

### 4. Tombol Filter tersembunyi (P0)

**Sekarang.** Urutan chip: Semua · ≤ Rp1,5 jt · Km dalam · Bersih · Kedap suara · **Filter**. Di 390 px, Filter di luar layar.

**Usulan.** Filter (dengan badge jumlah) dipaku di kiri, di luar area scroll; chip lainnya scroll di kanannya.
Gradien putih tipis di tepi kanan sebagai isyarat "masih ada lagi".

**Berubah di.** `components/cari/HasilPencarian.tsx` (blok `<ul aria-label="Filter cepat">`).

### 16. Area sticky lebih pendek (P2)

**Sekarang.** Sticky: baris judul (56) + chip (44) + "36 kos · Paling relevan" (44) = 144 px dari 844 px.

**Usulan.** Baris hitung/urut ikut scroll (tidak sticky). Jumlah hasil tetap terlihat di tombol sheet "Lihat N kos" dan di ujung daftar.

**Berubah di.** `components/cari/HasilPencarian.tsx`.

### 17. Kartu HP lebih ringkas (P2)

**Sekarang.** Foto 4:3 (390 × 293) + isi ±210 px = satu kartu per layar; membandingkan lima kos = lima layar.

**Usulan.** Di bawah `sm`: foto 16:10; badge skor/360/Mitra tetap. Di `sm` ke atas tetap 4:3.
Tinggi kartu turun ±60 px (−13 %).

**Berubah di.** `components/kos/KosCard.tsx`, `KosCardSkeleton` (harus sama supaya tidak ada CLS).

### 18. Label chip (P2)

"Km dalam" → "Kamar mandi dalam". `components/cari/HasilPencarian.tsx`.

### 19. Status peta di URL (P2)

**Sekarang.** `peta` adalah `useState`; kembali dari detail → daftar lagi, posisi peta hilang.

**Usulan.** `?tampil=peta` lewat `CariParams` (tidak ikut `KUNCI_FILTER`, tidak memengaruhi query).

**Berubah di.** `lib/cari-params.ts`, `components/cari/HasilPencarian.tsx`.

### 20. Peta PC lebih hidup (P2)

- Geser/zoom peta → tombol "Cari di area peta ini" muncul (tidak otomatis, supaya daftar tidak melompat). Klik → `terapkan` dengan pusat + radius dari `map.getBounds()`.
- Hover kartu → marker membesar/biru tua; hover marker → kartu di daftar di-scroll-into-view halus.

**Berubah di.** `components/cari/PetaHasil.tsx` (prop `onGeser`, `disorot`), `components/cari/HasilPencarian.tsx`, `lib/cari/pusat.ts` (pusat bebas dari koordinat).

---

## C. Halaman detail `/kos/[slug]`

### 9. Layar pertama di PC (P1)

**Sekarang.** 1440 × 900: galeri 748 × 560 + blok 360 (250 px). Nama kos, skor, alamat baru terlihat di scroll kedua.
Panel kanan hanya harga + Chat pemilik.

**Usulan.**
- Blok judul (tipe, nama, alamat, jarak landmark, disurvei oleh) dipindah **di atas** galeri khusus di `lg`; di HP urutan tetap (galeri dulu).
- Galeri PC: grid 1 besar + 4 kecil, tinggi tetap 420 px, tombol "Lihat semua 6 foto" di pojok. HP tetap slider snap.
- 360: bukan blok terpisah; jadi tombol pill "Lihat 360°" di atas galeri (HP dan PC). Blok gelap 250 px hilang.
- Panel kanan PC: tambah skor ringkas (angka + 2 kekuatan) di atas harga.

**Berubah di.** `components/kos/DetailKos.tsx`, `components/kos/detail/Galeri.tsx`, `components/kos/tur360/Tur360Pemicu.tsx`.

**Catatan.** Komentar di `DetailKos.tsx` menyatakan urutan blok disengaja dan tidak boleh diubah. Usulan ini hanya
memindahkan blok 2 (judul) ke atas blok 1 (galeri) di PC; urutan 3–12 tidak disentuh. Perlu persetujuan.

### 10. Navigasi bagian di HP (P1)

**Sekarang.** Halaman ±7.500 px. Untuk sampai ke catatan surveyor perlu ±12 layar scroll.

**Usulan.** Baris chip sticky di bawah header detail, muncul setelah galeri lewat:
Biaya · Skor · Fasilitas · Aturan · Lokasi · Catatan · Ketersediaan. Chip aktif mengikuti scroll (`IntersectionObserver`).
Tap → `scrollIntoView` dengan offset header. Di PC jadi daftar isi di panel kanan, di bawah kartu kontak.

**Berubah di.** `components/kos/detail/NavBagian.tsx` (baru), `components/kos/detail/bagian.tsx` (`Blok` sudah punya `id`), `components/kos/DetailKos.tsx`.

### 11. Tap foto membuka Lightbox (P1)

**Sekarang.** `Galeri` hanya slider; `Lightbox` dipakai `Minimap` untuk foto patokan. Tap foto kos = tidak ada respons.

**Usulan.** Tap foto → `Lightbox` (sudah ada, lazy) dengan indeks aktif, geser kiri/kanan, keterangan foto, ✕, dan tutup lewat back (butir 6).
Cubit zoom pakai `touch-action: pinch-zoom` di dalam Lightbox.

**Berubah di.** `components/kos/detail/Galeri.tsx`, `components/ui/Lightbox.tsx` (prop `indeks`, `keterangan`).

### 12. Angka kebersihan & kedap suara diberi arti (P1)

**Sekarang.** "Kebersihan 4,5/5", "Kedap suara 1/5", "Sunyi 49 dB / Saat tes 81 dB, selisih 32 dB". Benar, tapi penyewa harus menafsirkan sendiri.
Di filter: dua slider 1–5 dengan langkah 0,5; sulit disentuh presisi di HP.

**Usulan.**
- Peta kata, satu sumber di `lib/skala.ts`:
  kebersihan ≥ 4,5 "Sangat bersih" · ≥ 4 "Bersih" · ≥ 3 "Cukup" · < 3 "Kurang";
  kedap ≥ 4 "Kedap" · ≥ 3 "Lumayan" · < 3 "Berisik"; selisih dB ≥ 30 "Tembus jelas" · 15–30 "Terdengar samar" · < 15 "Hampir tidak terdengar".
- `SkorRincian` dan `BuktiKebersihan` menampilkan `4,5/5 · Sangat bersih`; tombol "Apa artinya?" membuka sheet 3 kalimat (bukan tooltip, supaya bisa disentuh).
- Filter: slider diganti chip bertingkat "Cukup 3+ · Bersih 4+ · Sangat bersih 4,5+" (kebersihan) dan "Lumayan 3+ · Kedap 4+" (suara). URL tetap `kebersihan=` / `kedap=`.
- Kartu: tag "Bersih" / "Kedap suara" sudah ada; ditambah tag negatif "Berisik" hanya bila kedap < 2,5 (informasi, bukan hukuman; red flag tetap di panel merah).

**Berubah di.** `lib/skala.ts` (baru, dengan unit test), `components/kos/detail/SkorRincian.tsx`, `components/kos/detail/BuktiKebersihan.tsx`,
`components/cari/FilterSheet.tsx`, `components/kos/KosCard.tsx`, `app/(user)/cara-kami-menilai/page.tsx` (tabel arti kata).

**Dampak.** Tidak menyentuh rumus skor, view `kos_skor`, atau `lib/scoring.ts`.

### 13. Umpan balik simpan/banding + tray (P1)

**Sekarang.** Tap ♡: ikon terisi, selesai. Tap ⇄ dua kali di dua kartu: tidak ada petunjuk bahwa perbandingan siap; jalan ke `/banding` hanya lewat footer.
`BandingDariTray` hanya berfungsi di `/banding` tanpa `?kos=`.

**Usulan.**
- `components/ui/Toast.tsx` (baru, satu antrean global, `aria-live="polite"`, 3 detik, ada tombol aksi):
  "Tersimpan · Lihat simpanan", "Dihapus dari simpanan", "Ditambahkan ke perbandingan (2 dari 3) · Bandingkan".
- Tray mengambang di bawah (di atas `BarAksi` di detail): "2 kos dibandingkan · Bandingkan ›" saat `useBanding().length ≥ 1`, bisa ditutup, muncul di `/cari`, `/kos`, `/disimpan`, `/area`.
- Ikon simpanan di header diberi badge angka.

**Berubah di.** `components/ui/Toast.tsx`, `components/kos/TrayBanding.tsx` (baru), `components/kos/KosCard.tsx` (`AksiKartu`),
`components/layout/Header.tsx`, `app/(user)/layout.tsx`.

### 21. Fasilitas lebih padat (P2)

**Sekarang.** Satu kolom; ±25 baris; yang tidak tersedia dicoret satu-satu.

**Usulan.** Grid 2 kolom (HP) / 3 kolom (PC) untuk yang tersedia; yang tidak tersedia dilipat "Tidak tersedia (6)" (Accordion, tertutup).
Kategori "Di kamar / Bersama" tetap.

**Berubah di.** `components/kos/detail/DaftarFasilitas.tsx`.

---

## D. Bandingkan `/banding`

### 2. Tabel meluap di HP (P0)

**Sekarang.** `TabelBanding` memakai `<table>` lebar penuh tanpa pembungkus scroll; dengan 2 kos halaman jadi 547 px di viewport 390 px:
kolom kos kedua terpotong, header dan footer ikut melebar, halaman bisa digeser horizontal.

**Usulan.** Pembungkus `overflow-x-auto` dengan `snap-x`; kolom label `position: sticky; left: 0` (lebar 112 px);
kolom kos `min-width: 220px`. Baris foto + nama `sticky top` supaya saat scroll ke bawah tetap tahu kolom mana yang mana.
Isyarat gulir: bayangan di tepi kanan saat masih ada kolom tersembunyi.

**Berubah di.** `components/kos/TabelBanding.tsx`, `app/(user)/banding/page.tsx`.

### 22. Aksi di tabel (P2)

- Nama kos → tautan ke `/kos/[slug]`.
- ✕ kecil di tiap kolom: keluarkan dari perbandingan (memperbarui `?kos=`).
- Kolom ketiga kosong "+ Tambah kos" → `/cari` (tray tetap terisi).
- "Sama semua (2) — tampilkan" → tombol sekunder "Tampilkan 2 hal yang sama".
- Baris terakhir: tombol sekunder "Chat pemilik" per kolom (bukan oranye; oranye hanya satu per layar).

**Berubah di.** `components/kos/TabelBanding.tsx`, `lib/kos/banding.ts`.

---

## E. Disimpan `/disimpan`

### 23. (P2)

- Bila 2–3 kos tersimpan: tombol "Bandingkan yang tersimpan" → `/banding?kos=...`.
- Urutkan termurah/terbaru (chip kecil).
- Baris kecil "Tersimpan di HP ini" + tombol "Salin tautan simpanan" (`/disimpan?kos=a,b,c`) supaya bisa dikirim ke teman/orang tua. Halaman menerima `?kos=` dan menawarkan "Simpan semua ke HP ini".

**Berubah di.** `components/kos/DaftarSimpanan.tsx`, `app/(user)/disimpan/page.tsx`, `lib/simpan.ts`.

---

## F. Area `/area/[slug]`

### 15. Daftar terlalu panjang (P1)

**Sekarang.** Semua kos area dirender penuh (`kos.map`), 36 kartu satu kolom di HP; FAQ (untuk SEO dan calon penyewa baru) di ujung 19.000 px.

**Usulan.** Tampilkan 6 kartu (grid 2 kolom di `sm`), tombol "Lihat semua 36 kos di Palmerah" → `/cari?area=`.
Urutan: judul + CTA → fakta → 6 kos → FAQ → area tetangga. JSON-LD `ItemList` tetap 20 item (tidak terlihat).

**Berubah di.** `app/(user)/area/[slug]/page.tsx`.

---

## G. Beranda

### 24. Lanjutkan pencarian (P2)

Bila `kb:riwayat-cari` berisi, tampilkan satu kartu kecil di bawah hero: "Lanjutkan: Palmerah, ≤ Rp1,5 jt" → href tersimpan.
Klien saja (`useSyncExternalStore`), tidak memengaruhi SSG.

**Berubah di.** `components/beranda/LanjutkanCari.tsx` (baru), `app/(user)/page.tsx`.

---

## H. Mitra (ringan)

### 25. (P2)

- `NavMitra`: sembunyikan tautan "Masuk" saat di `/masuk`; logo → landing mitra.
- Setelah "Kirim kode": fokus otomatis ke input kode (sudah `autoFocus`), tambah "Kirim ulang" dengan hitung mundur 30 detik dan "Ganti nomor".

**Berubah di.** `components/mitra/NavMitra.tsx`, `components/mitra/FormMasuk.tsx`.

---

## Yang sengaja tidak diubah

- Rumus Skor Bahagia, urutan peringkat, aturan red flag, tanpa login: tidak disentuh.
- Urutan blok 3–12 halaman detail (lihat butir 9).
- Sort tetap `<select>` native: di HP memunculkan picker sistem, itu lebih baik daripada dropdown buatan.
- Pemulihan posisi scroll saat kembali dari detail: sudah benar (diuji: scrollY 1199 → 1199).
- Infinite scroll + tombol "Muat lebih banyak": sudah benar.

## Urutan pengerjaan yang disarankan

1. **Fondasi navigasi** (butir 1, 8, 6, 5, 14 dan `lib/navigasi.ts`): semua yang menyangkut tombol kembali dan history diselesaikan bersama supaya konsisten.
2. **P0 sisanya** (2, 3, 4).
3. **Detail** (9, 10, 11, 12, 13, 21).
4. **Cari lanjutan** (7, 16, 17, 18, 19, 20).
5. **Banding, disimpan, area, beranda, mitra** (15, 22, 23, 24, 25).

Tiap tahap: `npm run typecheck && npm run lint && npm test && npm run build`, lalu uji ulang alur di 390 px dan 1440 px sebelum lanjut.
