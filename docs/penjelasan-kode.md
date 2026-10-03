# Penjelasan kode Kos Bahagia, dari depan sampai belakang

Panduan untuk menjelaskan kode ini ke orang lain (dosen, teman, pewawancara) tanpa harus membuka
setiap file. Urutannya mengikuti perjalanan satu permintaan: dari pengguna mengetik URL, lewat
Next.js, ke Postgres di Supabase, lalu kembali jadi halaman. Tiap bagian menyebut **file** yang
bisa kamu buka sambil bicara, dan diakhiri **kalimat siap ucap** (dicetak miring).

---

## 0. Gambaran satu layar

```
Browser (penyewa, tanpa login)                Browser (pemilik kos, OTP WhatsApp)
        │                                              │
        ▼                                              ▼
┌──────────────────────────── Next.js 16 (App Router) di Vercel ────────────────────────────┐
│ proxy.ts        memisahkan host kosbahagia.com  ↔  mitra.kosbahagia.com                    │
│ app/(user)/     halaman penyewa (Server Components + sedikit Client Components)           │
│ app/(mitra)/    halaman pemilik (Server Actions + sesi Supabase Auth)                     │
│ app/api/        sehat, galat, cron pengingat Senin                                        │
│ lib/            logika bersama: kontrak URL, skor, format, WhatsApp, navigasi, dsb.       │
│ components/     UI: ui/ (primitif), kos/, cari/, beranda/, area/, mitra/, layout/         │
└───────────────┬───────────────────────────────────────────────────┬───────────────────────┘
                │ REST (anon key, RLS)                              │ supabase-js (server / service role)
                ▼                                                   ▼
┌──────────────────────── Supabase: Postgres + PostGIS + Auth + Storage ────────────────────┐
│ migrations/  19 tabel · 3 view (kos_skor, kos_kartu, area_publik) · cari_kos_v3() dll    │
│ RLS di semua tabel · trigger pelindung kolom survei · pgTAP 109 asersi                    │
│ seed/        50 kos deterministik + foto dummy dari public/dummy/manifest.json            │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

Tiga keputusan yang menjelaskan hampir semua bentuk kode:

1. **Penyewa tidak pernah login.** Semua data penyewa dibaca lewat REST anonim yang dibatasi RLS.
2. **Skor dihitung di basis data, bukan di aplikasi.** View `kos_skor` adalah sumber kebenaran;
   `lib/scoring.ts` hanya cermin untuk menampilkan rincian, dan ada skrip yang membuktikan keduanya sama.
3. **Pencarian adalah satu fungsi SQL** (`cari_kos_v3`, promosi lewat `kos_promosi`) yang menerima parameter dari URL, jadi tautan hasil
   bisa dibagikan dan server maupun browser memanggil hal yang sama.

*"Arsitekturnya Next.js App Router di depan, Supabase di belakang. Yang membuatnya beda: logika
produk yang penting, skor dan urutan pencarian, ada di Postgres, supaya tidak bisa dilangkahi
oleh kode aplikasi mana pun."*

---

## 1. Titik masuk: `proxy.ts` dan dua root layout

**File:** `proxy.ts`, `app/(user)/layout.tsx`, `app/(mitra)/layout.tsx`

Next 16 memakai `proxy.ts` (pengganti `middleware.ts`). Ia berjalan di tepi (edge) sebelum halaman:

- Kalau host-nya `mitra.kosbahagia.com`, path `/x` ditulis ulang jadi `/mitra/x`, jadi URL pemilik tetap pendek.
- Kalau host utama menerima `/mitra/*`, ia dialihkan ke host mitra (kecuali saat tidak ada subdomain,
  misalnya deploy `*.vercel.app`; itu yang dicek `MITRA_HOST_TERPISAH`).
- `/mitra/dashboard/*` tanpa cookie sesi (`kb-mitra`) dilempar ke `/mitra/masuk`.
- Host mitra dapat header `X-Robots-Tag: noindex`.

Dua route group `(user)` dan `(mitra)` punya `layout.tsx` sendiri-sendiri (dua `<html>` berbeda),
sehingga penyewa tidak pernah memuat komponen pemilik, dan sebaliknya. Layout penyewa memasang
`Header`, `Footer`, `TrayBanding`, `Toaster`, dan `PelacakRiwayat` (penghitung halaman untuk tombol Kembali).

*"Dua produk dalam satu repo: penyewa dan mitra. Pemisahnya bukan folder saja, tapi host dan root
layout yang berbeda, dan proxy yang menjaga supaya tidak saling bocor."*

---

## 2. Perjalanan permintaan penyewa

### 2a. Beranda `/`

**File:** `app/(user)/page.tsx`, `components/beranda/*`, `components/cari/PencarianHero.tsx`, `components/cari/PresetGrid.tsx`

- Server Component: `muatData()` mengambil daftar area, 24 kos terbaru dari view `kos_kartu`, dan jumlah kos tayang.
  `export const revalidate = 600` → halaman di-cache 10 menit (ISR).
- `PencarianHero` (client) memberi typeahead lewat RPC `cari_saran`; di HP membuka `PencarianSheet`.
- `PresetGrid` hanya membangun tautan `/cari?…` lewat `hrefCari()`; tidak ada logika pencarian di beranda.
- `HeroVisual` adalah kartu kos + ilustrasi kamar yang digambar SVG, tanpa gambar eksternal.

### 2b. Hasil pencarian `/cari`

**File:** `app/(user)/cari/page.tsx`, `components/cari/HasilPencarian.tsx`, `lib/cari-params.ts`, `lib/cari/{pusat,ambil,longgar}.ts`, `components/cari/{FilterSheet,PetaHasil}.tsx`

Alurnya:

1. **URL adalah state.** `lib/cari-params.ts` mendefinisikan kontrak: `area`, `radius`, `harga_max`,
   `kebersihan`, `kedap`, `fasilitas`, `tipe`, `urut`, `hal`, `tampil=peta`, `lat/lng`.
   `bacaCariParams()` membaca dan memvalidasi; `hrefCari()` menulis. Kedua sisi (server dan browser) memakai ini.
2. **Halaman pertama dirender di server.** `page.tsx` memanggil `tentukanPusat()` (area → titik pusat +
   radius) lalu `ambilHasil()` → RPC `cari_kos_v3` dan `ambilPromosi()` → RPC `kos_promosi` (maks. 2 kos
   spotlight yang lolos filter yang sama, ditampilkan di blok "Promosi berbayar"). Hasil dikirim ke client
   sebagai `awal`, lengkap dengan `kunci` (string query) supaya browser tahu datanya masih segar.
   Rentang harga minimal > maksimal tidak dicari sama sekali: `validasiRentangHarga()` membuat halaman
   menjelaskan error input, bukan "Nggak ada yang pas".
3. **Perubahan filter terjadi di browser.** Chip dan sheet memanggil `terapkan()` yang hanya mengubah URL
   (`pushState` untuk chip, `replaceState` selama sheet terbuka). `useSearchParams` berubah →
   `useEffect` memanggil `ambilHasil()` lagi lewat `restKlien` (klien PostgREST ringan, bukan supabase-js).
4. **Peta** dimuat `next/dynamic` hanya saat ditampilkan; MapLibre + tile OpenFreeMap, tanpa kunci API.
   Geser peta memunculkan "Cari di area peta ini" yang mengirim `lat/lng/radius` ke URL.
5. **Nol hasil bukan jalan buntu.** `lib/cari/longgar.ts` mencoba melonggarkan satu filter dan mencari
   3 kos terdekat di luar radius.

*"Semua state pencarian hidup di URL. Server merender halaman pertama supaya cepat dan bisa di-SEO,
sesudah itu browser cukup memanggil fungsi SQL yang sama lewat REST."*

### 2c. Detail kos `/kos/[slug]`

**File:** `app/(user)/kos/[slug]/page.tsx`, `lib/kos/detail.ts`, `components/kos/DetailKos.tsx`, `components/kos/detail/*`

- `generateStaticParams` merender semua kos tayang saat build; `revalidate = 3600`; `dynamicParams = true`
  supaya kos baru tetap bisa dibuka.
- `detailKos()` dibungkus `cache()` React: `generateMetadata`, halaman, dan `opengraph-image.tsx`
  berbagi satu kali fetch. Ia menarik ±10 tabel sekaligus dengan `Promise.all`.
- Kalau query gagal (bukan "tidak ada"), fungsi melempar error supaya `app/(user)/error.tsx` yang tampil,
  bukan 404 yang tersimpan di cache ISR.
- `DetailKos` menyusun blok dalam urutan pertanyaan penyewa (ringkasan → skor → biaya → kebersihan & suara →
  fasilitas → aturan → cara ke sini → sekitar → catatan surveyor → ketersediaan → serupa). Urutannya sengaja.
- **Tipe kamar terpilih** ada di `?kamar=<id>` (dibaca dengan `useSyncExternalStore`, jadi halaman tetap statis).
  Satu pilihan itu menggerakkan harga, status, Ringkasan, uang masuk, fasilitas, pesan WhatsApp, simpan, dan banding.
  Status per tipe kamar dihitung `statusKamar()` di `lib/kamar.ts`: Tersedia / Penuh / Belum dikonfirmasi.
- **Semua angka biaya** lewat `hitungBiaya()` dan `hitungUangMasuk()` di `lib/biaya.ts`: satu fungsi untuk kartu,
  detail, banding, dan pesan WhatsApp. Biaya yang belum diketahui tidak pernah dihitung nol.
- `Ketersediaan` (client) mengambil angka kamar terbaru lewat REST saat halaman dibuka, jadi angka
  ketersediaan tidak menunggu cache 1 jam.
- `Minimap` menggambar rute dari `kos_sekitar.rute` (JSON: landmark, langkah, total menit) dengan SVG;
  `PetaInset` memuat MapLibre hanya saat "Lihat peta asli" ditekan.
- Tur 360° (`components/kos/tur360/`) adalah viewer WebGL mentah tanpa library, dimuat setelah tombolnya ditekan.

### 2d. Tombol oranye: WhatsApp

**File:** `components/kos/detail/BarAksi.tsx`, `lib/wa.ts`

`TombolChat` adalah `<a href="https://wa.me/…">` biasa dengan pesan yang sudah terisi (`pesanWa`): nama kos,
tipe kamar, status, dan total yang sama dengan di layar. Kalau tipe kamarnya penuh, labelnya "Tanya kapan tersedia".
Sebelum membuka, `catatKlikWa()` menulis satu baris ke tabel `klik_wa` lewat REST (anon boleh insert,
tidak boleh baca). Baris inilah "lead" yang dijual ke pemilik. Selama `MODE_DEMO` (`lib/demo.ts`) aktif,
tombol menampilkan pesannya saja tanpa membuka WhatsApp, karena nomor di data contoh tidak asli.

*"Kami tidak memegang pembayaran. Produk berakhir di tautan WhatsApp; yang kami catat cuma kliknya."*

### 2e. Simpan dan bandingkan tanpa akun

**File:** `lib/simpan.ts`, `components/kos/{KosCard,TrayBanding,DaftarSimpanan,TabelBanding}.tsx`, `app/(user)/banding/page.tsx`

`lib/simpan.ts` adalah store kecil di `localStorage` (`kb:simpan`, `kb:banding`) yang dibaca lewat
`useSyncExternalStore`; datanya hanya di perangkat itu. Setiap item menyimpan **kos dan tipe kamar**; item dari
versi lama (tanpa tipe kamar) tetap terbaca. Simpanan menyimpan cuplikan harga/ketersediaan supaya `/disimpan`
bisa bilang "harga naik sejak disimpan". `/banding?kos=slug:kamarId,slug2` (format di `lib/kos/kunci-banding.ts`)
dirender di server dari URL, jadi tautannya bisa dikirim ke orang tua yang tidak pernah membuka situs ini, dan
kamar AC tetap dibandingkan sebagai kamar AC. Tipe kamar yang sudah tidak ada dijelaskan dan bisa diganti.

---

## 3. Lapisan data di browser: `lib/supabase/rest.ts`

Satu file ±60 baris yang mengganti `supabase-js` di sisi penyewa: `restRpc`, `restSelect`, `restInsert`.
Alasannya ukuran: supabase-js ±60 KB gzip, dan penyewa tidak butuh auth. Server tetap memakai
`supabase-js` (`lib/supabase/server.ts` dengan anon key; `lib/supabase/mitra.ts` dengan sesi pemilik).

*"Browser penyewa hanya memanggil PostgREST langsung dengan anon key. Yang boleh dibaca ditentukan
oleh RLS, bukan oleh kode di browser."*

---

## 4. Basis data: skema dan aturan yang hidup di Postgres

**File:** `supabase/migrations/*.sql` (urut 0100–0900, lalu dua migrasi audit 2026-10)

| Migrasi | Isi |
|---|---|
| `0100_extensions_enums` | PostGIS, pg_trgm, enum (`tipe_kos`, `tier_kos`, `status_kos`, `sumber_klik`, …) |
| `0200_tables` | `area`, `kos`, `tipe_kamar`, `kos_penilaian`, `kos_aturan`, `kos_sekitar`, `kos_media`, `catatan_surveyor`, `fasilitas`, `kos_fasilitas`, `klik_wa`, `kunjungan_kos`, `laporan_user`. Kolom `tipe_kamar.total_bulanan` adalah **generated column** dari sewa + komponen biaya |
| `0300_skor_dan_cari` | view `kos_skor` (rumus Skor Bahagia) dan fungsi `cari_kos()` versi 1 |
| `0400_rls` | RLS semua tabel; helper `punya_kos()`, `kos_tayang()`; trigger `lindungi_kolom_survei` |
| `0500_kos_kartu_saran` | view `kos_kartu` (satu baris per kos untuk kartu) dan `cari_saran()` (typeahead) |
| `0600_cari_v2` | `cari_kos()` v2: hitung total, urutan penuh↓ / basi↓ / spotlight↑ / premium↑, `area_publik` |
| `0700_tur360` | kolom `kos_media.tur` (jsonb) untuk titik 360° |
| `0800_area` | `statistik_area()`, `area_tetangga()`, `area_radius_m()` untuk halaman area |
| `0900_mitra` | `owner`, `pendaftaran_mitra`, `log_ketersediaan`, `tautan_ketersediaan`, `pengingat_wa`, `permintaan_koreksi`, fungsi tautan sekali pakai, bucket Storage `foto-kos` |
| `20261003…0100_biaya_kamar_skor` | per tipe kamar: kamar mandi dalam, bulan bayar di muka, biaya sekali bayar, ketentuan deposit, tanggal harga dicek, `total_lengkap`, `total_estimasi`; rubrik transparansi baru di `kos_skor`; `kos_kartu` memakai kamar acuan (termurah yang masih ada kamar) |
| `20261003…0200_cari_v3_promosi` | `kos_cocok`, `cari_kos_v3` (urutan murni untuk Termurah/Terdekat/Skor), `kos_promosi`, batas laporan per jam |

Hal-hal yang layak ditunjuk:

- **`kos_skor`**: kebersihan 30 % (rata-rata kamar mandi/dapur/koridor), kedap 20 %, transparansi biaya 20 %
  (empat cek keterbukaan per tipe kamar, 1,25 poin per cek; porsi biaya di luar sewa hanya informasi),
  fasilitas-untuk-harga 15 % (persentil di antara kos sebaya), sekitar 15 %.
  Komponen yang datanya tidak ada dibuang dari pembagi, bukan diisi nilai tengah. Kalau kebersihan atau kedap
  kosong, skor `null` → UI menulis "Belum dinilai".
- **`cari_kos_v3(p_lat, p_lng, p_radius_m, …)`**: satu fungsi untuk semua filter; `st_dwithin` PostGIS untuk radius,
  `total_count` dihitung di query yang sama. "Termurah", "Terdekat", "Skor tertinggi" urut murni sesuai labelnya;
  "Paling relevan" mengutamakan kos yang ada kamar dan datanya segar, lalu paket berbayar, lalu skor. Promosi
  ada di fungsi terpisah `kos_promosi` dan tidak mengubah urutan. Filter harga hanya menerima total yang lengkap.
- **RLS**: anon boleh `select` hanya kos `tayang` (via `kos_tayang()`), boleh `insert` `klik_wa`/`kunjungan_kos`/`laporan_user`
  tapi tidak boleh membacanya; pemilik hanya menyentuh kos yang `punya_kos()`.
- **Trigger `lindungi_kolom_survei`**: pemilik bisa mengubah harga dan ketersediaan, tapi kolom hasil survei
  (skor, catatan, red flag) ditolak di level basis data. Ini implementasi dari aturan "paket berbayar tidak mengubah skor".
- **Trigger `catat_ketersediaan`**: tiap perubahan ketersediaan masuk `log_ketersediaan` dengan `sumber` (`dashboard`, `bot_wa`).

*"Semua aturan yang bisa disalahgunakan dijaga di Postgres: RLS untuk siapa boleh apa, trigger untuk kolom
survei, view untuk rumus skor. Aplikasi boleh salah, basis data tidak ikut salah."*

### Pengujian basis data

**File:** `supabase/tests/*.test.sql` (pgTAP, 109 asersi), `scripts/cek-skor-db.ts`

`npx supabase test db` menjalankan pgTAP: hasil `cari_kos_v3` untuk seed yang dikenal, urutan per mode, promosi,
biaya yang belum diketahui, RLS (anon tidak bisa membaca draft; owner A tidak bisa mengubah kos B), fungsi area,
tautan mitra, batas laporan, dan konsistensi catatan surveyor dengan hasil ukur.
`npm run cek:skor-db` menghitung skor semua kos tayang dengan `lib/scoring.ts` dan total semua tipe kamar dengan
`lib/biaya.ts`, lalu membandingkannya dengan database.

---

## 5. Seed: data contoh yang bisa dipercaya

**File:** `supabase/seed/generate.ts` → `supabase/seed/01_seed.sql`, `public/dummy/`, `scripts/foto-dummy-ilustrasi.mjs`

- 50 kos (40 Palmerah, 10 Lowokwaru), 47 tayang. Dibuat dari PRNG berbiji (mulberry32) jadi hasilnya sama di
  setiap mesin; pgTAP mengunci nilai-nilai tertentu dari stream pertama, kolom yang ditambah belakangan memakai stream kedua.
- Foto adalah ilustrasi dari `public/dummy/manifest.json`, dipilih dengan hash slug supaya konsisten per kos
  (foto 1 tampak depan, 2 kamar, 3 kamar mandi, …). Skrip `scripts/foto-dummy.mjs` adalah versi Gemini
  yang bisa dipakai kalau billing API aktif.
- `npm run cek:rilis` memblokir rilis selama masih ada foto placeholder atau kos tanpa surveyor.

---

## 6. Sisi pemilik (mitra)

**File:** `app/(mitra)/mitra/*`, `lib/mitra/{sesi,aksi,dasar}.ts`, `lib/supabase/{mitra,mitra-client,mitra-cookie}.ts`, `components/mitra/*`

- **Masuk**: `FormMasuk` memanggil `supabase.auth.signInWithOtp({ phone })` (kanal SMS atau WhatsApp
  tergantung `NEXT_PUBLIC_WA_OTP`), lalu `verifyOtp`. Sesi disimpan di cookie `kb-mitra` lewat `@supabase/ssr`.
  Lokal: nomor uji di `supabase/config.toml` menerima kode `123456`.
- **Sesi**: `sesiMitra()` membaca cookie di server; `wajibSesi()` mengalihkan ke `/masuk?next=…` bila kosong.
- **Aksi**: `lib/mitra/aksi.ts` berisi Server Actions (`simpanKetersediaan`, `simpanKos`, `ajukanKoreksi`,
  `tambahFoto`, …). Semua memakai klien dengan sesi pemilik, jadi RLS tetap berlaku; tidak ada jalur "admin" dari UI.
- **Statistik**: `dashboard/statistik` menghitung kunjungan dan klik WhatsApp 30 hari dibanding median area (`median_area_bulan_ini()`).
- **Pengingat Senin**: `vercel.json` menjadwalkan `GET /api/cron/ingatkan-ketersediaan` (dilindungi `CRON_SECRET`).
  Route mencari kos yang > 30 hari tidak dikonfirmasi, membuat tautan sekali pakai 7 hari lewat
  `buat_tautan_ketersediaan()`, dan mengirim WhatsApp (Meta Cloud API bila `WA_CLOUD_*` terisi, kalau tidak dry run).
  Halaman `/mitra/t/[token]` memperbarui ketersediaan tanpa login lewat `perbarui_ketersediaan_via_tautan()`.

*"Pemilik tidak punya kata sandi. Login OTP WhatsApp, dan untuk tugas paling sering, konfirmasi kamar,
ia bahkan tidak perlu login: cukup ketuk tautan di pesan Senin pagi."*

---

## 7. Hal lintas halaman

| Topik | File | Inti |
|---|---|---|
| Token desain | `app/globals.css` | Satu-satunya tempat hex dan ukuran font. Tailwind v4 `@theme` membuat kelas `bg-biru-500`, `text-price`, dst. |
| Primitif UI | `components/ui/*` | Button, Chip, Sheet (bottom sheet ↔ panel samping), Accordion, Lightbox, Toast, Badge, Skeleton, Icon |
| Navigasi & tombol back | `lib/navigasi.ts` | `useKembali()` memakai Navigation API untuk tahu apakah halaman sebelumnya milik kita; `useLapisRiwayat()` membuat sheet/lightbox/360° menutup dengan tombol back HP |
| Format | `lib/format.ts` | Rupiah, jarak, waktu relatif, skor; selalu `id-ID`, koma desimal |
| Label kata | `lib/skala.ts` | "4,5/5 · Sangat bersih", "selisih 15 dB · terdengar samar"; dipakai kartu, detail, filter, halaman cara menilai |
| SEO | `app/sitemap.ts`, `app/robots.ts`, `app/(user)/area/[slug]/page.tsx` | Halaman area SSG hanya untuk area ≥ 5 listing; JSON-LD; OG image per kos |
| Peluncuran | `app/api/sehat`, `app/api/galat`, `instrumentation.ts`, `scripts/cek-rilis.ts` | Health check, pelaporan error ke webhook, gerbang rilis |
| Gambar | `components/ui/FotoBlur.tsx`, `lib/blurhash.ts` | `next/image` (AVIF/WebP) dengan BlurHash digambar di canvas supaya tidak ada layout shift |

---

## 8. Alat dan alur kerja

```bash
npm run dev                 # Next dev (Turbopack) — butuh Supabase lokal: npx supabase start
npx supabase db reset       # migrasi + seed
npx supabase test db        # pgTAP
npm run typecheck && npm run lint && npm test && npm run build
npx supabase db push        # migrasi ke cloud
git push                    # Vercel build & deploy otomatis (cabang master)
```

Rahasia tidak pernah masuk repo: `.env.local` dan `.vercel/` di-ignore; service role key hanya di Vercel;
kunci Gemini di `~/.claude/skills/.env`.

---

## 9. Urutan menjelaskan dalam 5 menit

1. **Masalah dan aturan produk** (30 dtk): tiga hal yang tidak ditampilkan kompetitor; skor tidak bisa dibeli.
2. **Peta arsitektur** (gambar di bagian 0) (45 dtk): dua host, satu Postgres, RLS.
3. **Satu permintaan `/cari`** (90 dtk): URL → `bacaCariParams` → `cari_kos_v3()` (+ `kos_promosi()`) → kartu;
   filter mengubah URL saja. Buka `lib/cari-params.ts` dan `supabase/migrations/20261003000200_cari_v3_promosi.sql`.
4. **Skor** (45 dtk): buka `kos_skor` di `0300`, tunjuk bobot dan `null` untuk "Belum dinilai"; sebut `cek:skor-db`.
5. **Batas keamanan** (45 dtk): buka `0400_rls.sql`, tunjuk `punya_kos()` dan `lindungi_kolom_survei`.
6. **Sisi mitra** (30 dtk): OTP, Server Actions, cron Senin + tautan sekali pakai.
7. **Pengujian dan rilis** (15 dtk): pgTAP 109 asersi, 78 unit test, 18 skenario browser, gerbang `cek:rilis`, deploy otomatis.

---

## 10. Pertanyaan yang biasanya muncul

**Kenapa tidak pakai supabase-js di browser?** Ukuran. Penyewa tidak login, jadi cukup tiga fungsi REST (`lib/supabase/rest.ts`).

**Kenapa skor di SQL, bukan di TypeScript?** Supaya urutan pencarian, kartu, dan detail memakai angka yang sama, dan supaya
tidak ada jalur kode yang bisa "menyesuaikan" skor. TypeScript-nya cermin, dibuktikan sama oleh skrip.

**Kenapa state pencarian di URL?** Bisa dibagikan, tombol back berfungsi, dan server bisa merender halaman pertama.

**Bagaimana kalau data survei basi?** Kolom `ketersediaan_dikonfirmasi_pada`; `cari_kos_v3` menurunkan peringkat > 30 hari dan
menyembunyikan > 90 hari; cron Senin mengingatkan pemilik lewat WhatsApp.

**Apa yang terjadi kalau pemilik mencoba mengubah skornya?** Ditolak oleh trigger `lindungi_kolom_survei`, bukan oleh UI.

**Kenapa dua root layout?** Dua produk dengan tone berbeda (ceria vs. tenang), dan penyewa tidak boleh memuat kode pemilik.

**Bagaimana foto disajikan?** `kos_media.url` + BlurHash; `next/image` mengubah ke AVIF/WebP per ukuran layar. Sekarang
masih ilustrasi dummy; foto asli nanti ke Supabase Storage (bucket `foto-kos`) atau R2 untuk file 360°.
