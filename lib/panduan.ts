// "Sudah membaca panduan singkat", kept apart from saved items and the
// compare tray (kb:simpan, kb:banding). Versioned: when the guide changes,
// bump VERSI and everyone sees the new one once.
//
// The flag is copied onto <html data-panduan> by a tiny script that runs
// before the first paint (app/(user)/layout.tsx), and CSS hides every
// [data-panduan-baru] element when it matches. So the server HTML is the
// same for everyone, nothing jumps after hydration, and without storage the
// guide simply stays visible until it is closed on this page.

export const KUNCI_PANDUAN = "kb:panduan";
export const VERSI_PANDUAN = "v1";

/** Runs before paint; must stay tiny and must never throw. */
export const SKRIP_PANDUAN = `try{if(localStorage.getItem(${JSON.stringify(KUNCI_PANDUAN)})===${JSON.stringify(VERSI_PANDUAN)})document.documentElement.dataset.panduan=${JSON.stringify(VERSI_PANDUAN)}}catch(e){}`;

export function tandaiPanduanDibaca() {
  document.documentElement.dataset.panduan = VERSI_PANDUAN;
  try {
    localStorage.setItem(KUNCI_PANDUAN, VERSI_PANDUAN);
  } catch {
    // Private mode: hidden for this page view only.
  }
}

export function tampilkanPanduanLagi() {
  delete document.documentElement.dataset.panduan;
  try {
    localStorage.removeItem(KUNCI_PANDUAN);
  } catch {
    // Nothing stored, nothing to remove.
  }
}

/**
 * The guide's buttons disappear when it is closed, so focus would fall back
 * to <body>. Move it to where the page continues instead.
 */
export function fokusSetelahPanduan(id: string, tunda = 0) {
  window.setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }, tunda);
}
