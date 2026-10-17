// The v1 new-user guide ("Sudah membaca panduan singkat"), kept apart from
// saved items and the compare tray (kb:simpan, kb:banding). The three-step
// card it hid has since become the section tutorials (lib/tutorial-bagian.ts);
// the flag is still read so that whoever closed that guide is not offered
// every new tutorial: a tiny script copies it onto <html data-panduan> before
// the first paint (app/(user)/layout.tsx), and CSS keys on it.

export const KUNCI_PANDUAN = "kb:panduan";
export const VERSI_PANDUAN = "v1";

/** Runs before paint; must stay tiny and must never throw. */
export const SKRIP_PANDUAN = `try{if(localStorage.getItem(${JSON.stringify(KUNCI_PANDUAN)})===${JSON.stringify(VERSI_PANDUAN)})document.documentElement.dataset.panduan=${JSON.stringify(VERSI_PANDUAN)}}catch(e){}`;

/** Forget the v1 flag, so the renter offers may appear again ("Tawarkan lagi" on /cara-menggunakan). */
export function tampilkanPanduanLagi() {
  delete document.documentElement.dataset.panduan;
  try {
    localStorage.removeItem(KUNCI_PANDUAN);
  } catch {
    // Nothing stored, nothing to remove.
  }
}
