"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { IconClose, IconInfo } from "@/components/ui/Icon";
import { saatLapisDibuka } from "@/lib/navigasi";
import { catatStatus, tandaiDiHalaman, type Kelompok } from "@/lib/tutorial-bagian";
import { cn } from "@/lib/cn";

// The section tutorial (lib/tutorial-bagian.ts for the rules). Three pieces,
// placed by the page that owns the section:
//
//   <TawaranTutorial>  the one-time "Butuh petunjuk?" line; opens step 1
//   <TombolTutorial>   the quiet "Petunjuk bagian ini" button, for later
//   <SlotTutorial>     where step n's panel appears, right next to what it
//                      explains; step 1's slot sits where the offer is
//
// Which of offer and button shows is decided by CSS before the first paint.
// Panels are inline, non-modal and never add history. Nothing opens, moves
// focus or scrolls until the user asks; the panel closes when its section
// unmounts (another page), when its target disappears, on Escape, or when
// another layer (filter, gallery, 360°, menu) opens.

type Aktif = { kelompok: Kelompok; langkah: number; jumlah: number; olehPengguna: boolean };
type Keadaan = { aktif: Aktif | null };

let keadaan: Keadaan = { aktif: null };
const pendengar = new Set<() => void>();
const slotTerpasang = new Map<string, number>();

const kunciSlot = (kelompok: Kelompok, langkah: number) => `${kelompok}:${langkah}`;
const adaSlot = (kelompok: Kelompok, langkah: number) => (slotTerpasang.get(kunciSlot(kelompok, langkah)) ?? 0) > 0;

function umumkan(aktif: Aktif | null = keadaan.aktif) {
  keadaan = { aktif };
  pendengar.forEach((fn) => fn());
}
function langganan(fn: () => void) {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}
function useKeadaan(): Keadaan {
  return useSyncExternalStore(langganan, () => keadaan, () => SERVER);
}
const SERVER: Keadaan = { aktif: null };

function buka(kelompok: Kelompok, jumlah: number) {
  if (!adaSlot(kelompok, 0)) return;
  umumkan({ kelompok, langkah: 0, jumlah, olehPengguna: true });
}

/**
 * Ends the open tutorial; `status` only when the user closed, skipped or
 * finished it. Either way the offer line has served its purpose: from now on
 * the quiet button shows (another layer opening must not bring back
 * "Butuh petunjuk?").
 */
function tutup(status?: "ditutup" | "selesai") {
  const aktif = keadaan.aktif;
  if (!aktif) return;
  if (status) catatStatus(aktif.kelompok, status);
  tandaiDiHalaman(aktif.kelompok);
  umumkan(null);
}

const terlihat = (el: Element | null): el is HTMLElement => el instanceof HTMLElement && el.getClientRects().length > 0;
const diLayar = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

/**
 * Where focus goes after a close the user asked for: the "Petunjuk bagian
 * ini" button when it is on screen, otherwise the heading of the section the
 * panel or offer sat in (the last heading before it), so the page does not
 * jump away from where the user is reading. Worked out before closing,
 * because the panel leaves the DOM as soon as it closes; returns the step
 * to run afterwards.
 */
function rencanakanFokus(kelompok: Kelompok, el: HTMLElement | null): () => void {
  const wadah = el?.parentElement?.closest<HTMLElement>("section, li, [tabindex='-1'], main") ?? null;
  const sebelum = wadah
    ? [...wadah.querySelectorAll<HTMLElement>("h1, h2, h3")].filter((h) => !el?.contains(h) && Boolean(el && h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING))
    : [];
  const bagian = sebelum.at(-1) ?? wadah;
  return () =>
    requestAnimationFrame(() => {
      if (document.querySelector('[role="dialog"]')) return;
      const pemicu = document.querySelector(`[data-pemicu-ringkas="${kelompok}"]`);
      const sasaran = terlihat(pemicu) && diLayar(pemicu) ? pemicu : terlihat(bagian) ? bagian : null;
      if (!sasaran) return;
      if (!sasaran.matches("button, a[href]") && !sasaran.hasAttribute("tabindex")) sasaran.setAttribute("tabindex", "-1");
      sasaran.focus({ preventScroll: true });
    });
}

/**
 * Marks the offer "ditawarkan" once it has really been on screen: at least
 * half visible, and not under the reload logo intro. Hidden by CSS or by a
 * breakpoint means never seen. When it leaves (another page) after being
 * seen, <html> is updated so a client navigation back does not offer again.
 */
function useTawaranDilihat(ref: RefObject<HTMLElement | null>, kelompok: Kelompok) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = document.documentElement;
    let tampak = false;
    let dicatat = false;
    const io = new IntersectionObserver(([e]) => {
      tampak = e.isIntersecting;
      cek();
    }, { threshold: 0.5 });
    const mo = new MutationObserver(() => cek());
    function cek() {
      if (dicatat || !tampak || html.dataset.intro) return;
      dicatat = true;
      catatStatus(kelompok, "ditawarkan");
      io.disconnect();
      mo.disconnect();
    }
    io.observe(el);
    mo.observe(html, { attributes: true, attributeFilter: ["data-intro"] });
    return () => {
      io.disconnect();
      mo.disconnect();
      if (dicatat) tandaiDiHalaman(kelompok);
    };
  }, [ref, kelompok]);
}

/** The one-time offer. With `href` it leads to a page (the homepage line); otherwise it opens step 1 here. */
export function TawaranTutorial({ kelompok, jumlah = 1, href, className }: { kelompok: Kelompok; jumlah?: number; href?: string; className?: string }) {
  const { aktif } = useKeadaan();
  const ref = useRef<HTMLDivElement>(null);
  useTawaranDilihat(ref, kelompok);
  const tutupTawaran = () => {
    const kembali = rencanakanFokus(kelompok, ref.current);
    catatStatus(kelompok, "ditutup");
    tandaiDiHalaman(kelompok);
    kembali();
  };
  const tautan = "sentuh relative rounded-sm font-bold text-biru-600 underline-offset-2 hover:underline";
  return (
    <div
      ref={ref}
      data-tawaran={kelompok}
      hidden={aktif?.kelompok === kelompok}
      className={cn("flex items-center gap-2 rounded-xl border border-biru-100 bg-kertas-50 py-1 pr-1 pl-3 text-small text-arang-900", className)}
    >
      <IconInfo className="size-4 shrink-0 text-biru-600" />
      <p className="min-w-0 flex-1">
        Butuh petunjuk?{" "}
        {href ? (
          <Link href={href} className={tautan}>Lihat panduan singkat</Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              catatStatus(kelompok, "ditawarkan");
              buka(kelompok, jumlah);
            }}
            className={tautan}
          >
            Lihat panduan singkat
          </button>
        )}
      </p>
      <button
        type="button"
        onClick={tutupTawaran}
        aria-label="Tutup tawaran petunjuk"
        className="grid size-11 shrink-0 place-items-center rounded-full text-arang-500 hover:bg-biru-100 hover:text-biru-600"
      >
        <IconClose className="size-4" />
      </button>
    </div>
  );
}

/** The quiet reopen button, shown once the offer is gone (or never came). */
export function TombolTutorial({ kelompok, jumlah = 1, kecil = false, className }: { kelompok: Kelompok; jumlah?: number; kecil?: boolean; className?: string }) {
  const { aktif } = useKeadaan();
  const terbuka = aktif?.kelompok === kelompok;
  return (
    <button
      type="button"
      data-pemicu-ringkas={kelompok}
      aria-expanded={terbuka}
      onClick={() => (terbuka ? tutup("ditutup") : buka(kelompok, jumlah))}
      className={cn("sentuh relative items-center gap-1 rounded-sm font-bold text-biru-600 underline-offset-2 hover:underline", kecil ? "text-micro" : "text-small", className)}
    >
      <IconInfo className={cn("shrink-0", kecil ? "size-3.5" : "size-4")} />
      Petunjuk bagian ini
    </button>
  );
}

/**
 * Where step `langkah` (0-based) of `kelompok` appears. `sasaran` names the
 * `data-tutorial` element to ring softly; a target that is hidden at this
 * breakpoint is simply not ringed. A slot that leaves while its step is
 * open (page change, empty results, map mode) ends the tutorial quietly,
 * without counting it as finished.
 */
export function SlotTutorial({
  kelompok,
  langkah,
  judul,
  sasaran,
  tingkatJudul = 3,
  className,
  children,
}: {
  kelompok: Kelompok;
  langkah: number;
  judul: string;
  sasaran?: string;
  tingkatJudul?: 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  const { aktif } = useKeadaan();
  useEffect(() => {
    const kunci = kunciSlot(kelompok, langkah);
    slotTerpasang.set(kunci, (slotTerpasang.get(kunci) ?? 0) + 1);
    umumkan();
    return () => {
      const sisa = (slotTerpasang.get(kunci) ?? 1) - 1;
      if (sisa > 0) slotTerpasang.set(kunci, sisa);
      else slotTerpasang.delete(kunci);
      const a = keadaan.aktif;
      umumkan(sisa <= 0 && a?.kelompok === kelompok && a.langkah === langkah ? null : a);
    };
  }, [kelompok, langkah]);
  if (!aktif || aktif.kelompok !== kelompok || aktif.langkah !== langkah) return null;
  return (
    <PanelTutorial aktif={aktif} judul={judul} sasaran={sasaran} tingkatJudul={tingkatJudul} className={className}>
      {children}
    </PanelTutorial>
  );
}

function PanelTutorial({
  aktif,
  judul,
  sasaran,
  tingkatJudul,
  className,
  children,
}: {
  aktif: Aktif;
  judul: string;
  sasaran?: string;
  tingkatJudul: 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const { kelompok, langkah, jumlah, olehPengguna } = aktif;
  const terakhir = langkah === jumlah - 1;
  const lanjut = !terakhir && adaSlot(kelompok, langkah + 1);
  const Judul = tingkatJudul === 2 ? "h2" : "h3";

  // A soft ring on what this step explains, only while it is open.
  useEffect(() => {
    if (!sasaran) return;
    const el = document.querySelector(`[data-tutorial="${sasaran}"]`);
    if (!terlihat(el)) return;
    el.setAttribute("data-tutorial-sorot", "");
    return () => el.removeAttribute("data-tutorial-sorot");
  }, [sasaran]);

  // Opened, Berikutnya, Kembali: the user asked, so the panel may come into
  // view and take focus. Smooth only without reduced motion.
  useEffect(() => {
    if (!olehPengguna) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      const halus = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "center", behavior: halus ? "smooth" : "auto" });
    }
    judulRef.current?.focus({ preventScroll: true });
  }, [langkah, olehPengguna]);

  // Escape closes (unless a dialog has it); another layer opening ends it quietly.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector('[role="dialog"]')) return;
      const kembali = rencanakanFokus(kelompok, ref.current);
      tutup("ditutup");
      kembali();
    };
    document.addEventListener("keydown", onKey);
    const lepas = saatLapisDibuka(() => tutup());
    return () => {
      document.removeEventListener("keydown", onKey);
      lepas();
    };
  }, [kelompok]);

  const akhiri = (status?: "ditutup" | "selesai") => {
    const kembali = rencanakanFokus(kelompok, ref.current);
    tutup(status);
    kembali();
  };
  const pindah = (ke: number) => umumkan({ ...aktif, langkah: ke, olehPengguna: true });

  return (
    <section
      ref={ref}
      data-panel-tutorial={kelompok}
      aria-labelledby={`${id}-judul`}
      className={cn("scroll-mt-32 rounded-2xl border border-biru-500 bg-putih p-4 shadow-sm motion-safe:animate-muncul", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-micro font-bold text-biru-600">
            Petunjuk singkat{jumlah > 1 ? `, langkah ${langkah + 1} dari ${jumlah}` : ""}
          </p>
          <Judul id={`${id}-judul`} ref={judulRef} tabIndex={-1} className="mt-0.5 rounded-sm text-body font-bold text-arang-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500">
            {judul}
          </Judul>
        </div>
        <button
          type="button"
          onClick={() => akhiri("ditutup")}
          aria-label="Tutup petunjuk"
          className="-mt-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-full text-arang-500 hover:bg-biru-100 hover:text-biru-600"
        >
          <IconClose className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-small text-arang-900">{children}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {langkah > 0 && (
          <Button variant="ghost" size="sm" onClick={() => pindah(langkah - 1)}>
            Kembali
          </Button>
        )}
        {lanjut ? (
          <Button variant="secondary" size="sm" onClick={() => pindah(langkah + 1)}>
            Berikutnya
          </Button>
        ) : terakhir ? (
          <Button variant="secondary" size="sm" onClick={() => akhiri("selesai")}>
            Selesai
          </Button>
        ) : (
          // The next step's section is not on the page (no results, map view): end here, not "selesai".
          <Button variant="secondary" size="sm" onClick={() => akhiri()}>
            Tutup
          </Button>
        )}
        {!terakhir && (
          <Button variant="ghost" size="sm" onClick={() => akhiri("ditutup")}>
            Lewati
          </Button>
        )}
      </div>
    </section>
  );
}
