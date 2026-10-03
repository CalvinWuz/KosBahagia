// The compare candidate is a kos AND a room type: an AC room picked on the
// detail page must stay an AC room in the table, after a reload and in a
// shared link. URL form:
//
//   /banding?kos=kost-anggrek-cakra:3f1c…e9,kos-putri-melati
//
// Each entry is `<slug or kos id>[:<tipe_kamar id>]`. No room id means "the
// page picks the cheapest room that has space" and the table says so.
// Links from before this change (`?kos=a,b,c`) still read the same way.

export const MAKS_BANDING = 3;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type KunciBanding = {
  /** Kos slug (shareable) or kos id (older tray entries). */
  kos: string;
  /** tipe_kamar id, or null for "pilihan otomatis". */
  kamar: string | null;
};

export const samaKunci = (a: KunciBanding, b: KunciBanding) => a.kos === b.kos && a.kamar === b.kamar;

/** Parses `?kos=`; drops malformed entries and duplicates, keeps at most three. */
export function bacaKunciBanding(raw: string | string[] | undefined | null): KunciBanding[] {
  const nilai = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const hasil: KunciBanding[] = [];
  for (const bagian of nilai.split(",")) {
    const [kosMentah, kamarMentah] = bagian.trim().split(":");
    const kos = kosMentah?.trim().toLowerCase() ?? "";
    if (!kos || !(SLUG.test(kos) || UUID.test(kos))) continue;
    const kamar = kamarMentah && UUID.test(kamarMentah.trim()) ? kamarMentah.trim().toLowerCase() : null;
    const k = { kos, kamar };
    if (!hasil.some((x) => samaKunci(x, k))) hasil.push(k);
    if (hasil.length === MAKS_BANDING) break;
  }
  return hasil;
}

export function tulisKunciBanding(kunci: KunciBanding[]): string {
  return kunci
    .slice(0, MAKS_BANDING)
    .map((k) => (k.kamar ? `${k.kos}:${k.kamar}` : k.kos))
    .join(",");
}

export function hrefBanding(kunci: KunciBanding[]): string {
  return kunci.length ? `/banding?kos=${tulisKunciBanding(kunci)}` : "/banding";
}

export const adalahUuid = (s: string) => UUID.test(s);
