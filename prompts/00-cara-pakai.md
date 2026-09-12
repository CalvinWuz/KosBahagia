# Cara pakai kumpulan prompt ini

**Tujuan:** menjelaskan urutan kerja dan cara membagi tugas ke 5 orang.

## Aturan dasar

1. `CLAUDE.md` ditaruh di root repo. Itu konteks permanen — jangan ditempel ulang tiap prompt.
2. Jalankan prompt **satu per satu, berurutan**. Jangan gabung dua tahap dalam satu sesi.
3. Setelah tiap prompt selesai: jalankan `npm run build`, buka di 360px dan 1440px, lalu commit.
   Kalau ada yang rusak, kamu tahu persis prompt mana penyebabnya.
4. Kalau agen mulai menulis fitur yang tidak diminta, hentikan dan ingatkan ke bagian
   "Non-goals" di `CLAUDE.md`.

## Urutan

| # | File | Perkiraan | Bisa paralel dengan |
|---|---|---|---|
| 01 | Fondasi & design system | 1–2 hari | — |
| 02 | Database & seed | 1–2 hari | 01 |
| 03 | Beranda | 2–3 hari | 04 |
| 04 | Hasil pencarian | 4–5 hari | 03 |
| 05 | Detail kos | 4–5 hari | — (butuh 02) |
| 06 | Minimap & tur 360 | 3 hari | 05 |
| 07 | Halaman area, simpan, banding | 3 hari | 06 |
| 08 | Sisi mitra | 5–7 hari | 03–07 |
| 09 | Polish, performa, siap rilis | 3–4 hari | — |

## Pembagian 5 orang

- **Orang A** — 01, 03, 09 (frontend + kesan visual)
- **Orang B** — 04, 07 (mesin pencarian, bagian paling berat)
- **Orang C** — 05, 06 (halaman detail, minimap, 360)
- **Orang D** — 02, 08 (data + sisi mitra)
- **Orang E** — survei lapangan, isi data, dekati pemilik kos, uji coba ke user

Orang E tidak menulis kode, dan itu bukan kekurangan. Tanpa dia, semua kode di atas isinya kosong.

## Yang harus dites manusia, bukan agen

- Buka `/cari` di HP beneran, pakai kuota, bukan wifi kantor.
- Minta 3 orang yang belum pernah lihat web ini mencari kos sampai klik WhatsApp. Catat di mana
  mereka berhenti. Jangan dibantu.
- Cek halaman detail satu kos yang datanya belum lengkap — pastikan tidak ada angka mengarang.
