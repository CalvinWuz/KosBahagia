// Opening screen on every full page load, in the style of a web app's boot
// screen (Outlook on the web): a white screen with the layered house icon in
// the middle and "Kos Bahagia" at the bottom. The icon appears, its smile
// draws itself, it holds a moment, then it shrinks and flies onto the logo in
// the header while the white screen fades to reveal the page. Decorative
// only: the page renders and works underneath the whole time
// (pointer-events: none, aria-hidden), nothing waits for it.
//
// How it is wired:
//   1. SKRIP_INTRO runs before the first paint (app/(user)/layout.tsx). On a
//      full load (typed address, a link from outside, reload, back/forward
//      that reloads), with motion allowed and Web Animations available, it
//      sets <html data-intro="1">. Not for a prerendered or background tab
//      (nobody would see it), nor for search-engine crawlers. CSS
//      (app/globals.css) then shows the screen, plays "appear" and "smile"
//      from the first paint, hides the header mark, and, as a safety net,
//      fades everything out and brings the header mark back by itself at
//      ~1,7 s if JavaScript never takes over.
//   2. components/layout/IntroLogo.tsx takes over after hydration
//      (data-intro="js"): when the smile is drawn and after a short hold it
//      measures the real header mark once, flies the icon onto it and fades
//      the white screen, then hands over. If there is no visible header mark
//      (phones on /cari and /kos have their own bar), icon and screen fade
//      out in place instead.
//   3. Any user input, resize, navigation, page hide or a switch to reduced
//      motion ends it at once; the header mark is always restored.
// Not a "seen it" flag: every full load plays it once; client navigations,
// router.refresh() and back/forward-cache restores do not.

/** Runs before paint; must stay tiny and must never throw. */
export const SKRIP_INTRO =
  'try{var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];' +
  'if(n&&n.type!=="prerender"&&!document.prerendering&&document.visibilityState!=="hidden"' +
  '&&!/bot|crawl|spider|slurp|mediapartners/i.test(navigator.userAgent)' +
  '&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&"animate" in Element.prototype)' +
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
/** The icon rests, smile drawn, before it flies (the "boot screen" moment). */
export const JEDA_TAHAN_MS = 140;
/** The white screen and the bottom wordmark fade while the icon flies. */
export const DURASI_LATAR_MS = 420;
export const DURASI_PUDAR_MS = 260;
/** Past this point the CSS safety fade is already running; let it finish instead. */
export const BATAS_AMBIL_ALIH_MS = 1450;
