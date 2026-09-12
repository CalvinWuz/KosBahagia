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
