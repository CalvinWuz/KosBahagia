"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { IconJam } from "@/components/ui/Icon";
import { bacaRiwayat, type PilihanCari } from "@/components/cari/saran";

const KOSONG: PilihanCari[] = [];
let cache: PilihanCari[] = KOSONG;
function baca(): PilihanCari[] {
  const baru = bacaRiwayat();
  if (JSON.stringify(baru) !== JSON.stringify(cache)) cache = baru;
  return cache;
}
const langganan = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

// "Lanjutkan: Palmerah" under the hero, from this phone's recent searches.
// Client-only; the static homepage does not know about it.
export function LanjutkanCari() {
  const riwayat = useSyncExternalStore(langganan, baca, () => KOSONG);
  if (riwayat.length === 0) return null;
  return (
    <nav aria-label="Pencarian terakhir" className="mx-auto w-full max-w-6xl px-4">
      <ul className="flex flex-wrap items-center gap-2">
        <li className="text-small text-arang-500">Lanjutkan:</li>
        {riwayat.slice(0, 3).map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-biru-100 bg-putih px-3 text-small font-bold text-biru-600 transition-colors duration-150 ease-out hover:border-biru-500 hover:bg-biru-100/50"
            >
              <IconJam className="size-4" />
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
