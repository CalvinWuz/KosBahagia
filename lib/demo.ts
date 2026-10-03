// Prototype mode. Every kos, photo, phone number, surveyor and measurement in
// this deployment is sample data, so the site says so wherever trust is at
// stake and never hands a renter to a made-up WhatsApp number.
//
// Set NEXT_PUBLIC_MODE_DEMO=0 only when the data is real.
export const MODE_DEMO = process.env.NEXT_PUBLIC_MODE_DEMO !== "0";

export const TEKS_DEMO = {
  label: "Data contoh",
  singkat: "Prototipe dengan data contoh",
  penjelasan:
    "Semua kos, foto, nomor WhatsApp, nama surveyor, dan hasil ukur di situs ini adalah data contoh untuk prototipe. Angka dan catatannya disusun agar saling konsisten, tetapi bukan hasil survei sungguhan.",
} as const;
