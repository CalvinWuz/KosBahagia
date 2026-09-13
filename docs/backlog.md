# Backlog pasca-rilis

Hal yang sengaja tidak dikerjakan di tahap 09 (tidak boleh tambah fitur). Urut kira-kira menurut nilai.

- Akun penyewa (kalau pernah dibutuhkan) + gabung simpanan lokal ke akun — data `kb:simpan` di localStorage sudah menyimpan snapshot dan siap digabung.
- WhatsApp OTP: pasang provider (Twilio/Meta) di Supabase Auth lalu `NEXT_PUBLIC_WA_OTP=1`.
- Pengingat WA: isi `WA_CLOUD_TOKEN`/`WA_CLOUD_PHONE_ID` (Meta Cloud API) atau ganti pengirim di `lib/mitra/wa-kirim.ts`.
- UI admin untuk menautkan kos ke pemilik dan menutup `permintaan_koreksi` / `laporan_user` (sekarang lewat SQL).
- OG image dengan Plus Jakarta Sans (sekarang font bawaan next/og).
- Kecepatan WiFi di rubrik (`kos_penilaian.wifi_mbps`) + slider di filter.
- "Termurah" murni tanpa prioritas tier (keputusan produk; sekarang 2 spotlight tetap di atas).
- Foto 360 asli dari Insta360 + upload ke R2 lewat `npm run proses:360`.
- Deskripsi area untuk area baru ditulis tangan sebelum area itu punya 5 kos.
- Revalidasi lewat webhook: Supabase Database Webhook → `/api/revalidate` memanggil `revalidatePath('/kos/<slug>')` saat data survei berubah, supaya tidak menunggu ISR 1 jam (Next juga menyimpan cache fetch lintas build di `.next/cache`).
