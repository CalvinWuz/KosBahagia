// Logo intro on a full reload: the house mark appears in the middle of the
// screen, its smile draws itself, then it shrinks and flies to the logo in the
// header. Decorative only: the page renders and works underneath the whole
// time (pointer-events: none, aria-hidden), nothing waits for it.
//
// How it is wired:
//   1. SKRIP_INTRO runs before the first paint (app/(user)/layout.tsx). On a
//      reload, with motion allowed and Web Animations available, it sets
//      <html data-intro="1">. CSS (app/globals.css) then shows the overlay,
//      plays "appear" and "smile" from the first paint, hides the header mark,
//      and, as a safety net, fades the overlay out and brings the header mark
//      back by itself at ~1,7 s if JavaScript never takes over.
//   2. components/layout/IntroLogo.tsx takes over after hydration
//      (data-intro="js"): when the smile is drawn it measures the real header
//      mark once and moves the overlay onto it, then hands over. If there is
//      no visible header mark (phones on /cari and /kos have their own bar),
//      the overlay fades out in place instead.
//   3. Any user input, resize, navigation, page hide or a switch to reduced
//      motion ends the intro at once; the header mark is always restored.
// Not a "seen it" flag: every reload plays it once; client navigations,
// router.refresh() and back/forward-cache restores do not.

/** Runs before paint; must stay tiny and must never throw. */
export const SKRIP_INTRO =
  'try{var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];' +
  'if(n&&n.type==="reload"&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&"animate" in Element.prototype)' +
  'document.documentElement.dataset.intro="1"}catch(e){}';

export type Kotak = { left: number; top: number; width: number; height: number };

/**
 * A target worth flying to: laid out (non-zero size) and fully inside the
 * viewport. A hidden header (display: none) measures 0 × 0 and fails here.
 */
export function targetLayak(t: Kotak | null | undefined, lebarLayar: number, tinggiLayar: number): t is Kotak {
  if (!t || !(t.width > 0) || !(t.height > 0)) return false;
  return t.left >= 0 && t.top >= 0 && t.left + t.width <= lebarLayar && t.top + t.height <= tinggiLayar;
}

/** Translate (centre to centre) and uniform scale that put box `dari` exactly on box `ke`. */
export function hitungGerak(dari: Kotak, ke: Kotak): { dx: number; dy: number; skala: number } {
  return {
    dx: ke.left + ke.width / 2 - (dari.left + dari.width / 2),
    dy: ke.top + ke.height / 2 - (dari.top + dari.height / 2),
    skala: ke.width / dari.width,
  };
}

export const DURASI_GERAK_MS = 560;
export const DURASI_PUDAR_MS = 220;
/** Past this point the CSS safety fade is already running; let it finish instead. */
export const BATAS_AMBIL_ALIH_MS = 1450;
