// Short contextual tutorials, one per main section (docs/hasil-tutorial-singkat-per-bagian.md).
//
// Each group is offered at most once per browser: a small "Butuh petunjuk?"
// line that the user may open, close, or ignore. Nothing starts by itself.
// Afterwards a quiet "Petunjuk bagian ini" button stays for reopening.
//
// Per group the browser remembers one status (no key = not offered yet):
//   ditawarkan  the offer was actually on screen
//   ditutup     the user closed the offer or the tutorial, or skipped it
//   selesai     the user went through every step
// A status only moves up (ditawarkan < ditutup < selesai): opening the
// tutorial again later, or losing its target, never turns "selesai" back.
//
// Kept apart from saved items and the compare tray, and holds no kos id,
// phone number or session data. Without storage the statuses live in memory
// for this visit only. A tiny pre-paint script copies the groups that have a
// status onto <html data-tutorial>, so CSS shows the offer or the quiet
// button from the first paint and nothing changes after hydration.

export const KUNCI_TUTORIAL = "kb:tutorial-bagian:v1";

export const KELOMPOK = ["beranda", "pencarian", "detail", "simpanan", "banding", "mitra-ringkasan"] as const;
export type Kelompok = (typeof KELOMPOK)[number];
/** The renter-surface groups ("Tawarkan lagi" on /cara-menggunakan resets these, never the owner's). */
export const KELOMPOK_PENCARI: readonly Kelompok[] = ["beranda", "pencarian", "detail", "simpanan", "banding"];

export type StatusTutorial = "ditawarkan" | "ditutup" | "selesai";
export type Preferensi = Partial<Record<Kelompok, StatusTutorial>>;

const PERINGKAT: Record<StatusTutorial, number> = { ditawarkan: 1, ditutup: 2, selesai: 3 };

const adalahKelompok = (k: string): k is Kelompok => (KELOMPOK as readonly string[]).includes(k);
const adalahStatus = (s: unknown): s is StatusTutorial => typeof s === "string" && s in PERINGKAT;

/** Stored text → preferences. Corrupt JSON, other shapes, unknown groups and values are dropped. */
export function bacaPreferensi(teks: string | null): Preferensi {
  if (!teks) return {};
  let nilai: unknown;
  try {
    nilai = JSON.parse(teks);
  } catch {
    return {};
  }
  if (!nilai || typeof nilai !== "object" || Array.isArray(nilai)) return {};
  const hasil: Preferensi = {};
  for (const [k, s] of Object.entries(nilai)) if (adalahKelompok(k) && adalahStatus(s)) hasil[k] = s;
  return hasil;
}

/** `status` for `kelompok`, unless the group already has a higher one. */
export function naikkanStatus(pref: Preferensi, kelompok: Kelompok, status: StatusTutorial): Preferensi {
  const lama = pref[kelompok];
  if (lama && PERINGKAT[lama] >= PERINGKAT[status]) return pref;
  return { ...pref, [kelompok]: status };
}

/**
 * Whether the one-time offer may be shown. Never twice, and never to someone
 * who already closed the v1 guide (kb:panduan): they know the site, and the
 * quiet button is still there. The owner surface has its own audience.
 */
export function layakDitawarkan(pref: Preferensi, kelompok: Kelompok, panduanLamaDitutup: boolean): boolean {
  if (pref[kelompok]) return false;
  return kelompok === "mitra-ringkasan" || !panduanLamaDitutup;
}

/** Groups to list on <html data-tutorial>: every group with a status. */
export function daftarBertanda(pref: Preferensi): Kelompok[] {
  return KELOMPOK.filter((k) => pref[k]);
}

// --- browser storage, with a memory copy when storage refuses ------------

let memori: Preferensi = {};

function simpanTeks(): string | null {
  try {
    return localStorage.getItem(KUNCI_TUTORIAL);
  } catch {
    return null;
  }
}

/** Current preferences: storage merged with this visit's memory copy. */
export function preferensi(): Preferensi {
  const dariSimpan = bacaPreferensi(simpanTeks());
  let hasil = dariSimpan;
  for (const k of KELOMPOK) {
    const s = memori[k];
    if (s) hasil = naikkanStatus(hasil, k, s);
  }
  return hasil;
}

/** Records a status (moving up only) and returns the new preferences. */
export function catatStatus(kelompok: Kelompok, status: StatusTutorial): Preferensi {
  const baru = naikkanStatus(preferensi(), kelompok, status);
  memori = naikkanStatus(memori, kelompok, status);
  try {
    localStorage.setItem(KUNCI_TUTORIAL, JSON.stringify(baru));
  } catch {
    // Blocked or full: kept in memory for this visit; not promised after a reload.
  }
  return baru;
}

/** "Tawarkan lagi": forget these groups so each is offered once more. */
export function lupakanStatus(kelompok: readonly Kelompok[]): void {
  const sisa: Preferensi = { ...preferensi() };
  for (const k of kelompok) {
    delete sisa[k];
    delete memori[k];
  }
  try {
    if (Object.keys(sisa).length) localStorage.setItem(KUNCI_TUTORIAL, JSON.stringify(sisa));
    else localStorage.removeItem(KUNCI_TUTORIAL);
  } catch {
    // Nothing stored, nothing to forget.
  }
  const html = document.documentElement;
  const tersisa = daftarBertanda(sisa);
  if (tersisa.length) html.dataset.tutorial = tersisa.join(" ");
  else delete html.dataset.tutorial;
}

/** Hides the offer and shows the quiet button for `kelompok` (CSS keyed on <html data-tutorial>). */
export function tandaiDiHalaman(kelompok: Kelompok): void {
  const html = document.documentElement;
  const ada = new Set((html.dataset.tutorial ?? "").split(" ").filter(Boolean));
  if (ada.has(kelompok)) return;
  ada.add(kelompok);
  html.dataset.tutorial = [...ada].join(" ");
}

/**
 * Runs before the first paint (both root layouts); must stay tiny and never
 * throw. Lists every group with a status; anything else in storage is ignored.
 */
export const SKRIP_TUTORIAL = `try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(KUNCI_TUTORIAL)})||"{}"),k=[],g;if(t&&typeof t==="object")for(g in t)if(/^[a-z-]+$/.test(g)&&typeof t[g]==="string")k.push(g);if(k.length)document.documentElement.dataset.tutorial=k.join(" ")}catch(e){}`;
