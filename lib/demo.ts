// Prototype mode. Prices, phone numbers, surveyors and measurements in this
// deployment are sample data, and photos are illustrations except for the
// kos whose real media lives in public/media/. The site says so wherever
// trust is at stake and never hands a renter to a made-up WhatsApp number.
//
// Set NEXT_PUBLIC_MODE_DEMO=0 only when the data is real.
export const MODE_DEMO = process.env.NEXT_PUBLIC_MODE_DEMO !== "0";

export const TEKS_DEMO = {
  label: "Data contoh",
  singkat: "Prototipe dengan data contoh",
  penjelasan:
    "Harga, nomor WhatsApp, nama surveyor, skor, dan hasil ukur di situs ini adalah data contoh untuk prototipe. Angka dan catatannya disusun agar saling konsisten, tetapi bukan hasil survei sungguhan. Hampir semua foto adalah ilustrasi; kos yang memakai foto dan video asli diberi keterangan di halamannya.",
  /** Detail page of a kos whose photos and video are real. */
  mediaAsli: (tanggal: string) =>
    `Foto, video, lokasi, dan rute kos ini asli, diambil ${tanggal}. Harga, skor, aturan, dan kontaknya masih data contoh.`,
} as const;
