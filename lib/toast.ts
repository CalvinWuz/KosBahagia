"use client";

import { useSyncExternalStore } from "react";

// One global toast queue. Anything can push (save, compare, copy link); the
// <Toaster /> in the layout renders the newest one for a few seconds with an
// optional action link. No provider, no context.

export type Toast = {
  id: number;
  teks: string;
  aksi?: { label: string; href: string };
};

const pendengar = new Set<() => void>();
let daftar: Toast[] = [];
let urut = 0;
const KOSONG: Toast[] = [];

function siarkan() {
  pendengar.forEach((fn) => fn());
}

export function tampilkanToast(toast: Omit<Toast, "id">, durasiMs = 3200) {
  const id = ++urut;
  daftar = [...daftar.slice(-1), { id, ...toast }];
  siarkan();
  window.setTimeout(() => tutupToast(id), durasiMs);
  return id;
}

export function tutupToast(id: number) {
  if (!daftar.some((t) => t.id === id)) return;
  daftar = daftar.filter((t) => t.id !== id);
  siarkan();
}

function langganan(fn: () => void) {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

export function useToast(): Toast[] {
  return useSyncExternalStore(langganan, () => daftar, () => KOSONG);
}
