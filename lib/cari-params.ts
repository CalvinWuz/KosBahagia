// The /cari query-string contract. The homepage builds these links (task 03)
// and the search page parses them (task 04); both must go through here.
//
//   /cari?area=binus-kemanggisan&radius=2000
//   /cari?harga_max=1200000&urut=termurah
//   /cari?kebersihan=4&kedap=4
//   /cari?fasilitas=ac,kamar-mandi-dalam
//   /cari?tipe=putra,campur        any of the listed types (old ?tipe=putra still reads)
//   /cari?q=melati

export type UrutCari = "relevan" | "termurah" | "terdekat" | "skor";
export type TipeKosParam = "putra" | "putri" | "campur";

export type CariParams = {
  /** Free-text query (area or kos name). */
  q?: string;
  /** Area slug; the search centre. Defaults to the launch area when absent. */
  area?: string;
  /** Radius in metres around the area centre. */
  radius?: number;
  /** Free centre from "Cari di area peta ini"; overrides `area`. */
  lat?: number;
  lng?: number;
  harga_min?: number;
  harga_max?: number;
  /** Kos types, any of them. Empty or absent = every type. Stable order, no duplicates. */
  tipe?: TipeKosParam[];
  /** Minimum kebersihan score (1–5). */
  kebersihan?: number;
  /** Minimum kedap suara score (1–5). */
  kedap?: number;
  /** Facility slugs the kos must all have. */
  fasilitas?: string[];
  pasangan?: "boleh" | "surat_nikah";
  tanpa_jam_malam?: boolean;
  hewan?: boolean;
  masak?: boolean;
  /** Negative filter: hide kos with no minimarket within 300 m. */
  dekat_minimarket?: boolean;
  urut?: UrutCari;
  /** 1-based page. */
  hal?: number;
  /** Mobile view state; not a filter. */
  tampil?: "peta";
};

const URUT: UrutCari[] = ["relevan", "termurah", "terdekat", "skor"];
/** Display and serialisation order of the kos types. */
export const TIPE_KOS: readonly TipeKosParam[] = ["putra", "putri", "campur"];

/** Known types only, each once, in TIPE_KOS order: the same selection always writes the same URL. */
export function rapikanTipe(nilai: readonly string[] | undefined): TipeKosParam[] {
  const ada = new Set((nilai ?? []).map((t) => t.trim().toLowerCase()));
  return TIPE_KOS.filter((t) => ada.has(t));
}

/** Adds the type when absent, removes only that type when present. */
export function toggleTipe(p: CariParams, tipe: TipeKosParam): CariParams {
  const ada = p.tipe ?? [];
  const baru = ada.includes(tipe) ? ada.filter((t) => t !== tipe) : [...ada, tipe];
  return { ...p, tipe: rapikanTipe(baru) };
}

/** Builds a /cari href. Omits empty values so URLs stay short and shareable. */
export function hrefCari(p: CariParams): string {
  const sp = new URLSearchParams();
  if (p.q?.trim()) sp.set("q", p.q.trim());
  if (p.area) sp.set("area", p.area);
  if (p.radius) sp.set("radius", String(p.radius));
  if (p.lat != null && p.lng != null) {
    sp.set("lat", p.lat.toFixed(5));
    sp.set("lng", p.lng.toFixed(5));
  }
  if (p.harga_min) sp.set("harga_min", String(p.harga_min));
  if (p.harga_max) sp.set("harga_max", String(p.harga_max));
  const tipe = rapikanTipe(p.tipe);
  if (tipe.length) sp.set("tipe", tipe.join(","));
  if (p.kebersihan) sp.set("kebersihan", String(p.kebersihan));
  if (p.kedap) sp.set("kedap", String(p.kedap));
  if (p.fasilitas?.length) sp.set("fasilitas", [...new Set(p.fasilitas)].join(","));
  if (p.pasangan) sp.set("pasangan", p.pasangan);
  if (p.tanpa_jam_malam) sp.set("tanpa_jam_malam", "1");
  if (p.hewan) sp.set("hewan", "1");
  if (p.masak) sp.set("masak", "1");
  if (p.dekat_minimarket) sp.set("dekat_minimarket", "1");
  if (p.urut && p.urut !== "relevan") sp.set("urut", p.urut);
  if (p.hal && p.hal > 1) sp.set("hal", String(p.hal));
  if (p.tampil === "peta") sp.set("tampil", "peta");
  // Commas are legal in a query string; keep lists readable (tipe=putra,campur).
  const qs = sp.toString().replace(/%2C/gi, ",");
  return qs ? `/cari?${qs}` : "/cari";
}

type Mentah = Record<string, string | string[] | undefined>;

function satu(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function angka(v: string | string[] | undefined, min: number, max: number): number | undefined {
  const n = Number(satu(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

/** Parses Next.js searchParams (or a URLSearchParams) into a clean CariParams. */
export function bacaCariParams(mentah: Mentah | URLSearchParams): CariParams {
  const g = (k: string) =>
    mentah instanceof URLSearchParams ? (mentah.get(k) ?? undefined) : satu(mentah[k]);
  // Every value of a list key, whether written as a=x,y or a=x&a=y.
  const daftar = (k: string): string[] => {
    const v = mentah instanceof URLSearchParams ? mentah.getAll(k) : mentah[k];
    const semua = Array.isArray(v) ? v : v != null ? [v] : [];
    return semua.flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);
  };
  const tipe = rapikanTipe(daftar("tipe"));
  const fasilitas = [...new Set(daftar("fasilitas"))];
  const urut = g("urut");
  const pasangan = g("pasangan");
  const lat = angka(g("lat"), -11, 6);
  const lng = angka(g("lng"), 95, 141);
  return {
    q: g("q")?.trim() || undefined,
    area: g("area")?.trim() || undefined,
    radius: angka(g("radius"), 100, 20_000),
    lat: lat != null && lng != null ? lat : undefined,
    lng: lat != null && lng != null ? lng : undefined,
    harga_min: angka(g("harga_min"), 0, 50_000_000),
    harga_max: angka(g("harga_max"), 0, 50_000_000),
    tipe: tipe.length ? tipe : undefined,
    kebersihan: angka(g("kebersihan"), 1, 5),
    kedap: angka(g("kedap"), 1, 5),
    fasilitas: fasilitas.length ? fasilitas : undefined,
    pasangan: pasangan === "boleh" || pasangan === "surat_nikah" ? pasangan : undefined,
    tanpa_jam_malam: g("tanpa_jam_malam") === "1",
    hewan: g("hewan") === "1",
    masak: g("masak") === "1",
    dekat_minimarket: g("dekat_minimarket") === "1",
    urut: URUT.includes(urut as UrutCari) ? (urut as UrutCari) : "relevan",
    hal: angka(g("hal"), 1, 1000) ?? 1,
    tampil: g("tampil") === "peta" ? "peta" : undefined,
  };
}

/** Filters that narrow results (everything except where/how to sort). */
export const KUNCI_FILTER = [
  "harga_min",
  "harga_max",
  "tipe",
  "kebersihan",
  "kedap",
  "fasilitas",
  "pasangan",
  "tanpa_jam_malam",
  "hewan",
  "masak",
  "dekat_minimarket",
] as const satisfies readonly (keyof CariParams)[];

/**
 * How many requirements narrow the search, for the badge on "Filter". One
 * requirement each: the price range (min and/or max), the kos type (however
 * many types are ticked: it is one "any of" choice), every facility, every
 * score floor and every rule. lib/cari/filter-aktif.ts lists the same
 * requirements as removable chips.
 */
export function jumlahFilterAktif(p: CariParams): number {
  let n = 0;
  if (p.harga_min || p.harga_max) n++;
  if (p.tipe?.length) n++;
  if (p.kebersihan) n++;
  if (p.kedap) n++;
  n += new Set(p.fasilitas ?? []).size;
  if (p.pasangan) n++;
  if (p.tanpa_jam_malam) n++;
  if (p.hewan) n++;
  if (p.masak) n++;
  if (p.dekat_minimarket) n++;
  return n;
}

/** Same search, no narrowing filters. */
export function tanpaFilter(p: CariParams): CariParams {
  return { q: p.q, area: p.area, radius: p.radius, lat: p.lat, lng: p.lng, urut: p.urut, tampil: p.tampil };
}

// ---------------------------------------------------------------- price input
// One reader for every price box. Accepts what people type: "1500000",
// "1.500.000", "Rp 1.500.000", "1,5 jt", "1500rb". A negative or non-numeric
// value is an input error, never silently turned into "no filter".

export const HARGA_MAKS = 50_000_000;

export type HasilBacaRupiah = { nilai?: number; galat?: string };

export function bacaRupiah(teks: string): HasilBacaRupiah {
  const mentah = teks.trim().toLowerCase().replace(/^rp\.?/, "").replace(/\s+/g, "");
  if (!mentah) return {};
  if (mentah.startsWith("-")) return { galat: "Harga tidak boleh negatif." };
  const satuan = /^(\d+(?:[.,]\d+)?)(jt|juta|rb|ribu|k)$/.exec(mentah);
  let nilai: number;
  if (satuan) {
    const angka = Number(satuan[1].replace(",", "."));
    nilai = Math.round(angka * (satuan[2].startsWith("j") ? 1_000_000 : 1_000));
  } else {
    if (!/^\d{1,3}(?:[.,]\d{3})*$|^\d+$/.test(mentah)) return { galat: "Tulis angka saja, misalnya 1.500.000." };
    nilai = Number(mentah.replace(/[.,]/g, ""));
  }
  if (!Number.isFinite(nilai)) return { galat: "Tulis angka saja, misalnya 1.500.000." };
  if (nilai > HARGA_MAKS) return { galat: "Paling tinggi Rp50.000.000." };
  return nilai > 0 ? { nilai } : {};
}

/** Thousands separators for an input box: 1500000 → "1.500.000". */
export function tampilRupiahInput(nilai: number | undefined): string {
  return nilai ? new Intl.NumberFormat("id-ID").format(nilai) : "";
}

export type GalatRentang = { kolom: "harga_min"; pesan: string };

/**
 * Minimum above maximum is an input error, not "no results". Equal values
 * are a valid exact price; either side may be empty.
 */
export function validasiRentangHarga(min: number | undefined, max: number | undefined): GalatRentang | null {
  if (min != null && max != null && min > max) {
    const f = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
    return { kolom: "harga_min", pesan: `Minimal ${f(min)} lebih besar dari maksimal ${f(max)}. Turunkan minimal atau naikkan maksimal.` };
  }
  return null;
}
