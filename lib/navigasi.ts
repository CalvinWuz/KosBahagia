"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Navigation helpers shared by the back buttons and every layered UI
// (sheet, lightbox, 360° viewer). Two problems they solve:
//
//   1. "Kembali" should go to where the user actually came from when that
//      was one of our pages, and to a sensible page when it was not
//      (deep link from WhatsApp, typed URL).
//   2. On a phone the hardware back button must close the open layer, not
//      leave the page with the layer still drawn.

const KUNCI_KEDALAMAN = "kb:kedalaman";

function bacaKedalaman(): number {
  try {
    return Number(sessionStorage.getItem(KUNCI_KEDALAMAN) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** Mounted once in the layout: counts our own page views in this tab. */
export function PelacakRiwayat() {
  const pathname = usePathname();
  const terakhir = useRef<string | null>(null);
  useEffect(() => {
    if (terakhir.current === pathname) return;
    terakhir.current = pathname;
    try {
      sessionStorage.setItem(KUNCI_KEDALAMAN, String(bacaKedalaman() + 1));
    } catch {
      // Private mode: back falls through to the fallback href.
    }
  }, [pathname]);
  return null;
}

type NavigasiApi = {
  entries(): Array<{ url: string | null }>;
  currentEntry: { index: number } | null;
};

/** True when the previous history entry is one of our pages. */
export function adaRiwayatInternal(): boolean {
  if (typeof window === "undefined") return false;
  // The Navigation API knows the real position in the stack; entries from
  // other origins are simply absent, so index 0 means "came from outside".
  const nav = (window as unknown as { navigation?: NavigasiApi }).navigation;
  if (nav?.entries && nav.currentEntry) {
    const sebelumnya = nav.entries()[nav.currentEntry.index - 1];
    return !!sebelumnya?.url && sebelumnya.url.startsWith(window.location.origin);
  }
  // Older Safari: a per-tab page-view counter is the best available guess.
  return window.history.length > 1 && bacaKedalaman() > 1;
}

/** Back to the previous page of ours, or to `fallback` when there is none. */
export function useKembali(fallback: string) {
  const router = useRouter();
  return () => {
    if (adaRiwayatInternal()) router.back();
    else router.push(fallback);
  };
}

type LapisOpsi = {
  open: boolean;
  onClose: () => void;
  /**
   * Current href while open. When back closes the layer and this differs
   * from the href at open time it is pushed again, so changes applied live
   * (the filter sheet) survive the close.
   */
  hrefTerakhir?: string;
  /**
   * Asked on a button-close: did this layer already turn its history entry
   * into something meaningful (a live filter change)? Then the entry stays.
   */
  pertahankan?: () => boolean;
};

// Next's router rewrites history.state on every state change, so nothing
// can be stored there. Our bookkeeping lives here instead.
let lapisAktif: { lepas: () => void } | null = null;
let entriAktif: { panjang: number } | null = null;
// A button-close pops our entry on the next tick, so an effect that re-runs
// immediately (React strict mode) can cancel it and reuse the entry.
let tundaPop: number | null = null;

/**
 * Called right before a layer navigates somewhere else (router.replace):
 * the layer's entry becomes that page, so closing must not pop it.
 */
export function lepasLapisAktif() {
  lapisAktif?.lepas();
}

/**
 * Pushes a history entry while a layer is open. Hardware back then pops
 * that entry, which closes the layer instead of leaving the page. A
 * button-close pops the entry again unless the layer turned it into a
 * real state (see `pertahankan`, `lepasLapisAktif`). One layer session is
 * therefore never more than one history step.
 */
export function useLapisRiwayat({ open, onClose, hrefTerakhir, pertahankan }: LapisOpsi) {
  const onCloseRef = useRef(onClose);
  const hrefRef = useRef(hrefTerakhir);
  const pertahankanRef = useRef(pertahankan);
  useEffect(() => {
    onCloseRef.current = onClose;
    pertahankanRef.current = pertahankan;
    // Next's popstate handler re-renders synchronously with the popped URL
    // before our own listener runs; that render must not overwrite the live
    // href, or a back-close would look like "nothing changed".
    if (window.event?.type !== "popstate") hrefRef.current = hrefTerakhir;
  });

  useEffect(() => {
    if (!open) return;
    const awal = window.location.href;
    if (tundaPop !== null) {
      window.clearTimeout(tundaPop);
      tundaPop = null;
    }
    // Strict mode re-runs the effect at once: the entry is still there, reuse it.
    if (!(entriAktif && entriAktif.panjang === window.history.length)) {
      // Carry Next's own state along, otherwise its popstate handler reloads.
      window.history.pushState({ ...(window.history.state ?? {}) }, "");
      entriAktif = { panjang: window.history.length };
    }
    let diAtas = true;
    const lapis = {
      lepas: () => {
        diAtas = false;
        entriAktif = null;
      },
    };
    lapisAktif = lapis;

    const onPop = () => {
      diAtas = false;
      entriAktif = null;
      window.removeEventListener("popstate", onPop);
      onCloseRef.current();
      // Changes applied live while open are not a cancellation: push them
      // back on top of the entry the browser just returned to (Next has
      // already restored that entry by now).
      const akhir = hrefRef.current ? new URL(hrefRef.current, window.location.origin).href : null;
      if (akhir && akhir !== awal && akhir !== window.location.href) window.history.pushState(null, "", akhir);
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      if (lapisAktif === lapis) lapisAktif = null;
      if (!diAtas) return;
      if (pertahankanRef.current?.()) {
        entriAktif = null;
        return;
      }
      tundaPop = window.setTimeout(() => {
        tundaPop = null;
        entriAktif = null;
        window.history.back();
      }, 0);
    };
  }, [open]);
}
