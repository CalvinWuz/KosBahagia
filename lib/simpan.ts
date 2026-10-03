"use client";

import { useSyncExternalStore } from "react";

// Saved kos and the compare tray (max 3), kept in localStorage on this
// device only. Nothing here is sent to a server. No login wall on the renter
// surface (CLAUDE.md §6.5). A save keeps a snapshot of the price and
// availability of the room type the renter was looking at, so /disimpan can
// say what changed since.
//
// Since the 2026-10 audit both lists carry the room type. Entries written by
// earlier builds (bare ids, or objects without kamarId) still read: their
// room is null, which the pages show as "dipilih otomatis".

import { MAKS_BANDING } from "./kos/kunci-banding.ts";

export type Simpanan = {
  id: string;
  slug: string;
  nama: string;
  /** Room type the renter had selected; null = the page's default room. */
  kamarId: string | null;
  kamarNama: string | null;
  total_bulanan: number | null;
  kamar_tersedia: number | null;
  disimpan_pada: string;
};
export type ItemBanding = { id: string; slug: string; nama: string; kamarId: string | null; kamarNama: string | null };
export type RingkasanKos = {
  id: string;
  slug: string;
  nama: string;
  /** The room type in view; omit for "the page's default room". */
  kamarId?: string | null;
  kamarNama?: string | null;
  total_bulanan?: number | null;
  kamar_tersedia?: number | null;
};

const KUNCI = { simpan: "kb:simpan", banding: "kb:banding" } as const;
export { MAKS_BANDING };

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
const teksAtauNull = (v: unknown) => (typeof v === "string" && v ? v : null);
const angkaAtauNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function bacaSimpan(): Simpanan[] {
  const nilai = bacaMentah(KUNCI.simpan).map((x): Simpanan | null => {
    if (typeof x === "string") return { id: x, slug: "", nama: "", kamarId: null, kamarNama: null, total_bulanan: null, kamar_tersedia: null, disimpan_pada: "" };
    if (!x || typeof x !== "object") return null;
    const o = x as Record<string, unknown>;
    if (typeof o.id !== "string") return null;
    return {
      id: o.id,
      slug: teksAtauNull(o.slug) ?? "",
      nama: teksAtauNull(o.nama) ?? "",
      kamarId: teksAtauNull(o.kamarId),
      kamarNama: teksAtauNull(o.kamarNama),
      total_bulanan: angkaAtauNull(o.total_bulanan),
      kamar_tersedia: angkaAtauNull(o.kamar_tersedia),
      disimpan_pada: teksAtauNull(o.disimpan_pada) ?? "",
    };
  }).filter((x): x is Simpanan => x !== null);
  if (!sama(nilai, cache.simpan)) cache.simpan = nilai;
  return cache.simpan;
}
export function bacaBanding(): ItemBanding[] {
  const nilai = bacaMentah(KUNCI.banding).map((x): ItemBanding | null => {
    if (typeof x === "string") return { id: x, slug: "", nama: "", kamarId: null, kamarNama: null };
    if (!x || typeof x !== "object") return null;
    const o = x as Record<string, unknown>;
    if (typeof o.id !== "string") return null;
    return { id: o.id, slug: teksAtauNull(o.slug) ?? "", nama: teksAtauNull(o.nama) ?? "", kamarId: teksAtauNull(o.kamarId), kamarNama: teksAtauNull(o.kamarNama) };
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

/** A kos is saved once; saving again from another room type updates the room. */
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
    kamarId: kos.kamarId ?? null,
    kamarNama: kos.kamarNama ?? null,
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

const itemDari = (kos: RingkasanKos): ItemBanding => ({ id: kos.id, slug: kos.slug, nama: kos.nama, kamarId: kos.kamarId ?? null, kamarNama: kos.kamarNama ?? null });
/** Same kos and same room type. Two room types of one kos are two candidates. */
export const samaKandidat = (a: Pick<ItemBanding, "id" | "kamarId">, b: Pick<ItemBanding, "id" | "kamarId">) =>
  a.id === b.id && (a.kamarId ?? null) === (b.kamarId ?? null);

/** Adds to the tray; returns false when it is full (caller asks which to drop). */
export function tambahBanding(kos: RingkasanKos): boolean {
  const ada = bacaBanding();
  const item = itemDari(kos);
  if (ada.some((b) => samaKandidat(b, item))) return true;
  if (ada.length >= MAKS_BANDING) return false;
  tulis(KUNCI.banding, [...ada, item]);
  return true;
}
export function hapusBanding(kandidat: Pick<ItemBanding, "id" | "kamarId">) {
  tulis(KUNCI.banding, bacaBanding().filter((b) => !samaKandidat(b, kandidat)));
}
/** Swap one tray entry for another (the "which one to drop" answer). */
export function gantiBanding(lama: Pick<ItemBanding, "id" | "kamarId">, kos: RingkasanKos) {
  tulis(KUNCI.banding, bacaBanding().map((b) => (samaKandidat(b, lama) ? itemDari(kos) : b)));
}
export function setBanding(items: ItemBanding[]) {
  tulis(KUNCI.banding, items.slice(0, MAKS_BANDING));
}
