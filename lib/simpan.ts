"use client";

import { useSyncExternalStore } from "react";

// Saved kos and the compare tray (max 3), kept in localStorage. No login
// wall on the renter surface (CLAUDE.md §6.5). A save keeps a snapshot of
// the price and availability so /disimpan can say what changed since.

export type Simpanan = {
  id: string;
  slug: string;
  nama: string;
  total_bulanan: number | null;
  kamar_tersedia: number | null;
  disimpan_pada: string;
};
export type ItemBanding = { id: string; slug: string; nama: string };
export type RingkasanKos = { id: string; slug: string; nama: string; total_bulanan?: number | null; kamar_tersedia?: number | null };

const KUNCI = { simpan: "kb:simpan", banding: "kb:banding" } as const;
export const MAKS_BANDING = 3;

const pendengar = new Set<() => void>();
const cache: { simpan: Simpanan[]; banding: ItemBanding[] } = { simpan: [], banding: [] };
const KOSONG: never[] = [];

function sama(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function bacaMentah(kunci: string): unknown[] {
  try {
    const raw = localStorage.getItem(kunci);
    const nilai = raw ? JSON.parse(raw) : [];
    return Array.isArray(nilai) ? nilai : [];
  } catch {
    return [];
  }
}

// Entries written by earlier builds were bare ids; keep them readable.
function bacaSimpan(): Simpanan[] {
  const nilai = bacaMentah(KUNCI.simpan).map((x): Simpanan | null => {
    if (typeof x === "string") return { id: x, slug: "", nama: "", total_bulanan: null, kamar_tersedia: null, disimpan_pada: "" };
    if (x && typeof x === "object" && typeof (x as Simpanan).id === "string") return x as Simpanan;
    return null;
  }).filter((x): x is Simpanan => x !== null);
  if (!sama(nilai, cache.simpan)) cache.simpan = nilai;
  return cache.simpan;
}
function bacaBanding(): ItemBanding[] {
  const nilai = bacaMentah(KUNCI.banding).map((x): ItemBanding | null => {
    if (typeof x === "string") return { id: x, slug: "", nama: "" };
    if (x && typeof x === "object" && typeof (x as ItemBanding).id === "string") return x as ItemBanding;
    return null;
  }).filter((x): x is ItemBanding => x !== null);
  if (!sama(nilai, cache.banding)) cache.banding = nilai;
  return cache.banding;
}

function tulis(kunci: string, nilai: unknown) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    // Private mode etc. — in-memory state still updates below.
  }
  if (kunci === KUNCI.simpan) cache.simpan = nilai as Simpanan[];
  else cache.banding = nilai as ItemBanding[];
  pendengar.forEach((fn) => fn());
}

function langganan(fn: () => void) {
  pendengar.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    pendengar.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

export function useSimpanan(): Simpanan[] {
  return useSyncExternalStore(langganan, bacaSimpan, () => KOSONG);
}
export function useBanding(): ItemBanding[] {
  return useSyncExternalStore(langganan, bacaBanding, () => KOSONG);
}

export function toggleSimpan(kos: RingkasanKos) {
  const ada = bacaSimpan();
  if (ada.some((s) => s.id === kos.id)) {
    tulis(KUNCI.simpan, ada.filter((s) => s.id !== kos.id));
    return;
  }
  const baru: Simpanan = {
    id: kos.id,
    slug: kos.slug,
    nama: kos.nama,
    total_bulanan: kos.total_bulanan ?? null,
    kamar_tersedia: kos.kamar_tersedia ?? null,
    disimpan_pada: new Date().toISOString(),
  };
  tulis(KUNCI.simpan, [baru, ...ada]);
}

export function hapusSimpan(id: string) {
  tulis(KUNCI.simpan, bacaSimpan().filter((s) => s.id !== id));
}

/** Refresh a save's snapshot to the current values (after the user has seen the change). */
export function segarkanSimpan(kos: RingkasanKos) {
  tulis(KUNCI.simpan, bacaSimpan().map((s) => (s.id === kos.id ? { ...s, total_bulanan: kos.total_bulanan ?? null, kamar_tersedia: kos.kamar_tersedia ?? null } : s)));
}

/** Adds to the tray; returns false when it is full (caller asks which to drop). */
export function tambahBanding(kos: RingkasanKos): boolean {
  const ada = bacaBanding();
  if (ada.some((b) => b.id === kos.id)) return true;
  if (ada.length >= MAKS_BANDING) return false;
  tulis(KUNCI.banding, [...ada, { id: kos.id, slug: kos.slug, nama: kos.nama }]);
  return true;
}
export function hapusBanding(id: string) {
  tulis(KUNCI.banding, bacaBanding().filter((b) => b.id !== id));
}
/** Swap one tray entry for another (the "which one to drop" answer). */
export function gantiBanding(idLama: string, kos: RingkasanKos) {
  tulis(KUNCI.banding, bacaBanding().map((b) => (b.id === idLama ? { id: kos.id, slug: kos.slug, nama: kos.nama } : b)));
}
export function setBanding(items: ItemBanding[]) {
  tulis(KUNCI.banding, items.slice(0, MAKS_BANDING));
}
