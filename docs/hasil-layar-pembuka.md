# Hasil: layar pembuka ala Outlook

Tanggal: 18 Oktober 2026. Dasar: permintaan Calvin dengan contoh layar pembuka Outlook di web (layar putih, ikon
aplikasi besar di tengah, nama pembuat di bawah). Mengembangkan intro logo v3.1 (`docs/hasil-update-minor-v3-motion.md`
bagian 3); keputusan Calvin: diputar pada **setiap muat penuh**, **digabung** dengan intro v3.1, ikon **versi berlapis**.

**Status.** Diterapkan dan diuji di lokal. **Belum** di-commit, di-push, atau di-deploy. Tanpa dependency atau aset baru.

## Urutannya

| Waktu | Yang terjadi |
|---|---|
| 0–240 ms | Layar putih penuh; ikon berlapis muncul (fade + skala 0,86 → 1) |
| 120–420 ms | "Kos Bahagia" (logo kecil + nama) muncul di bawah, seperti nama pembuat di Outlook |
| 160–480 ms | Senyum putih tergambar |
| 480–620 ms | Ikon diam sebentar |
| 620–1180 ms | Ikon mengecil dan terbang ke logo header (560 ms); layar putih dan nama di bawah memudar (420 ms); lapisan hiasan ikon memudar sehingga yang mendarat identik dengan logo header |

Total terukur ±1,18 detik, mendarat 0,0 px dari logo header. Di HP pada `/cari` dan `/kos` (header global tersembunyi)
ikon dan layar putih memudar di tempat, ±0,9 detik.

**Ikon berlapis** (`components/ui/LogoBerlapis.tsx`): bentuk rumah dan senyum yang sama persis dengan logo header
(viewBox 32 × 32), ditambah kartu biru dan lembar laporan survei yang mengintip di belakang atap, gradien biru, dan
kilau lembut. Warna dari token biru Kos Bahagia; 112 px di HP, 128 px di layar lebar.

## Kapan diputar

Setiap muat penuh: alamat diketik, datang dari Google atau tautan WhatsApp, reload, dan back/forward yang memuat ulang.
**Tidak** diputar untuk navigasi di dalam situs, `router.refresh()`, halaman yang dipulihkan dari back/forward cache,
tab yang dibuka di latar belakang atau di-prerender, crawler mesin pencari, reduced motion, browser tanpa Web Animations,
dan tanpa JavaScript. Surface mitra tidak memakainya.

Halaman tetap dimuat dan berfungsi di belakangnya (`pointer-events: none`, `aria-hidden`). Sentuhan, ketukan tombol,
scroll, resize, pindah halaman, atau tab disembunyikan langsung mengakhirinya; logo header selalu kembali. Bila
JavaScript lambat, CSS memudarkan semuanya sendiri di 1,5–1,7 detik.

**Konsekuensi yang perlu diketahui:** karena diputar di setiap muat penuh, pengunjung dari Google atau tautan yang
dibagikan melihat layar putih ±1,2 detik sebelum konten, walau konten sudah dimuat di belakangnya. Alat ukur seperti
Lighthouse dapat mencatat waktu tampil konten lebih lambat dari sebelumnya.

## File

| File | Perubahan |
|---|---|
| `components/ui/LogoBerlapis.tsx` (baru) | Ikon berlapis untuk layar pembuka |
| `components/layout/IntroLogo.tsx` | Layar putih + nama di bawah; ikon terbang sambil layar memudar; hiasan memudar ke logo datar |
| `lib/intro-logo.ts`, `lib/intro-logo.test.ts` | Skrip pre-paint untuk setiap muat penuh (dan pengecualiannya); konstanta tahan/latar; 2 tes baru |
| `app/globals.css` | Lapisan putih, nama di bawah (memperhatikan safe area), urutan lapisan |
| `docs/hasil-update-minor-v3-motion.md` | Catatan pembaruan di bagian atas |
| `scripts/uji-motion-v31.py`, `scripts/uji-ux-v3.py`, `scripts/uji-ux-v3-ulang.py`, `scripts/uji-tutorial.py` | Uji muat pertama + layar putih + nama di bawah; uji lain menunggu pembuka selesai sebelum memotret |

## Hasil pemeriksaan

| Perintah | Hasil |
|---|---|
| `npm run lint`, `npm run typecheck` | Bersih |
| `npm test` | 126 lulus (2 tes baru: kapan pembuka diputar dan pengecualiannya, langsung menjalankan skrip pre-paint) |
| `npm run build` | Lolos, 71 halaman |
| `DEV=http://localhost:3010 OUT_DIR=docs/tangkapan/pembuka python3 scripts/uji-motion-v31.py` | **32/32** (Chromium dan WebKit), termasuk StrictMode di `next dev`: 1 animasi terbang per muat |
| `python3 scripts/uji-tutorial.py` (Chromium) | 14/14 (tawaran tutorial baru dicatat setelah pembuka selesai) |
| `python3 scripts/uji-ux-v3.py` (Chromium) | 27/27, axe-core 0 pelanggaran |
| `python3 scripts/uji-ux-v3-ulang.py` (Chromium) | 11/11 |

Angka pembuka dari `docs/tangkapan/pembuka/hasil-uji.json`:

- Muat pertama dan reload beranda, HP dan PC, Chromium dan WebKit: layar putih penuh (rgb 255) dan "Kos Bahagia" di
  bawah terlihat, senyum tergambar, ikon terbang dan mendarat **0,0 px** dari logo header, 1144–1195 ms, lalu logo
  header kembali dan layar putih hilang.
- HP `/cari` dan `/kos`: memudar di tempat, 862–892 ms; bar halaman tidak bergeser. PC `/kos`: terbang, ±1,18 detik.
- Scroll, resize, atau pindah halaman saat pembuka: berhenti dalam 19–68 ms, logo header terlihat.
- Back/forward yang memuat ulang penuh: diputar; history tidak bertambah. Reduced motion: tidak diputar.

Bukti: `docs/tangkapan/pembuka/urutan-hp-chromium.png` dan `urutan-pc-chromium.png` (frame 120, 450, 700, 900, 1100,
1500 ms), `intro-hp-1…4-chromium.png`, video `video/intro-beranda-hp|pc-*.webm` dan `video/intro-cari-hp-pudar-*.webm`.

## Keterbatasan

- Hanya browser headless (Playwright Chromium dan WebKit) di Mac ini; belum di Safari asli, HP fisik, atau Firefox.
- Pemulihan dari back/forward cache tidak dapat diamati di Chromium headless (halaman selalu dimuat ulang); perilakunya
  dari kode: halaman yang dipulihkan tidak menjalankan skrip pre-paint lagi.
- Belum diuji dengan pengguna apakah ±1,2 detik di setiap muat penuh terasa mengganggu.

## Perintah commit dan push

Tanpa migrasi. Dokumen audit, prompt tindak lanjut audit, dan file presentasi 3.1 yang belum terlacak tidak ikut.

```bash
cd /Users/calvinn/KosBahagia
```

```bash
git add components/ui/LogoBerlapis.tsx components/layout/IntroLogo.tsx lib/intro-logo.ts lib/intro-logo.test.ts app/globals.css scripts/uji-motion-v31.py scripts/uji-tutorial.py scripts/uji-ux-v3.py scripts/uji-ux-v3-ulang.py docs/hasil-layar-pembuka.md docs/hasil-update-minor-v3-motion.md docs/hasil-tutorial-singkat-per-bagian.md docs/tangkapan/pembuka
```

```bash
git status
```

```bash
git commit -m "Opening screen on every full load with layered logo"
```

```bash
git push
```
