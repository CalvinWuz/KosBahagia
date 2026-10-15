// The cost facts on an area page, computed from the same search the area's
// "Lihat N kos" button opens (cari_kos_v4), so the page and /cari can never
// disagree. Each kos contributes the room it shows in search, priced by
// lib/biaya.ts. A total with an unknown fee is a partial number: it is
// counted apart and kept out of the median and the range, instead of being
// presented as "sudah termasuk semua".

import { bacaKamar, hitungBiaya } from "../biaya.ts";
import type { Json } from "../supabase/types.ts";

export type FaktaBiayaArea = {
  median: number | null;
  min: number | null;
  max: number | null;
  /** Kos whose shown room has a complete (or estimated) total. */
  dihitung: number;
  /** Of those, how many include an estimated electricity use. */
  estimasi: number;
  /** Kos left out because a fee is still unknown. */
  belumLengkap: number;
};

export function faktaBiayaArea(kos: ReadonlyArray<{ kamar: Json | null }>): FaktaBiayaArea {
  const total: number[] = [];
  let estimasi = 0;
  let belumLengkap = 0;
  for (const k of kos) {
    const kamar = bacaKamar(k.kamar);
    if (!kamar) continue;
    const b = hitungBiaya(kamar);
    if (!b.lengkap) {
      belumLengkap++;
      continue;
    }
    if (b.estimasi) estimasi++;
    total.push(b.total);
  }
  total.sort((a, b) => a - b);
  const n = total.length;
  const tengah = Math.floor(n / 2);
  const median = n === 0 ? null : n % 2 ? total[tengah] : Math.round((total[tengah - 1] + total[tengah]) / 2);
  return { median, min: n ? total[0] : null, max: n ? total[n - 1] : null, dihitung: n, estimasi, belumLengkap };
}
