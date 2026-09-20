// The /cari query-string contract. The homepage builds these links (task 03)
// and the search page parses them (task 04); both must go through here.
//
//   /cari?area=binus-kemanggisan&radius=2000
//   /cari?harga_max=1200000&urut=termurah
//   /cari?kebersihan=4&kedap=4
//   /cari?fasilitas=ac,kamar-mandi-dalam
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
  tipe?: TipeKosParam;
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
const TIPE: TipeKosParam[] = ["putra", "putri", "campur"];

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
  if (p.tipe) sp.set("tipe", p.tipe);
  if (p.kebersihan) sp.set("kebersihan", String(p.kebersihan));
  if (p.kedap) sp.set("kedap", String(p.kedap));
  if (p.fasilitas?.length) sp.set("fasilitas", p.fasilitas.join(","));
  if (p.pasangan) sp.set("pasangan", p.pasangan);
  if (p.tanpa_jam_malam) sp.set("tanpa_jam_malam", "1");
  if (p.hewan) sp.set("hewan", "1");
  if (p.masak) sp.set("masak", "1");
  if (p.dekat_minimarket) sp.set("dekat_minimarket", "1");
  if (p.urut && p.urut !== "relevan") sp.set("urut", p.urut);
  if (p.hal && p.hal > 1) sp.set("hal", String(p.hal));
  if (p.tampil === "peta") sp.set("tampil", "peta");
  const qs = sp.toString();
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
  const tipe = g("tipe");
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
    tipe: TIPE.includes(tipe as TipeKosParam) ? (tipe as TipeKosParam) : undefined,
    kebersihan: angka(g("kebersihan"), 1, 5),
    kedap: angka(g("kedap"), 1, 5),
    fasilitas: g("fasilitas")?.split(",").map((s) => s.trim()).filter(Boolean),
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

export function jumlahFilterAktif(p: CariParams): number {
  return KUNCI_FILTER.filter((k) => {
    const v = p[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
}

/** Same search, no narrowing filters. */
export function tanpaFilter(p: CariParams): CariParams {
  return { q: p.q, area: p.area, radius: p.radius, lat: p.lat, lng: p.lng, urut: p.urut, tampil: p.tampil };
}
