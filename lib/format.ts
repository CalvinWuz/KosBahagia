// All user-facing number, distance and time formatting lives here.
// Never call toLocaleString / Intl directly inside a component.

const angkaBulat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const angkaSatuDesimal = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

/** Integer rupiah → "Rp1.550.000". No space, no decimals. */
export function formatRupiah(rupiah: number): string {
  return `Rp${angkaBulat.format(Math.round(rupiah))}`;
}

/** Metres → "450 m" below 1 km, otherwise "1,2 km" (one decimal, id-ID comma). */
export function formatJarak(meter: number): string {
  if (meter < 1000) return `${angkaBulat.format(Math.round(meter))} m`;
  return `${angkaSatuDesimal.format(meter / 1000)} km`;
}

/**
 * Relative time in Indonesian: "baru saja", "5 menit lalu", "3 hari lalu".
 * `sekarang` is injectable so server and client render the same string.
 */
export function formatWaktuRelatif(
  tanggal: Date | string | number,
  sekarang: Date = new Date(),
): string {
  const waktu = new Date(tanggal).getTime();
  if (Number.isNaN(waktu)) return "";

  const detik = Math.round((sekarang.getTime() - waktu) / 1000);
  if (detik < 60) return "baru saja";

  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;

  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;

  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;

  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;

  return `${Math.floor(hari / 365)} tahun lalu`;
}

/** A 1–5 rubric value: "4,3", or "4" when whole. Pair it with "/5" in the UI. */
export function formatSkala(nilai: number): string {
  return angkaSatuDesimal.format(Math.round(nilai * 10) / 10);
}

const angkaTepatSatuDesimal = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Skor Bahagia 0–10 → "8,4" (always one decimal); null → "Belum dinilai". */
export function formatSkor(skor: number | null | undefined): string {
  if (skor == null) return "Belum dinilai";
  return angkaTepatSatuDesimal.format(skor);
}

const angkaDuaDesimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/**
 * Short rupiah for tight spaces, never rounded: 1.250.000 → "Rp1,25 jt",
 * 1.200.000 → "Rp1,2 jt", 850.000 → "Rp850 rb". An amount the short form
 * cannot state exactly (1.255.000) is written in full, so a short rent can
 * never look bigger or smaller than the total it is part of.
 */
export function formatRupiahRingkas(rupiah: number): string {
  const n = Math.round(rupiah);
  if (n >= 1_000_000 && n % 10_000 === 0) return `Rp${angkaDuaDesimal.format(n / 1_000_000)} jt`;
  if (n >= 1_000 && n < 1_000_000 && n % 1_000 === 0) return `Rp${angkaBulat.format(n / 1_000)} rb`;
  return formatRupiah(n);
}

const tanggalPanjang = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

/** "21 September 2026". Empty string for a missing or invalid date. */
export function formatTanggal(tanggal: Date | string | number | null | undefined): string {
  if (tanggal == null) return "";
  const d = new Date(tanggal);
  return Number.isNaN(d.getTime()) ? "" : tanggalPanjang.format(d);
}

/** Bytes → "4 MB" / "850 KB", id-ID separators. */
export function formatUkuran(bytes: number): string {
  if (bytes >= 1_000_000) return `${angkaSatuDesimal.format(Math.round((bytes / 1_000_000) * 10) / 10)} MB`;
  if (bytes >= 1_000) return `${angkaBulat.format(bytes / 1_000)} KB`;
  return `${angkaBulat.format(bytes)} B`;
}
