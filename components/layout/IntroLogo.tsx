"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { BATAS_AMBIL_ALIH_MS, DURASI_GERAK_MS, DURASI_PUDAR_MS, hitungGerak, targetLayak } from "@/lib/intro-logo";

// The overlay for the reload intro (see lib/intro-logo.ts for the whole
// sequence). It is server-rendered and hidden by CSS unless the pre-paint
// script set <html data-intro>, so the first two steps play from the first
// paint. This component only does what CSS cannot: measure the header mark
// and fly there, and end everything cleanly.
//
// One controller per document (module state), so React StrictMode's
// mount → unmount → mount in development cannot start a second intro or end
// the first one early.

let dimulai = false;
let pemilik = 0;
let akhiri: (() => void) | null = null;

function mulai() {
  if (dimulai) return;
  dimulai = true;
  const html = document.documentElement;
  if (html.dataset.intro !== "1") return;
  const overlay = document.querySelector<HTMLElement>("[data-intro-logo]");
  const gerak = overlay?.querySelector<HTMLElement>("[data-intro-gerak]");
  if (!overlay || !gerak) {
    delete html.dataset.intro;
    return;
  }

  let selesai = false;
  let animasi: Animation | null = null;
  // Hard stop: whatever happens, the header mark is back within 3 s.
  const pengaman = window.setTimeout(() => tutup(), 3000);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const peristiwaInput = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
  const peristiwaJendela = ["resize", "orientationchange", "pagehide"] as const;

  const tutup = () => {
    if (selesai) return;
    selesai = true;
    akhiri = null;
    window.clearTimeout(pengaman);
    peristiwaInput.forEach((p) => window.removeEventListener(p, tutup, true));
    peristiwaJendela.forEach((p) => window.removeEventListener(p, tutup));
    document.removeEventListener("visibilitychange", tutup);
    reduce.removeEventListener("change", tutup);
    animasi?.cancel();
    // Hands the header mark back and hides the overlay (both are CSS keyed on this attribute).
    delete html.dataset.intro;
  };
  akhiri = tutup;

  // The CSS safety fade is about to run (slow hydration): let it finish rather than snap.
  const cadangan = overlay.getAnimations()[0];
  if (cadangan && Number(cadangan.currentTime ?? 0) > BATAS_AMBIL_ALIH_MS) {
    cadangan.finished.then(tutup, tutup);
    return;
  }

  html.dataset.intro = "js";
  peristiwaInput.forEach((p) => window.addEventListener(p, tutup, { capture: true, passive: true }));
  peristiwaJendela.forEach((p) => window.addEventListener(p, tutup));
  document.addEventListener("visibilitychange", tutup);
  reduce.addEventListener("change", tutup);

  const senyum = overlay.querySelector(".intro-senyum")?.getAnimations()[0];
  const sesudahSenyum = senyum ? senyum.finished : Promise.resolve();
  sesudahSenyum.then(
    () => {
      if (selesai) return;
      // Measured once, when the move starts; any resize afterwards ends the intro.
      const target = document.querySelector<HTMLElement>("[data-logo-header]")?.getBoundingClientRect();
      if (targetLayak(target, window.innerWidth, window.innerHeight)) {
        const { dx, dy, skala } = hitungGerak(gerak.getBoundingClientRect(), target);
        animasi = gerak.animate(
          [{ transform: "translate(0, 0) scale(1)" }, { transform: `translate(${dx}px, ${dy}px) scale(${skala})` }],
          { duration: DURASI_GERAK_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
        );
      } else {
        // No visible header mark (phones on /cari and /kos): fade out where it is.
        animasi = gerak.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.92)" }], {
          duration: DURASI_PUDAR_MS,
          easing: "ease-in",
          fill: "forwards",
        });
      }
      animasi.finished.then(tutup, tutup);
    },
    tutup,
  );
}

export function IntroLogo() {
  const pathname = usePathname();
  const awal = useRef(pathname);

  useEffect(() => {
    pemilik++;
    mulai();
    return () => {
      pemilik--;
      // StrictMode remounts straight away; only a real unmount ends the intro.
      window.setTimeout(() => {
        if (pemilik === 0) akhiri?.();
      }, 0);
    };
  }, []);

  // A client navigation during the intro ends it; the new page is the focus.
  useEffect(() => {
    if (pathname !== awal.current) akhiri?.();
  }, [pathname]);

  return (
    <div data-intro-logo aria-hidden="true" className="intro-logo">
      <div data-intro-gerak className="intro-gerak">
        <Logo className="intro-mark size-24 text-biru-500" kelasSenyum="intro-senyum" />
      </div>
    </div>
  );
}
