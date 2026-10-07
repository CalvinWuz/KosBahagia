"use client";

import { useEffect, useRef } from "react";

// Jumping to a part of the detail page that may be folded away. The section
// chips, "Lihat rincian biaya" and a direct #anchor link all go through here:
// the folded part opens first, then the page scrolls and focus moves, so the
// target is never hidden inside a closed accordion or under the sticky bars
// (sections carry scroll-margin for those).

const PERISTIWA = "kb:buka-bagian";

/** Asks every folded part that answers to `id` to open. */
export function bukaBagian(id: string) {
  window.dispatchEvent(new CustomEvent<string>(PERISTIWA, { detail: id }));
}

/** Open, then scroll to and focus `id` (after the layout has settled). */
export function lompatKe(id: string) {
  bukaBagian(id);
  window.requestAnimationFrame(() =>
    window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
      window.history.replaceState(window.history.state, "", `#${id}`);
    }),
  );
}

/**
 * A folded part opens when one of `ids` is asked for: by bukaBagian/lompatKe,
 * by a hash change, or by the hash already in the URL on load.
 */
export function useBukaSaatDituju(ids: readonly string[] | undefined, buka: () => void) {
  const bukaRef = useRef(buka);
  useEffect(() => {
    bukaRef.current = buka;
  });
  const kunci = ids?.join(",") ?? "";
  useEffect(() => {
    if (!kunci) return;
    const daftar = kunci.split(",");
    const cek = (id: string) => {
      if (daftar.includes(id)) bukaRef.current();
    };
    const dariHash = () => cek(decodeURIComponent(window.location.hash.slice(1)));
    const dariPeristiwa = (e: Event) => cek((e as CustomEvent<string>).detail);
    dariHash();
    window.addEventListener(PERISTIWA, dariPeristiwa);
    window.addEventListener("hashchange", dariHash);
    return () => {
      window.removeEventListener(PERISTIWA, dariPeristiwa);
      window.removeEventListener("hashchange", dariHash);
    };
  }, [kunci]);
}
