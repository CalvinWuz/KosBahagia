"use client";

import { useSyncExternalStore } from "react";

// Saved kos and the compare tray (max 3), kept in localStorage. No login
// wall on the renter surface (CLAUDE.md §6.5); task 07 builds the pages.

const KUNCI = { simpan: "kb:simpan", banding: "kb:banding" } as const;
export const MAKS_BANDING = 3;
type Jenis = keyof typeof KUNCI;

const pendengar = new Set<() => void>();
const cache: Record<Jenis, string[]> = { simpan: [], banding: [] };
const KOSONG: string[] = [];

function baca(jenis: Jenis): string[] {
  try {
    const raw = localStorage.getItem(KUNCI[jenis]);
    const nilai = raw ? (JSON.parse(raw) as string[]) : [];
    // Keep referential stability so useSyncExternalStore does not loop.
    if (nilai.join() !== cache[jenis].join()) cache[jenis] = nilai;
    return cache[jenis];
  } catch {
    return KOSONG;
  }
}

function tulis(jenis: Jenis, nilai: string[]) {
  try {
    localStorage.setItem(KUNCI[jenis], JSON.stringify(nilai));
  } catch {
    // Private mode etc. — state is still updated in memory below.
  }
  cache[jenis] = nilai;
  pendengar.forEach((fn) => fn());
}

function langganan(fn: () => void) {
  pendengar.add(fn);
  const onStorage = () => fn();
  window.addEventListener("storage", onStorage);
  return () => {
    pendengar.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSimpanan(jenis: Jenis): string[] {
  return useSyncExternalStore(langganan, () => baca(jenis), () => KOSONG);
}

export function toggleSimpan(id: string) {
  const ada = baca("simpan");
  tulis("simpan", ada.includes(id) ? ada.filter((x) => x !== id) : [id, ...ada]);
}

/** Returns false when the tray is already full. */
export function toggleBanding(id: string): boolean {
  const ada = baca("banding");
  if (ada.includes(id)) {
    tulis("banding", ada.filter((x) => x !== id));
    return true;
  }
  if (ada.length >= MAKS_BANDING) return false;
  tulis("banding", [...ada, id]);
  return true;
}
