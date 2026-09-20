"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useLapisRiwayat } from "@/lib/navigasi";
import { cn } from "@/lib/cn";
import { IconChevronDown, IconClose } from "./Icon";

export type FotoLightbox = { url: string; alt: string; keterangan?: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Several photos: swipe, arrows, counter. */
  foto?: FotoLightbox[];
  /** Which photo to open on. */
  indeks?: number;
  /** Single photo (minimap landmarks). */
  src?: string;
  alt?: string;
  keterangan?: string | null;
};

// Full-screen photo(s). Headless UI supplies the focus trap and Escape;
// the phone's back button closes it too. Pinch-zoom stays native.
export function Lightbox({ open, onClose, foto, indeks = 0, src, alt, keterangan }: Props) {
  const daftar: FotoLightbox[] = foto ?? (src ? [{ url: src, alt: alt ?? "", keterangan }] : []);
  const [aktif, setAktif] = useState(indeks);
  const rel = useRef<HTMLUListElement>(null);
  useLapisRiwayat({ open, onClose });

  // Reopen on the photo that was tapped.
  const [bukaSebelumnya, setBukaSebelumnya] = useState<{ open: boolean; indeks: number }>({ open, indeks });
  if (open !== bukaSebelumnya.open || indeks !== bukaSebelumnya.indeks) {
    setBukaSebelumnya({ open, indeks });
    if (open) setAktif(indeks);
  }
  useEffect(() => {
    if (!open) return;
    const el = rel.current;
    if (el) el.scrollTo({ left: indeks * el.clientWidth });
  }, [open, indeks]);

  const geser = (arah: -1 | 1) => {
    const el = rel.current;
    if (!el) return;
    const tujuan = Math.min(daftar.length - 1, Math.max(0, aktif + arah));
    el.scrollTo({ left: tujuan * el.clientWidth, behavior: "smooth" });
    setAktif(tujuan);
  };
  const onScroll = () => {
    const el = rel.current;
    if (el) setAktif(Math.round(el.scrollLeft / el.clientWidth));
  };

  const ini = daftar[aktif] ?? daftar[0];
  if (!ini) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-arang-900 transition-opacity duration-200 ease-out data-closed:opacity-0" />
      <div className="fixed inset-0 flex flex-col">
        <DialogPanel
          transition
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") geser(1);
            else if (e.key === "ArrowLeft") geser(-1);
            else return;
            e.preventDefault();
          }}
          className="flex h-full w-full flex-col transition-opacity duration-200 ease-out data-closed:opacity-0"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 text-putih">
            <DialogTitle className="min-w-0 truncate text-small font-bold">{ini.keterangan ?? ini.alt}</DialogTitle>
            <div className="flex shrink-0 items-center gap-2">
              {daftar.length > 1 && (
                <span className="text-small tabular-nums" aria-live="polite">
                  {aktif + 1}/{daftar.length}
                </span>
              )}
              <button type="button" onClick={onClose} aria-label="Tutup" className="grid size-10 place-items-center rounded-full text-putih hover:bg-putih/20 focus-visible:outline-putih">
                <IconClose />
              </button>
            </div>
          </header>

          <div className="relative min-h-0 flex-1">
            {daftar.length > 1 ? (
              <ul
                ref={rel}
                onScroll={onScroll}
                className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [touch-action:pan-x_pinch-zoom] [&::-webkit-scrollbar]:hidden"
                aria-label="Foto"
              >
                {daftar.map((f, i) => (
                  <li key={f.url} className="relative h-full w-full shrink-0 snap-center">
                    {Math.abs(i - aktif) <= 1 && <Image src={f.url} alt={f.alt} fill sizes="100vw" className="object-contain" priority={i === aktif} />}
                  </li>
                ))}
              </ul>
            ) : (
              <Image src={ini.url} alt={ini.alt} fill sizes="100vw" className="object-contain [touch-action:pinch-zoom]" />
            )}

            {daftar.length > 1 && (
              <>
                <TombolGeser arah={-1} onClick={() => geser(-1)} disabled={aktif === 0} />
                <TombolGeser arah={1} onClick={() => geser(1)} disabled={aktif >= daftar.length - 1} />
              </>
            )}
          </div>

          {daftar.length > 1 && (
            <ul className="flex shrink-0 justify-center gap-1.5 py-3" aria-hidden="true">
              {daftar.map((f, i) => (
                <li key={f.url} className={cn("size-1.5 rounded-full", i === aktif ? "bg-putih" : "bg-putih/30")} />
              ))}
            </ul>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function TombolGeser({ arah, onClick, disabled }: { arah: -1 | 1; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={arah < 0 ? "Foto sebelumnya" : "Foto berikutnya"}
      className={cn(
        "absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-putih/15 text-putih backdrop-blur transition-opacity duration-150 hover:bg-putih/30 disabled:opacity-0 sm:grid",
        arah < 0 ? "left-3" : "right-3",
      )}
    >
      <IconChevronDown className={cn("size-5", arah < 0 ? "rotate-90" : "-rotate-90")} />
    </button>
  );
}
