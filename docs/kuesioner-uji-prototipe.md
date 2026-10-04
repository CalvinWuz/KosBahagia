# Kuesioner Uji Prototipe Kos Bahagia (Google Form)

Draf siap salin ke Google Form. Kolom **Tipe** menunjukkan jenis pertanyaan di Google Form, dan semua
pertanyaan **wajib diisi** kecuali yang ditandai *(opsional)*.

Pertanyaan wajib dari dosen ada di: **B3.3** (mudah digunakan), **C1** (membantu kebutuhan),
**D1–D3** (bagian yang membingungkan), **D6** (yang perlu diperbaiki).

---

## Pembuka (deskripsi form)

> **Halo! Bantu kami menguji Kos Bahagia, yuk** 👋
>
> Kos Bahagia adalah website untuk cari kos yang menampilkan total biaya per bulan, skor kebersihan dan
> kedap suara, serta catatan dari surveyor. Website ini masih **prototipe**: semua kos, foto, dan
> nomor di dalamnya adalah **data contoh**, jadi tenang saja, kamu tidak akan menghubungi pemilik kos sungguhan.
>
> Kamu akan mencoba 4 tugas singkat di website, lalu memberi penilaian. Waktunya sekitar **10 menit**.
> Tidak ada jawaban benar atau salah, yang kami nilai websitenya, bukan kamu.
>
> Jawabanmu anonim dan hanya dipakai untuk tugas kuliah (Prototype Testing Report).
>
> Link website: **https://kos-bahagia-umber.vercel.app**

**Persetujuan** — Pilihan ganda:
- Saya bersedia ikut dan jawaban saya boleh dipakai untuk penelitian ini
- Saya tidak bersedia *(atur: "Kirim formulir" / selesai)*

---

## Bagian 1 · Profil kamu

| No | Pertanyaan | Tipe | Pilihan |
|---|---|---|---|
| A1 | Berapa usia kamu? | Pilihan ganda | < 18 · 18–21 · 22–25 · 26–30 · > 30 |
| A2 | Apa kesibukan kamu sekarang? | Pilihan ganda | Mahasiswa · Pekerja/karyawan · Mahasiswa sambil kerja · Lainnya |
| A3 | Kamu tinggal atau kuliah/kerja di kota mana? | Jawaban singkat | |
| A4 | Pernah cari atau tinggal di kos? | Pilihan ganda | Sedang tinggal di kos · Pernah · Belum pernah, tapi berencana · Belum pernah dan tidak berencana |
| A5 | Biasanya cari kos lewat mana? *(boleh pilih lebih dari satu)* | Kotak centang | Mamikos · Instagram/TikTok · Grup WhatsApp/Facebook · Tanya teman/keluarga · Datang langsung ke lokasi · Lainnya |
| A6 | Berapa budget kos per bulan yang biasanya kamu siapkan? | Pilihan ganda | < Rp1 jt · Rp1–1,5 jt · Rp1,5–2 jt · Rp2–3 jt · > Rp3 jt |
| A7 | Pilih maksimal 3 hal yang paling penting buat kamu saat memilih kos | Kotak centang (validasi: maks. 3) | Harga/total biaya · Jarak ke kampus/kantor · Kebersihan · Kedap suara/ketenangan · Keamanan · Fasilitas (AC, kamar mandi dalam, WiFi) · Aturan (jam malam, tamu) · Pemilik yang responsif |
| A8 | Kamu mengisi kuesioner ini pakai perangkat apa? | Pilihan ganda | HP · Laptop/komputer · Tablet |

---

## Bagian 2 · Coba website-nya dulu, ya

Deskripsi bagian:

> Buka **https://kos-bahagia-umber.vercel.app** di tab baru, lalu coba 4 tugas di bawah ini.
> Santai saja. Kalau mentok, tidak apa-apa, lanjut ke tugas berikutnya. Setelah selesai, kembali ke form ini.
>
> **Tugas 1 · Cari kos**
> Cari kos di sekitar **BINUS Kampus Anggrek** dengan **total biaya maksimal Rp1,5 juta per bulan**.
>
> **Tugas 2 · Pahami satu kos**
> Buka salah satu kos dari hasil pencarian. Coba cari tahu: **berapa total yang harus dibayar per bulan**,
> **berapa uang yang perlu disiapkan untuk masuk**, dan **apakah kosnya berisik atau tidak**.
> Kalau ada lebih dari satu tipe kamar, coba ganti tipe kamarnya.
>
> **Tugas 3 · Bandingkan**
> Pilih **2 kos** yang menurutmu menarik, lalu **bandingkan** keduanya (ikon panah bolak-balik di kartu kos).
>
> **Tugas 4 · Hubungi pemilik**
> Di salah satu kos, tekan tombol **"Chat pemilik"**. (Karena ini prototipe, yang muncul adalah contoh pesan,
> bukan WhatsApp sungguhan.)

Pertanyaan setelah tugas (grid pilihan ganda, baris = tugas):

| No | Pertanyaan | Tipe | Kolom |
|---|---|---|---|
| B1 | Apakah kamu berhasil menyelesaikan tugas ini? | Kisi pilihan ganda (baris: Tugas 1–4) | Berhasil · Berhasil tapi agak susah · Tidak berhasil |
| B2 | Seberapa mudah tiap tugas? *(1 = sangat sulit, 5 = sangat mudah)* | Kisi pilihan ganda (baris: Tugas 1–4) | 1 · 2 · 3 · 4 · 5 |

---

## Bagian 3 · Penilaian kamu (skala 1–5)

Gunakan **Skala linier 1–5** dengan label **1 = Sangat tidak setuju**, **5 = Sangat setuju**.
Di Google Form, paling rapi dibuat sebagai **Kisi pilihan ganda** per blok, dengan "Wajibkan respons di setiap baris" aktif.

### 3A · Kemudahan pakai (System Usability Scale)

> Sepuluh pernyataan di bawah ini memakai urutan standar SUS. Jangan diubah urutan dan isinya, supaya skornya bisa dihitung dan dibandingkan.

| No | Pernyataan |
|---|---|
| B3.1 | Kalau sedang cari kos, saya rasa akan sering memakai website ini. |
| B3.2 | Website ini terasa terlalu rumit, padahal bisa dibuat lebih sederhana. |
| **B3.3** | **Website ini mudah digunakan.** *(pertanyaan wajib 1: pengalaman pengguna)* |
| B3.4 | Saya butuh bantuan orang lain supaya bisa memakai website ini. |
| B3.5 | Fitur-fitur di website ini terasa nyambung satu sama lain. |
| B3.6 | Ada banyak hal yang tidak konsisten di website ini. |
| B3.7 | Saya rasa kebanyakan orang bisa cepat paham cara memakai website ini. |
| B3.8 | Website ini terasa ribet saat dipakai. |
| B3.9 | Saya merasa percaya diri saat memakai website ini. |
| B3.10 | Saya perlu belajar banyak hal dulu sebelum bisa memakai website ini. |

### 3B · Manfaat dan kepercayaan

| No | Pernyataan |
|---|---|
| **C1** | **Website ini bisa membantu kebutuhan saya saat mencari kos.** *(pertanyaan wajib 3: kegunaan)* |
| C2 | Total biaya per bulan yang ditampilkan membantu saya memperkirakan pengeluaran. |
| C3 | Informasi "uang yang perlu disiapkan untuk masuk" (bayar di muka + deposit) berguna buat saya. |
| C4 | Skor kebersihan dan kedap suara membantu saya menilai kos tanpa harus datang dulu. |
| C5 | Catatan surveyor (hal bagus dan hal yang perlu diketahui) membuat saya lebih percaya. |
| C6 | Fitur bandingkan memudahkan saya memilih di antara beberapa kos. |
| C7 | Untuk cek perhatian, pilih angka **2** di baris ini. *(pertanyaan saringan, lihat bagian pengolahan)* |
| C8 | Tampilan website ini enak dilihat. |
| C9 | Website ini nyaman dipakai di perangkat yang saya gunakan sekarang. |

| No | Pertanyaan | Tipe |
|---|---|---|
| C10 | Seberapa mungkin kamu merekomendasikan Kos Bahagia ke teman yang sedang cari kos? | Skala linier 0–10 (0 = tidak mungkin, 10 = sangat mungkin) |

---

## Bagian 4 · Cerita dan saranmu

| No | Pertanyaan | Tipe | Catatan |
|---|---|---|---|
| **D1** | **Selama mencoba tadi, ada bagian yang bikin kamu bingung?** *(pertanyaan wajib 2: tindakan pengguna)* | Pilihan ganda: Ya · Tidak | Atur "Buka bagian berdasarkan jawaban": Ya → D2, Tidak → D4 |
| D2 | Bagian mana yang bikin bingung? *(boleh lebih dari satu)* | Kotak centang | Kolom pencarian · Filter · Urutan hasil · Kartu kos di hasil pencarian · Peta · Skor dan rinciannya · Rincian biaya / uang masuk · Pilih tipe kamar · Fitur bandingkan · Simpan kos · Tombol Chat pemilik · Lainnya |
| D3 | Ceritain dong, apa yang bikin bingung dan apa yang kamu harapkan terjadi? | Paragraf | Contoh petunjuk: "Saya klik ___, saya kira akan ___, ternyata ___." |
| D4 | Fitur atau informasi apa yang paling berguna buat kamu? | Jawaban singkat | |
| D5 | Ada informasi yang kamu cari tapi tidak ketemu di website ini? *(opsional)* | Paragraf | |
| **D6** | **Menurut kamu, apa yang paling perlu kami perbaiki dari Kos Bahagia?** *(pertanyaan wajib 4: saran)* | Paragraf | |
| D7 | Kalau ada, saran atau komentar lain? *(opsional)* | Paragraf | |
| D8 | Mau dihubungi untuk wawancara singkat 10 menit? Tulis email atau nomor WhatsApp. *(opsional)* | Jawaban singkat | Satu-satunya data kontak; kosongkan kalau tidak mau |

Penutup (pesan konfirmasi Google Form):

> Makasih banyak sudah meluangkan waktu! 🙌 Masukanmu langsung kami pakai untuk memperbaiki Kos Bahagia.

---

## Pengaturan Google Form

- **Setelan → Respons:** jangan kumpulkan email (supaya anonim), batasi 1 respons hanya kalau semua responden punya akun Google (kalau tidak, biarkan mati).
- **Bagian:** Pembuka + persetujuan → Bagian 1 → Bagian 2 → Bagian 3 → Bagian 4, dengan cabang di D1.
- **Wajib:** semua kecuali D5, D7, D8.
- **Validasi:** A7 "Pilih maksimal 3".
- **Pratinjau:** isi sendiri sekali di HP dan sekali di laptop sebelum disebar.

---

## Cara mengolah data

**1. Bersihkan data**
- Buang respons yang memilih "tidak bersedia".
- Buang respons yang menjawab C7 selain **2** (tidak membaca).
- Buang respons yang menjawab B3.1–B3.10 dengan angka yang sama semua (pola lurus), karena SUS berisi pernyataan positif dan negatif yang seharusnya tidak dijawab sama.
- Laporkan jumlah respons awal dan respons yang dipakai.

**2. Skor SUS (0–100) per responden**
- Item ganjil (B3.1, 3, 5, 7, 9): nilai − 1
- Item genap (B3.2, 4, 6, 8, 10): 5 − nilai
- Jumlahkan kesepuluhnya, lalu kali **2,5**

Rumus Google Sheets (jika B3.1–B3.10 ada di kolom D sampai M):
```
=((D2-1)+(5-E2)+(F2-1)+(5-G2)+(H2-1)+(5-I2)+(J2-1)+(5-K2)+(L2-1)+(5-M2))*2,5
```

Tafsiran umum: rata-rata SUS **68** dianggap batas "di atas rata-rata"; **≥ 80** tergolong sangat baik (kira-kira grade A); **< 51** perlu perbaikan besar.

**3. Kuantitatif lainnya**
- **Pertanyaan wajib 1:** rata-rata B3.3 dan persentase yang menjawab 4–5.
- **Pertanyaan wajib 3:** rata-rata C1 dan persentase yang menjawab 4–5.
- C2–C9: rata-rata per item, cocok dibuat diagram batang horizontal.
- B1: persentase berhasil per tugas. B2: rata-rata kemudahan per tugas.
- C10 (NPS): % promotor (9–10) dikurangi % detraktor (0–6).
- Bandingkan hasil antar kelompok bila perlu: mahasiswa vs pekerja, HP vs laptop.

**4. Kualitatif**
- **Pertanyaan wajib 2:** % yang menjawab "Ya" di D1, dan frekuensi bagian di D2 (diagram batang).
- D3, D5, D6: kelompokkan jawaban ke tema (misalnya "filter", "istilah biaya", "peta", "kecepatan"), hitung berapa responden menyebut tiap tema, dan ambil 2–3 kutipan mewakili per tema.
- Prioritaskan perbaikan dari tema yang paling sering muncul **dan** ada di tugas yang tingkat keberhasilannya rendah.

---

## Catatan untuk laporan

- Sebut bahwa pengujian dilakukan pada **prototipe dengan data contoh**, jadi penilaian kepercayaan (C5) mengukur kesan, bukan akurasi data sungguhan.
- Tulis tanggal pengujian dan versi website (commit `c6cf43b`, Oktober 2026), karena website bisa berubah selama periode pengisian.
