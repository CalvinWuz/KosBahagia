// Generates supabase/seed/01_seed.sql — 40 kos in Kecamatan Palmerah
// (Jakarta Barat) and 10 in Kecamatan Lowokwaru (Malang).
//
//   node supabase/seed/generate.ts
//
// Deterministic (seeded PRNG) so the output is stable in git. Prices, rules,
// scores and notes vary on purpose; rubric fields that were "not measured"
// stay NULL and are never filled with a middle value.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------- utils
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260913);
const antara = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pilih = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const peluang = (p: number) => rand() < p;
const ambil = <T>(arr: readonly T[], n: number): T[] => {
  const salinan = [...arr];
  const hasil: T[] = [];
  while (hasil.length < n && salinan.length) hasil.push(salinan.splice(Math.floor(rand() * salinan.length), 1)[0]);
  return hasil;
};
const bulatkan = (n: number, ke: number) => Math.round(n / ke) * ke;

function uuid(): string {
  const hex = () => Math.floor(rand() * 16).toString(16);
  const s = Array.from({ length: 32 }, hex).join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-a${s.slice(17, 20)}-${s.slice(20)}`;
}
const q = (s: string | null | undefined) => (s == null ? "null" : `'${s.replace(/'/g, "''")}'`);
const n = (x: number | null | undefined) => (x == null ? "null" : String(x));
const b = (x: boolean | null | undefined) => (x == null ? "null" : x ? "true" : "false");
const arr = (xs: string[]) => (xs.length ? `array[${xs.map(q).join(", ")}]::text[]` : "'{}'::text[]");
const js = (x: unknown) => (x == null ? "null" : `${q(JSON.stringify(x))}::jsonb`);
const titik = (lat: number, lng: number) => `st_setsrid(st_makepoint(${lng.toFixed(6)}, ${lat.toFixed(6)}), 4326)::geography`;
const slugify = (s: string) =>
  s.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function jarakMeter(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

// ---------------------------------------------------------------- reference data
const AREA = [
  { slug: "palmerah", nama: "Palmerah", tipe: "kecamatan", lat: -6.1985, lng: 106.7905,
    deskripsi: "Kecamatan di Jakarta Barat yang menempel ke kampus BINUS Kemanggisan dan Stasiun Palmerah. Padat kos mahasiswa dan karyawan Slipi.",
    seo_judul: "Kos di Palmerah, Jakarta Barat — sudah kami cek langsung", seo_deskripsi: "Cari kos di Palmerah dengan biaya bulanan sebenarnya, skor kebersihan, dan catatan surveyor. Dekat BINUS dan Stasiun Palmerah." },
  { slug: "binus-kemanggisan", nama: "BINUS University Kampus Anggrek", tipe: "kampus", lat: -6.2019, lng: 106.7818,
    deskripsi: "Kampus utama BINUS di Kemanggisan. Radius 1 km penuh kos putra, putri dan campur.",
    seo_judul: "Kos dekat BINUS Kemanggisan — jalan kaki ke kampus", seo_deskripsi: "Kos dekat BINUS Anggrek dan Syahdan, lengkap dengan menit jalan kaki, biaya total, dan skor kedap suara." },
  { slug: "stasiun-palmerah", nama: "Stasiun Palmerah", tipe: "stasiun", lat: -6.2073, lng: 106.7975,
    deskripsi: "Stasiun KRL lintas Rangkasbitung, 1 stasiun ke Tanah Abang. Pilihan karyawan yang kerja di Sudirman.",
    seo_judul: "Kos dekat Stasiun Palmerah", seo_deskripsi: "Kos jalan kaki ke Stasiun Palmerah dengan biaya bulanan sebenarnya dan catatan surveyor." },
  { slug: "lowokwaru", nama: "Lowokwaru", tipe: "kecamatan", lat: -7.9440, lng: 112.6180,
    deskripsi: "Kecamatan kampus di Malang: UB, UM, UIN dan ITN. Kos paling banyak di Sumbersari dan Ketawanggede.",
    seo_judul: "Kos di Lowokwaru, Malang — sudah kami cek langsung", seo_deskripsi: "Kos di Lowokwaru dekat UB dengan biaya total, skor kebersihan, dan catatan surveyor." },
  { slug: "universitas-brawijaya", nama: "Universitas Brawijaya", tipe: "kampus", lat: -7.9526, lng: 112.6141,
    deskripsi: "Kampus UB Veteran. Kos di Kertoleksono, Sumbersari dan Watugong bisa jalan kaki.",
    seo_judul: "Kos dekat Universitas Brawijaya", seo_deskripsi: "Kos jalan kaki ke UB Veteran dengan biaya bulanan sebenarnya dan skor kedap suara." },
].map((a) => ({ ...a, id: uuid() }));
const areaId = (slug: string) => AREA.find((a) => a.slug === slug)!.id;

const FASILITAS = [
  ["ac", "AC", "kamar", "snowflake", true],
  ["kamar-mandi-dalam", "Kamar mandi dalam", "kamar", "shower", true],
  ["water-heater", "Water heater", "kamar", "flame", true],
  ["kasur", "Kasur", "kamar", "bed", true],
  ["lemari", "Lemari", "kamar", "cabinet", true],
  ["meja-belajar", "Meja belajar", "kamar", "desk", false],
  ["jendela-luar", "Jendela ke luar", "kamar", "window", true],
  ["tv", "TV", "kamar", "tv", false],
  ["kulkas-kamar", "Kulkas di kamar", "kamar", "fridge", false],
  ["wifi", "WiFi", "bersama", "wifi", true],
  ["dapur-bersama", "Dapur bersama", "bersama", "kitchen", true],
  ["kulkas-bersama", "Kulkas bersama", "bersama", "fridge", false],
  ["mesin-cuci", "Mesin cuci", "bersama", "washer", true],
  ["parkir-motor", "Parkir motor", "bersama", "motorbike", true],
  ["parkir-mobil", "Parkir mobil", "bersama", "car", true],
  ["cctv", "CCTV", "bersama", "camera", true],
  ["penjaga-24-jam", "Penjaga 24 jam", "bersama", "shield", true],
  ["ruang-tamu", "Ruang tamu", "bersama", "sofa", false],
  ["dispenser", "Dispenser", "bersama", "water", false],
  ["jemuran", "Jemuran", "bersama", "sun", false],
  ["lift", "Lift", "bersama", "elevator", false],
  ["mushola", "Mushola", "bersama", "mosque", false],
].map(([slug, nama, kategori, ikon, bisa_difilter]) => ({ id: uuid(), slug: slug as string, nama: nama as string, kategori: kategori as string, ikon: ikon as string, bisa_difilter: bisa_difilter as boolean }));
const fasId = (slug: string) => FASILITAS.find((f) => f.slug === slug)!.id;

const KELURAHAN: Record<string, { lat: number; lng: number; kota: "jakarta" | "malang" }> = {
  Kemanggisan: { lat: -6.1965, lng: 106.7865, kota: "jakarta" },
  Palmerah: { lat: -6.204, lng: 106.794, kota: "jakarta" },
  Slipi: { lat: -6.201, lng: 106.799, kota: "jakarta" },
  "Kota Bambu Utara": { lat: -6.1875, lng: 106.799, kota: "jakarta" },
  "Kota Bambu Selatan": { lat: -6.1935, lng: 106.7995, kota: "jakarta" },
  Jatipulo: { lat: -6.183, lng: 106.7955, kota: "jakarta" },
  Sumbersari: { lat: -7.956, lng: 112.612, kota: "malang" },
  Ketawanggede: { lat: -7.9535, lng: 112.609, kota: "malang" },
};

const SURVEYOR = ["Dina Anggraeni", "Rafi Pratama", "Sari Wulandari", "Yoga Prasetyo"];
const BLURHASH = ["LEHV6nWB2yk8pyo0adR*.7kCMdnj", "LGF5]+Yk^6#M@-5c,1J5@[or[Q6.", "L6PZfSi_.AyE_3t7t7R**0o#DgR4", "LKO2?U%2Tw=w]~RBVZRi};RPxuwH", "L5H2EC=PM+yV0g-mq.wG9c010J}I", "LhKUZWbHt7of.AoffQj[Wnfkjtoe"];

const HAL_BAIK = [
  "Kamar mandi dikuras setiap hari oleh petugas, tidak ada bau.",
  "Dinding bata plester, suara TV kamar sebelah nyaris tidak terdengar.",
  "Pemilik tinggal di lantai 1, balas WhatsApp dalam 10 menit saat kami tes.",
  "Air PAM lancar 24 jam, tekanan bagus sampai lantai atas.",
  "Ada CCTV di gerbang dan koridor tiap lantai.",
  "Gang cukup lebar, mobil bisa masuk sampai depan kos.",
  "Dapur bersama luas, kompor 2 tungku, kulkas 2 pintu.",
  "Kasur dan lemari masih baru, diganti awal 2026.",
  "Jemuran atap beratap, cucian tetap kering saat hujan.",
  "WiFi kami tes 42 Mbps di kamar paling ujung lantai 2.",
  "Ada dispenser dan galon gratis di tiap lantai.",
  "Penjaga 24 jam, gerbang digembok jam 23.00 tapi penghuni pegang kunci.",
  "Ventilasi silang di semua kamar, tidak pengap siang hari.",
  "Parkir motor beratap, muat sekitar 20 motor.",
  "Listrik token: penghuni isi sendiri, tidak ada tagihan kejutan.",
  "Lantai koridor keramik, tidak ada bau lembap.",
  "Halaman depan ada pohon mangga rindang, sore hari adem.",
  "Kunci kamar ganda, pemilik tidak pegang duplikat tanpa izin.",
  "Water heater gas di semua kamar mandi.",
  "Ruang tamu ber-AC, tamu nyaman menunggu.",
  "Mesin cuci 2 unit gratis, jarang antre.",
  "Lampu koridor sensor gerak, terang sampai pagi.",
  "Sampah diangkut tiap pagi, tidak ada tumpukan di depan.",
  "Kamar mandi dalam berkeramik penuh, tidak ada nat menghitam.",
];
const PERLU_DIKETAHUI = [
  "Kamar lantai 1 dekat dapur, agak berisik saat jam masak malam.",
  "Jam malam 23.00 dan gerbang digembok; telat harus telepon penjaga.",
  "Listrik token, estimasi kami Rp180.000 kalau pakai AC 8 jam sehari.",
  "Kamar mandi luar dipakai bersama 4 kamar.",
  "Air kadang keruh setelah hujan deras, pemilik bilang sedang pasang filter.",
  "Tidak ada dapur, penghuni biasanya beli makan di warung depan.",
  "Sinyal Telkomsel lemah di kamar belakang, XL aman.",
  "Tangga curam dan tidak ada lift, bawa barang berat repot.",
  "Sebelah kos ada bengkel motor, ramai jam 09.00–17.00.",
  "Deposit hanya kembali kalau kamar tidak rusak; foto kondisi saat serah terima.",
  "Mayoritas penghuni karyawan shift, koridor sepi siang hari.",
  "Motor parkir di gang depan, tidak beratap.",
  "Kamar ukuran 2,5×3 m, lemari built-in tapi tidak ada meja.",
  "WiFi bayar sendiri Rp75.000 per bulan ke pemilik.",
  "Harga sudah termasuk listrik, tapi remote AC dikunci maksimal 22°C.",
  "Tamu hanya boleh sampai ruang tamu, tidak boleh masuk kamar.",
  "Sumur bor, rasa air sedikit payau; untuk minum beli galon.",
  "Kamar belakang menghadap tembok, cahaya matahari kurang.",
  "Cucian dijemur di atap, tangga ke atap agak licin saat hujan.",
  "Jalan depan macet jam pulang kerja, motor tetap bisa lewat.",
  "Kamar mandi dalam hanya untuk tipe AC.",
  "Pembayaran hanya transfer, tidak terima tunai.",
  "Kontrak minimal 3 bulan, bayar di muka bulan pertama.",
  "Tetangga punya 3 anjing, menggonggong tiap ada motor lewat.",
];
const KESAN_PEMILIK = [
  "Ramah, tapi tegas soal jam malam dan tamu.",
  "Santai, tidak banyak aturan, tapi tidak suka tamu menginap.",
  "Dikelola anak pemilik, cepat tanggap soal kerusakan.",
  "Pemilik tinggal di luar kota, semua urusan lewat penjaga harian.",
  "Sangat rapi, punya buku catatan kerusakan tiap kamar.",
  "Agak sulit dihubungi siang hari, balas WhatsApp malam.",
  "Pensiunan yang senang mengobrol, hafal nama semua penghuni.",
  "Profesional, ada resepsionis dan aturan tertulis di lobi.",
  "Pemilik muda, terbuka dengan saran, sedang renovasi lantai atas.",
  "Ibu kos zaman dulu: perhatian, sesekali bawakan makanan.",
];
const RED_FLAG = [
  "Instalasi listrik terbuka di koridor lantai 2, kabel menjuntai dekat pipa air.",
  "Bekas banjir setinggi 30 cm di lantai 1 (Februari 2025), belum ada tanggul.",
  "Tangga darurat digembok saat survei; hanya satu jalan keluar.",
  "Gerbang tidak dikunci malam hari dan tidak ada penjaga.",
  "Kamar lantai 2 tidak punya jendela ke luar, ventilasi hanya ke koridor.",
  "Tabung gas dapur bersama diletakkan di koridor sempit tanpa ventilasi.",
];

// ---------------------------------------------------------------- kos profiles
type Listrik = "termasuk" | "token" | "flat" | "meteran";
type Profil = {
  nama: string; jalan: string; kel: keyof typeof KELURAHAN;
  tipe: "putra" | "putri" | "campur"; sewa: number; listrik: Listrik;
  tier?: "free" | "premium" | "spotlight"; status?: "draft" | "tayang" | "arsip";
  ac?: boolean; kmDalam?: boolean; dapur?: boolean; lift?: boolean;
  redFlags?: number[]; nilaiNull?: "kedap" | "kebersihan" | "semua" | "dapur";
  basiHari?: number; tanpaSekitar?: boolean; peneranganNull?: boolean;
};

const PROFIL: Profil[] = [
  { nama: "Kos Putri Melati", jalan: "Jl. Kemanggisan Ilir III", kel: "Kemanggisan", tipe: "putri", sewa: 1200000, listrik: "token", tier: "spotlight", ac: true, kmDalam: true, dapur: true },
  { nama: "Kost Bu Haji Rohmah", jalan: "Jl. Rawa Belong Gg. Haji Sennin", kel: "Kemanggisan", tipe: "campur", sewa: 900000, listrik: "termasuk", dapur: true, redFlags: [0] },
  { nama: "Wisma Anggrek Dua", jalan: "Jl. Anggrek Cakra", kel: "Kemanggisan", tipe: "putra", sewa: 1500000, listrik: "flat", tier: "premium", ac: true },
  { nama: "Kos Pak Darto", jalan: "Jl. Kemanggisan Raya Gg. Mawar", kel: "Kemanggisan", tipe: "putra", sewa: 750000, listrik: "meteran", dapur: true },
  { nama: "Griya Kemanggisan", jalan: "Jl. Keluarga", kel: "Kemanggisan", tipe: "campur", sewa: 1800000, listrik: "token", tier: "premium", ac: true, kmDalam: true },
  { nama: "Slipi Residence Kost", jalan: "Jl. Anggrek Neli Murni", kel: "Slipi", tipe: "campur", sewa: 2400000, listrik: "termasuk", tier: "spotlight", ac: true, kmDalam: true, lift: true },
  { nama: "Kos Bunda Ratna", jalan: "Jl. Palmerah Barat Gg. II", kel: "Palmerah", tipe: "putri", sewa: 1000000, listrik: "token", dapur: true, peneranganNull: true },
  { nama: "Rumah Kos Cendana", jalan: "Jl. Kota Bambu Selatan", kel: "Kota Bambu Selatan", tipe: "campur", sewa: 850000, listrik: "flat", redFlags: [1, 2] },
  { nama: "Pondok Sakinah Palmerah", jalan: "Jl. Palmerah Utara II", kel: "Palmerah", tipe: "putri", sewa: 950000, listrik: "termasuk", redFlags: [3], basiHari: 41 },
  { nama: "Kost Palmerah 88", jalan: "Jl. Palmerah Barat", kel: "Palmerah", tipe: "putra", sewa: 1300000, listrik: "token", tier: "premium", ac: true },
  { nama: "D'Kost Syahdan", jalan: "Jl. KH Syahdan", kel: "Kemanggisan", tipe: "campur", sewa: 2100000, listrik: "termasuk", tier: "premium", ac: true, kmDalam: true },
  { nama: "Kos Putra Bahagia", jalan: "Jl. Kemanggisan Ilir", kel: "Kemanggisan", tipe: "putra", sewa: 800000, listrik: "meteran", nilaiNull: "kedap" },
  { nama: "Kos Ibu Yanti", jalan: "Jl. Batusari", kel: "Palmerah", tipe: "putri", sewa: 1100000, listrik: "token", dapur: true },
  { nama: "Rawa Belong Kost Exclusive", jalan: "Jl. Rawa Belong", kel: "Kemanggisan", tipe: "campur", sewa: 1700000, listrik: "flat", ac: true, kmDalam: true },
  { nama: "Kos Mbak Tuti", jalan: "Jl. Kemanggisan Ilir II", kel: "Kemanggisan", tipe: "putri", sewa: 700000, listrik: "termasuk", nilaiNull: "kebersihan" },
  { nama: "Wisma Keluarga", jalan: "Jl. Keluarga Gg. Buntu", kel: "Kemanggisan", tipe: "putra", sewa: 1250000, listrik: "token", ac: true },
  { nama: "Kost Anggrek Cakra", jalan: "Jl. Anggrek Cakra II", kel: "Kemanggisan", tipe: "putri", sewa: 1450000, listrik: "flat", tier: "premium", ac: true, kmDalam: true },
  { nama: "Kos Pak Haji Umar", jalan: "Jl. Sandang", kel: "Palmerah", tipe: "campur", sewa: 900000, listrik: "meteran", basiHari: 66 },
  { nama: "Griya Asri Kemanggisan", jalan: "Jl. Kemanggisan Raya", kel: "Kemanggisan", tipe: "putri", sewa: 1600000, listrik: "token", ac: true, kmDalam: true, dapur: true },
  { nama: "Kost Neli Murni", jalan: "Jl. Anggrek Neli Murni II", kel: "Slipi", tipe: "campur", sewa: 1350000, listrik: "termasuk", ac: true },
  { nama: "Kos Ibu Lastri", jalan: "Jl. Jatipulo I", kel: "Jatipulo", tipe: "putri", sewa: 780000, listrik: "flat", tanpaSekitar: true },
  { nama: "Kost Kota Bambu", jalan: "Jl. Kota Bambu Utara", kel: "Kota Bambu Utara", tipe: "putra", sewa: 950000, listrik: "token", dapur: true },
  { nama: "Pondok Mahasiswa Palmerah", jalan: "Jl. Palmerah Selatan", kel: "Palmerah", tipe: "putra", sewa: 1050000, listrik: "termasuk", basiHari: 120 },
  { nama: "Kos Om Deddy", jalan: "Jl. Slipi Gg. Kelapa", kel: "Slipi", tipe: "campur", sewa: 1150000, listrik: "meteran" },
  { nama: "Kost Batusari Hijau", jalan: "Jl. Batusari Raya", kel: "Palmerah", tipe: "putri", sewa: 1400000, listrik: "token", tier: "premium", ac: true, kmDalam: true },
  { nama: "Rumah Kos Bu Endang", jalan: "Jl. Kemanggisan Ilir IV", kel: "Kemanggisan", tipe: "putri", sewa: 850000, listrik: "termasuk", nilaiNull: "semua" },
  { nama: "Kos Jatipulo Indah", jalan: "Jl. Jatipulo Raya", kel: "Jatipulo", tipe: "campur", sewa: 1000000, listrik: "flat" },
  { nama: "The Suites Kemanggisan", jalan: "Jl. KH Syahdan No. 40", kel: "Kemanggisan", tipe: "campur", sewa: 2500000, listrik: "termasuk", tier: "spotlight", ac: true, kmDalam: true, lift: true },
  { nama: "Kos Bapak Suharto", jalan: "Jl. Kota Bambu Selatan Gg. 5", kel: "Kota Bambu Selatan", tipe: "putra", sewa: 720000, listrik: "meteran" },
  { nama: "Kost Sandang Mulia", jalan: "Jl. Sandang II", kel: "Palmerah", tipe: "campur", sewa: 1250000, listrik: "token", ac: true },
  { nama: "Kos Ibu Marni", jalan: "Jl. Rawa Belong Gg. Damai", kel: "Kemanggisan", tipe: "putri", sewa: 900000, listrik: "termasuk", dapur: true, redFlags: [5] },
  { nama: "Kost Putri Aisyah", jalan: "Jl. Kemanggisan Raya Gg. Masjid", kel: "Kemanggisan", tipe: "putri", sewa: 1300000, listrik: "token", tier: "premium", ac: true, kmDalam: true },
  { nama: "Wisma Budi Raya", jalan: "Jl. Budi Raya", kel: "Kemanggisan", tipe: "putra", sewa: 1100000, listrik: "flat", ac: true },
  { nama: "Kos Pak Ridwan", jalan: "Jl. Palmerah Utara Gg. Kenanga", kel: "Palmerah", tipe: "campur", sewa: 950000, listrik: "meteran", dapur: true },
  { nama: "Kost Kemanggisan Ilir 21", jalan: "Jl. Kemanggisan Ilir", kel: "Kemanggisan", tipe: "putra", sewa: 1200000, listrik: "token", ac: true },
  { nama: "Kos Ibu Sri", jalan: "Jl. Jatipulo II", kel: "Jatipulo", tipe: "putri", sewa: 800000, listrik: "termasuk" },
  { nama: "Kost Palmerah Utara", jalan: "Jl. Palmerah Utara", kel: "Palmerah", tipe: "campur", sewa: 1650000, listrik: "token", tier: "premium", ac: true, kmDalam: true },
  { nama: "Kos Mas Gilang", jalan: "Jl. Slipi Kemanggisan", kel: "Slipi", tipe: "putra", sewa: 1000000, listrik: "token", status: "draft", ac: true },
  { nama: "Green Kost Anggrek", jalan: "Jl. Anggrek Garuda", kel: "Kemanggisan", tipe: "campur", sewa: 1900000, listrik: "termasuk", status: "draft", ac: true, kmDalam: true },
  { nama: "Kos Bu Dewi", jalan: "Jl. Kota Bambu Utara Gg. 3", kel: "Kota Bambu Utara", tipe: "putri", sewa: 850000, listrik: "flat", status: "arsip" },
  // Malang
  { nama: "Kos Putri Sumbersari", jalan: "Jl. Sumbersari Gg. IV", kel: "Sumbersari", tipe: "putri", sewa: 850000, listrik: "token", tier: "spotlight", ac: true, kmDalam: true, dapur: true },
  { nama: "Kost Kertoleksono 12", jalan: "Jl. Kertoleksono", kel: "Ketawanggede", tipe: "campur", sewa: 1100000, listrik: "termasuk", tier: "premium", ac: true, kmDalam: true },
  { nama: "Kos Mas Bram", jalan: "Jl. Kerto Raharjo", kel: "Ketawanggede", tipe: "putra", sewa: 650000, listrik: "meteran", redFlags: [4] },
  { nama: "Griya Watugong", jalan: "Jl. Watugong", kel: "Ketawanggede", tipe: "putri", sewa: 950000, listrik: "flat", ac: true },
  { nama: "Kost Bu Ning", jalan: "Jl. Bendungan Sigura-gura", kel: "Sumbersari", tipe: "campur", sewa: 750000, listrik: "termasuk", dapur: true, peneranganNull: true },
  { nama: "Pondok Kerto Raharjo", jalan: "Jl. Kerto Raharjo Gg. II", kel: "Ketawanggede", tipe: "putra", sewa: 700000, listrik: "token" },
  { nama: "Kos Pak Hadi Sigura-gura", jalan: "Jl. Bendungan Sutami", kel: "Sumbersari", tipe: "putra", sewa: 800000, listrik: "meteran", dapur: true },
  { nama: "Kost Cikampek Asri", jalan: "Jl. Terusan Cikampek", kel: "Sumbersari", tipe: "putri", sewa: 1250000, listrik: "termasuk", tier: "premium", ac: true, kmDalam: true },
  { nama: "Kos Putra Veteran Dalam", jalan: "Jl. Veteran Dalam", kel: "Ketawanggede", tipe: "putra", sewa: 900000, listrik: "token", ac: true },
  { nama: "Kost Bu Endah Kertosentono", jalan: "Jl. Kertosentono", kel: "Ketawanggede", tipe: "campur", sewa: 1000000, listrik: "flat", ac: true, dapur: true },
];

// ---------------------------------------------------------------- build rows
const out: string[] = [];
const emit = (s: string) => out.push(s);

emit(`-- GENERATED by supabase/seed/generate.ts — do not edit by hand.
-- 40 kos in Kecamatan Palmerah (Jakarta Barat) + 10 in Lowokwaru (Malang).
-- Relative dates use now() so "stale" listings stay stale on every reset.

begin;
`);

emit(`insert into area (id, slug, nama, tipe, lokasi, deskripsi, seo_judul, seo_deskripsi) values`);
emit(AREA.map((a) => `  (${q(a.id)}, ${q(a.slug)}, ${q(a.nama)}, ${q(a.tipe)}, ${titik(a.lat, a.lng)}, ${q(a.deskripsi)}, ${q(a.seo_judul)}, ${q(a.seo_deskripsi)})`).join(",\n") + ";\n");

emit(`insert into fasilitas (id, slug, nama, kategori, ikon, bisa_difilter) values`);
emit(FASILITAS.map((f) => `  (${q(f.id)}, ${q(f.slug)}, ${q(f.nama)}, ${q(f.kategori)}, ${q(f.ikon)}, ${b(f.bisa_difilter)})`).join(",\n") + ";\n");

const kosRows: string[] = [];
const kamarRows: string[] = [];
const penilaianRows: string[] = [];
const kosFasRows: string[] = [];
const aturanRows: string[] = [];
const sekitarRows: string[] = [];
const mediaRows: string[] = [];
const catatanRows: string[] = [];
const logRows: string[] = [];

const slugTerpakai = new Set<string>();

for (const p of PROFIL) {
  const id = uuid();
  const kel = KELURAHAN[p.kel];
  const jakarta = kel.kota === "jakarta";
  let slug = slugify(p.nama);
  if (slugTerpakai.has(slug)) slug += `-${p.kel.split(" ")[0].toLowerCase()}`;
  slugTerpakai.add(slug);

  // Position: within ~600 m of the kelurahan centre.
  const lat = kel.lat + (rand() - 0.5) * 0.011;
  const lng = kel.lng + (rand() - 0.5) * 0.011;

  const status = p.status ?? "tayang";
  const tier = p.tier ?? "free";
  const surveyor = pilih(SURVEYOR);
  const basi = p.basiHari ?? antara(0, 21);
  // The survey always precedes the latest availability confirmation.
  const disurveiHari = basi + antara(0, 60);
  const jumlahLantai = p.lift ? antara(4, 6) : antara(1, 3);
  const totalKamar = antara(6, 14) + (p.lift ? 12 : 0);
  const kontak = p.nama.replace(/^(Kos|Kost|Wisma|Griya|Rumah Kos|Pondok)\s+/, "").split(" ").slice(0, 3).join(" ");
  const whatsapp = `628${antara(11, 99)}${String(antara(1000000, 9999999))}`;

  kosRows.push(`  (${q(id)}, ${q(slug)}, ${q(p.nama)}, ${q(`${p.jalan}, ${p.kel}, ${jakarta ? "Palmerah, Jakarta Barat" : "Lowokwaru, Malang"}`)}, ${q(`RT ${String(antara(1, 12)).padStart(2, "0")}/RW ${String(antara(1, 9)).padStart(2, "0")}`)}, ${titik(lat, lng)}, ${q(areaId(jakarta ? "palmerah" : "lowokwaru"))}, ${q(p.tipe)}, ${totalKamar}, ${jumlahLantai}, ${b(!!p.lift)}, ${antara(1995, 2023)}, ${q(kontak.startsWith("Bu") || kontak.startsWith("Pak") || kontak.startsWith("Ibu") || kontak.startsWith("Mas") || kontak.startsWith("Om") || kontak.startsWith("Bapak") || kontak.startsWith("Mbak") ? kontak : pilih(["Bu Rina", "Pak Agus", "Mbak Fitri", "Pak Herman", "Bu Lina", "Mas Andi"]))}, ${q(whatsapp)}, ${q(p.lift ? "harian" : pilih(["pemilik", "harian", "tidak_tetap", "tidak_ada"]))}, ${q(status)}, ${q(tier)}, null, (now() - interval '${disurveiHari} days')::date, ${q(surveyor)}, now() - interval '${basi} days')`);

  // ---- room types
  const kamar: Array<{ id: string; nama: string; harga: number; ac: boolean; kmDalam: boolean; tersedia: number; total: number }> = [];
  const kamarStandar = p.ac && p.kmDalam && p.sewa >= 2000000 ? null : { nama: p.ac ? "Standar (kipas)" : "Standar", harga: p.sewa, ac: false, kmDalam: !!p.kmDalam && !p.ac };
  if (kamarStandar) kamar.push({ id: uuid(), ...kamarStandar, tersedia: 0, total: 0 });
  if (p.ac) kamar.push({ id: uuid(), nama: p.kmDalam ? "AC + kamar mandi dalam" : "AC", harga: p.sewa + (kamarStandar ? bulatkan(antara(250000, 450000), 50000) : 0), ac: true, kmDalam: !!p.kmDalam, tersedia: 0, total: 0 });
  if (!p.ac && p.kmDalam) kamar.push({ id: uuid(), nama: "Kamar mandi dalam", harga: p.sewa + 200000, ac: false, kmDalam: true, tersedia: 0, total: 0 });
  if (kamar.length === 1 && peluang(0.35)) kamar.push({ id: uuid(), nama: "Kamar besar (3×4 m)", harga: p.sewa + bulatkan(antara(150000, 300000), 50000), ac: kamar[0].ac, kmDalam: kamar[0].kmDalam, tersedia: 0, total: 0 });

  let sisa = totalKamar;
  kamar.forEach((k, i) => {
    k.total = i === kamar.length - 1 ? sisa : Math.max(2, Math.floor(sisa / (kamar.length - i)));
    sisa -= k.total;
    k.tersedia = peluang(0.15) ? 0 : Math.min(k.total, antara(0, 4));
  });

  const biayaAir = p.listrik === "termasuk" ? null : peluang(0.5) ? null : bulatkan(antara(25000, 75000), 5000);
  const estimasiListrik = p.listrik === "termasuk" ? null : p.listrik === "flat" ? bulatkan(antara(100000, 200000), 25000) : bulatkan(antara(120000, 220000), 10000);
  const wifiBayar = peluang(0.3);
  const biayaLain: Array<{ nama: string; jumlah: number; wajib?: boolean }> = [];
  if (peluang(0.6)) biayaLain.push({ nama: "Sampah", jumlah: bulatkan(antara(10000, 25000), 5000) });
  if (peluang(0.35)) biayaLain.push({ nama: "Iuran keamanan", jumlah: bulatkan(antara(15000, 30000), 5000) });
  if (wifiBayar) biayaLain.push({ nama: "WiFi", jumlah: bulatkan(antara(50000, 100000), 25000) });
  if (peluang(0.2)) biayaLain.push({ nama: "Galon (opsional)", jumlah: 40000, wajib: false });
  const laundry = pilih(["tidak_ada", "tidak_ada", "berbayar", "berbayar", "termasuk"] as const);
  const parkirMotor = peluang(0.8);
  const parkirMobil = !!p.lift || peluang(0.15);
  const deposit = pilih([0, 500000, p.sewa]);

  for (const k of kamar) {
    const estimasi = k.ac && estimasiListrik != null && p.listrik !== "flat" ? estimasiListrik + 80000 : estimasiListrik;
    kamarRows.push(`  (${q(k.id)}, ${q(id)}, ${q(k.nama)}, ${q(pilih(["3×3 m", "3×4 m", "2,5×3 m", "3×3,5 m", "4×4 m"]))}, ${k.harga}, ${peluang(0.5) ? k.harga * 11 : "null"}, ${pilih([1, 1, 3, 6])}, ${deposit}, ${deposit ? q(pilih(["ya", "sebagian", "tidak"])) : "null"}, ${q(p.listrik)}, ${n(estimasi)}, ${b(k.ac)}, ${k.ac && p.listrik === "termasuk" ? bulatkan(antara(100000, 250000), 50000) : k.ac && p.listrik === "flat" ? bulatkan(antara(50000, 150000), 50000) : "null"}, ${n(biayaAir)}, ${q(laundry)}, ${laundry === "berbayar" ? bulatkan(antara(6000, 10000), 1000) : "null"}, ${b(parkirMotor)}, ${parkirMotor && peluang(0.3) ? 50000 : "null"}, ${b(parkirMobil)}, ${parkirMobil ? bulatkan(antara(150000, 300000), 50000) : "null"}, ${js(biayaLain)}, ${k.tersedia}, ${k.total})`);
    logRows.push(`  (${q(id)}, ${q(k.id)}, ${k.tersedia}, 'survei', now() - interval '${disurveiHari} days')`);
    if (disurveiHari > basi) logRows.push(`  (${q(id)}, ${q(k.id)}, ${k.tersedia}, ${q(pilih(["pemilik", "bot_wa"]))}, now() - interval '${basi} days')`);
  }

  // ---- rubric scores (nullable, never defaulted)
  if (p.nilaiNull !== "semua") {
    const tembok = pilih(["bata", "bata", "bata", "hebel", "hebel", "gypsum", "triplek"]);
    const kedapDasar = tembok === "bata" ? antara(3, 5) : tembok === "hebel" ? antara(3, 4) : antara(1, 2);
    const adaDapur = !!p.dapur;
    const kamarMandi = antara(2, 5);
    const koridor = antara(2, 5);
    const skorKamarMandi = p.nilaiNull === "kebersihan" ? kamarMandi : kamarMandi;
    const skorDapur = p.nilaiNull === "kebersihan" || !adaDapur ? null : antara(2, 5);
    const skorKoridor = p.nilaiNull === "kebersihan" ? null : koridor;
    const skorKedap = p.nilaiNull === "kedap" ? null : kedapDasar;
    const hadapJalan = peluang(0.3);
    const dbAmbient = hadapJalan ? antara(48, 58) : antara(36, 47);
    const bising: string[] = [];
    if (hadapJalan) bising.push("jalan raya");
    if (peluang(0.25)) bising.push("bengkel");
    if (peluang(0.2)) bising.push("masjid");
    if (peluang(0.15)) bising.push("sekolah");
    if (peluang(0.1)) bising.push("kereta");
    penilaianRows.push(`  (${q(id)}, ${n(skorKamarMandi)}, ${n(skorDapur)}, ${n(skorKoridor)}, ${q(pilih(["petugas", "petugas", "pemilik", "penghuni"]))}, ${q(pilih(["harian", "harian", "2x seminggu", "mingguan"]))}, ${q(pilih(["harian", "harian", "2 hari sekali", "mingguan"]))}, ${q(tembok)}, ${dbAmbient}, ${skorKedap == null ? "null" : String(dbAmbient + (6 - kedapDasar) * 6 + antara(0, 4))}, ${n(skorKedap)}, ${b(hadapJalan)}, ${arr(bising)})`);
  }

  // ---- facilities
  const fas = new Set<string>(["kasur", "lemari"]);
  if (p.ac) fas.add("ac");
  if (p.kmDalam) fas.add("kamar-mandi-dalam");
  if (p.dapur) { fas.add("dapur-bersama"); if (peluang(0.7)) fas.add("kulkas-bersama"); }
  if (p.lift) { fas.add("lift"); fas.add("cctv"); fas.add("penjaga-24-jam"); fas.add("water-heater"); fas.add("ruang-tamu"); }
  if (peluang(0.85)) fas.add("wifi");
  if (parkirMotor) fas.add("parkir-motor");
  if (parkirMobil) fas.add("parkir-mobil");
  if (peluang(0.5)) fas.add("cctv");
  if (peluang(0.3)) fas.add("penjaga-24-jam");
  if (peluang(0.6)) fas.add("jendela-luar");
  if (peluang(0.4)) fas.add("meja-belajar");
  if (peluang(0.35)) fas.add("mesin-cuci");
  if (peluang(0.3)) fas.add("dispenser");
  if (peluang(0.5)) fas.add("jemuran");
  if (peluang(0.2)) fas.add("mushola");
  if (peluang(0.2)) fas.add("water-heater");
  if (p.sewa >= 1500000 && peluang(0.5)) fas.add("tv");
  if (p.redFlags?.includes(4)) fas.delete("jendela-luar");
  for (const s of fas) kosFasRows.push(`  (${q(id)}, ${q(fasId(s))})`);

  // ---- rules
  const jamMalam = p.lift ? null : pilih([null, null, "22:00", "23:00", "23:00", "00:00"]);
  const pasangan = p.tipe === "campur" ? pilih(["boleh", "surat_nikah", "surat_nikah", "tidak"]) : "tidak";
  aturanRows.push(`  (${q(id)}, ${q(jamMalam)}, ${q(pilih(["boleh", "ruang_tamu", "ruang_tamu", "tidak"]))}, ${q(p.tipe === "campur" ? pilih(["ruang_tamu", "boleh"]) : pilih(["ruang_tamu", "tidak", "tidak"]))}, ${q(pasangan)}, ${b(pasangan === "boleh" && peluang(0.5))}, ${b(peluang(0.1))}, ${b(peluang(0.35))}, ${q(pilih(["luar", "luar", "dilarang", "kamar"]))}, ${q(jakarta ? pilih(["mahasiswa", "mahasiswa", "karyawan", "campur"]) : pilih(["mahasiswa", "mahasiswa", "campur"]))}, ${q(pilih(["tenang", "tenang", "biasa", "ramai"]))})`);

  // ---- surroundings
  if (!p.tanpaSekitar) {
    const landmark = jakarta
      ? (() => { const kampus = AREA[1]; const stasiun = AREA[2]; const dK = jarakMeter(lat, lng, kampus.lat, kampus.lng); const dS = jarakMeter(lat, lng, stasiun.lat, stasiun.lng); return dK <= dS ? { nama: kampus.nama, jarak: dK } : { nama: stasiun.nama, jarak: dS }; })()
      : { nama: "Universitas Brawijaya (Gerbang Veteran)", jarak: jarakMeter(lat, lng, AREA[4].lat, AREA[4].lng) };
    const menit = Math.max(1, Math.round(landmark.jarak / 75));
    const rute = [
      `Keluar gang ke ${p.jalan.replace(/ Gg\..*$/, "")}`,
      `Belok ${pilih(["kiri", "kanan"])}, lurus ${bulatkan(Math.round(landmark.jarak * 0.6), 50)} m`,
      pilih(["Seberangi jalan di zebra cross depan minimarket", "Lewat jembatan penyeberangan", "Ikuti trotoar sampai lampu merah", "Masuk gang kecil di samping warung"]),
      `${landmark.nama.split(" (")[0]} ada di ${pilih(["kanan", "kiri"])} jalan`,
    ];
    const minimarket = peluang(0.85) ? { nama: jakarta ? pilih(["Indomaret Kemanggisan Raya", "Alfamart Rawa Belong", "Indomaret Palmerah Barat", "Alfamidi Anggrek Cakra", "Indomaret KH Syahdan"]) : pilih(["Indomaret Kertoleksono", "Alfamart Sumbersari", "Indomaret Watugong", "Alfamart Veteran"]), jarak_m: bulatkan(antara(40, 400), 10) } : null;
    const warung = peluang(0.9) ? { nama: pilih(["Warteg Bahari", "Warung Bu Yem", "Nasi Padang Sederhana", "Warung Pecel Lele Pak Kumis", "Warmindo 24 Jam", "Warung Nasi Bu Sum"]), jarak_m: bulatkan(antara(20, 250), 10) } : null;
    const laundryDekat = peluang(0.75) ? { nama: pilih(["Laundry Kiloan Bersih", "Cuci Kilat Express", "Laundry Mama", "Superwash"]), jarak_m: bulatkan(antara(50, 350), 10), harga_per_kg: bulatkan(antara(6000, 9000), 500) } : null;
    const transit = jakarta
      ? (peluang(0.8) ? pilih([{ jenis: "KRL", nama: "Stasiun Palmerah", jarak_m: jarakMeter(lat, lng, AREA[2].lat, AREA[2].lng) }, { jenis: "TransJakarta", nama: "Halte Slipi Kemanggisan", jarak_m: bulatkan(antara(300, 1200), 50) }, { jenis: "Angkot", nama: "M11 Tanah Abang–Meruya", jarak_m: bulatkan(antara(50, 300), 10) }]) : null)
      : (peluang(0.6) ? { jenis: "Angkot", nama: pilih(["ADL", "AL", "GML"]), jarak_m: bulatkan(antara(50, 400), 10) } : null);
    sekitarRows.push(`  (${q(id)}, ${q(landmark.nama)}, ${landmark.jarak}, ${menit}, ${js(rute)}, ${js(minimarket)}, ${js(warung)}, ${js(laundryDekat)}, ${js(transit)}, ${q(p.lift ? "mobil" : pilih(["motor", "motor", "mobil", "jalan_kaki"]))}, ${p.peneranganNull ? "null" : String(antara(2, 5))}, ${b(p.redFlags?.includes(1) ? true : peluang(0.15))})`);
  }

  // ---- media (placeholders with real dimensions)
  const keterangan = ["Tampak depan", "Kamar tipe " + kamar[0].nama, "Kamar mandi", "Koridor", "Dapur bersama", "Area parkir", "Ruang tamu", "Jemuran"];
  const jumlahFoto = tier === "free" ? antara(4, 6) : antara(6, 8);
  for (let i = 0; i < jumlahFoto; i++) {
    mediaRows.push(`  (${q(id)}, 'foto', ${q(`https://picsum.photos/seed/${slug}-${i + 1}/1600/1200`)}, ${q(keterangan[i] ?? `Foto ${i + 1}`)}, ${i}, 1600, 1200, ${q(pilih(BLURHASH))})`);
  }
  if (tier !== "free") {
    mediaRows.push(`  (${q(id)}, 'foto360', ${q(`https://picsum.photos/seed/${slug}-360/4096/2048`)}, 'Tur 360° kamar dan koridor', ${jumlahFoto}, 4096, 2048, ${q(pilih(BLURHASH))})`);
    mediaRows.push(`  (${q(id)}, 'patokan', ${q(`https://picsum.photos/seed/${slug}-patokan-1/1600/1200`)}, ${q(`Gang masuk dari ${p.jalan.replace(/ Gg\..*$/, "")}`)}, ${jumlahFoto + 1}, 1600, 1200, ${q(pilih(BLURHASH))})`);
    mediaRows.push(`  (${q(id)}, 'patokan', ${q(`https://picsum.photos/seed/${slug}-patokan-2/1600/1200`)}, 'Patokan: minimarket di ujung gang', ${jumlahFoto + 2}, 1600, 1200, ${q(pilih(BLURHASH))})`);
  }

  // ---- surveyor notes
  const halBaik = ambil(HAL_BAIK.filter((h) => (p.dapur || !h.includes("Dapur")) && (p.lift || !h.includes("Ruang tamu"))), 3);
  const perlu = ambil(PERLU_DIKETAHUI.filter((h) => (p.listrik === "token" || !h.includes("token")) && (p.listrik === "termasuk" || !h.includes("termasuk listrik")) && (!p.dapur || !h.includes("Tidak ada dapur")) && (!p.lift || !h.includes("tidak ada lift"))), 3);
  catatanRows.push(`  (${q(id)}, ${arr(halBaik)}, ${arr(perlu)}, ${q(pilih(KESAN_PEMILIK))}, ${arr((p.redFlags ?? []).map((i) => RED_FLAG[i]))})`);
}

emit(`insert into kos (id, slug, nama, alamat, rt_rw, lokasi, area_id, tipe, jumlah_kamar, jumlah_lantai, ada_lift, tahun_bangunan, kontak_nama, whatsapp, penjaga, status, tier, owner_id, disurvei_pada, surveyor, ketersediaan_dikonfirmasi_pada) values\n${kosRows.join(",\n")};\n`);
emit(`insert into tipe_kamar (id, kos_id, nama, ukuran, harga_bulanan, harga_tahunan, durasi_minimal, deposit, deposit_kembali, model_listrik, estimasi_listrik, boleh_ac, biaya_ac, biaya_air, laundry, biaya_laundry, parkir_motor, biaya_parkir_motor, parkir_mobil, biaya_parkir_mobil, biaya_lain, kamar_tersedia, total_kamar) values\n${kamarRows.join(",\n")};\n`);
emit(`insert into kos_penilaian (kos_id, skor_kamar_mandi, skor_dapur, skor_koridor, pembersih, frekuensi_bersih, frekuensi_sampah, material_tembok, db_ambient, db_tes, skor_kedap, hadap_jalan_raya, sumber_bising) values\n${penilaianRows.join(",\n")};\n`);
emit(`insert into kos_fasilitas (kos_id, fasilitas_id) values\n${kosFasRows.join(",\n")};\n`);
emit(`insert into kos_aturan (kos_id, jam_malam, tamu, lawan_jenis, pasangan, anak, hewan, masak_di_kamar, merokok, mayoritas_penghuni, suasana) values\n${aturanRows.join(",\n")};\n`);
emit(`insert into kos_sekitar (kos_id, landmark_nama, landmark_jarak_m, landmark_menit_jalan, rute, minimarket, warung, laundry, transit, akses, penerangan, rawan_banjir) values\n${sekitarRows.join(",\n")};\n`);
emit(`insert into kos_media (kos_id, jenis, url, keterangan, urutan, lebar, tinggi, blurhash) values\n${mediaRows.join(",\n")};\n`);
emit(`insert into catatan_surveyor (kos_id, hal_baik, perlu_diketahui, kesan_pemilik, red_flags) values\n${catatanRows.join(",\n")};\n`);
emit(`insert into log_ketersediaan (kos_id, tipe_kamar_id, kamar_tersedia, sumber, dibuat_pada) values\n${logRows.join(",\n")};\n`);
emit(`commit;\n`);

const tujuan = join(dirname(fileURLToPath(import.meta.url)), "01_seed.sql");
writeFileSync(tujuan, out.join("\n"));
console.log(`Wrote ${tujuan}: ${PROFIL.length} kos, ${kamarRows.length} room types, ${mediaRows.length} media rows.`);
