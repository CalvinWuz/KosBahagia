"use client";

import { useEffect, type RefObject } from "react";

// Fixed bars at the bottom of the screen publish their height as CSS
// variables on <html>: the detail page's chat bar (--tinggi-bar-aksi) and the
// compare tray (--tinggi-tray). The tray, the toast and the phone map stack
// above them from these values (app/globals.css, .di-atas-bar-aksi and
// .di-atas-tray) instead of guessing a fixed rem offset that breaks when a
// bar wraps or text is enlarged. A bar hidden with display: none measures 0.
export type RuangBawah = "--tinggi-bar-aksi" | "--tinggi-tray";

export function useTinggiBawah(ref: RefObject<HTMLElement | null>, nama: RuangBawah) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const akar = document.documentElement.style;
    const ukur = () => akar.setProperty(nama, `${el.offsetHeight}px`);
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => {
      ro.disconnect();
      akar.removeProperty(nama);
    };
  }, [ref, nama]);
}
