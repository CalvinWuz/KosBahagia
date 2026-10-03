"use client";

import { useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { FotoBlur } from "@/components/ui/FotoBlur";
import { IconChevronDown } from "@/components/ui/Icon";
import type { Media } from "@/lib/kos/detail";
import { adalahIlustrasi, altMedia } from "@/lib/media";
import { cn } from "@/lib/cn";

const Lightbox = dynamic(() => import("@/components/ui/Lightbox").then((m) => m.Lightbox));

// Phones: swipeable 4:3 slider with a counter (scroll-snap does the swiping;
// the arrows exist for keyboards and pointers). Desktop: one big photo and
// four small ones at a fixed height, so the name and the price are still on
// the first screen. Tapping any photo opens the full-screen lightbox.
// `aksi` is the slot for the 360° trigger; nothing 360-related loads here.
export function Galeri({ foto, nama, aksi }: { foto: Media[]; nama: string; aksi?: ReactNode }) {
  const rel = useRef<HTMLUListElement>(null);
  const [aktif, setAktif] = useState(0);
  const [buka, setBuka] = useState<number | null>(null);
  const [pernahBuka, setPernahBuka] = useState(false);

  const geser = (arah: -1 | 1) => {
    const el = rel.current;
    if (!el) return;
    el.scrollBy({ left: arah * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = rel.current;
    if (!el) return;
    setAktif(Math.round(el.scrollLeft / el.clientWidth));
  };
  const lihat = (i: number) => {
    setPernahBuka(true);
    setBuka(i);
  };
  const alt = (f: Media, i: number) => altMedia({ url: f.url, keterangan: f.keterangan, nama, urutan: i });
  const ilustrasi = foto.length > 0 && foto.every((f) => adalahIlustrasi(f.url));

  if (foto.length === 0) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl bg-biru-100 text-small text-arang-500 lg:aspect-auto lg:h-105">
        Belum ada foto
      </div>
    );
  }

  const kecil = foto.slice(1, 5);

  return (
    <div className="relative">
      {/* Phone / tablet: slider */}
      <ul
        ref={rel}
        onScroll={onScroll}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") geser(1);
          else if (e.key === "ArrowLeft") geser(-1);
          else if (e.key === "Enter") lihat(aktif);
          else return;
          e.preventDefault();
        }}
        className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-biru-100 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500 lg:hidden [&::-webkit-scrollbar]:hidden"
        aria-label={`Foto ${nama}. Panah kiri dan kanan untuk berpindah foto, Enter untuk memperbesar.`}
        aria-roledescription="galeri"
      >
        {foto.map((f, i) => (
          <li key={f.id} className="relative h-full w-full shrink-0 snap-start" aria-label={`Foto ${i + 1} dari ${foto.length}`}>
            <button type="button" onClick={() => lihat(i)} aria-label={`Perbesar foto ${i + 1}`} className="absolute inset-0 h-full w-full cursor-zoom-in">
              <FotoBlur
                src={f.url}
                alt={alt(f, i)}
                blurhash={f.blurhash}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: 1 + 4 grid, fixed height */}
      <div className={cn("hidden h-105 gap-2 overflow-hidden rounded-2xl lg:grid", kecil.length > 0 ? "grid-cols-[3fr_2fr]" : "grid-cols-1")}>
        <button type="button" onClick={() => lihat(0)} aria-label="Perbesar foto 1" className="relative h-full w-full cursor-zoom-in bg-biru-100">
          <FotoBlur src={foto[0].url} alt={alt(foto[0], 0)} blurhash={foto[0].blurhash} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" priority />
        </button>
        {kecil.length > 0 && (
          <div className={cn("grid gap-2", kecil.length > 2 ? "grid-cols-2 grid-rows-2" : "grid-rows-2")}>
            {kecil.map((f, i) => (
              <button key={f.id} type="button" onClick={() => lihat(i + 1)} aria-label={`Perbesar foto ${i + 2}`} className="relative h-full w-full cursor-zoom-in bg-biru-100">
                <FotoBlur src={f.url} alt={alt(f, i + 1)} blurhash={f.blurhash} fill sizes="240px" className="object-cover" loading="lazy" />
                {i === kecil.length - 1 && foto.length > 5 && (
                  <span className="absolute inset-0 grid place-items-center bg-arang-900/50 text-small font-bold text-putih">
                    +{foto.length - 5} foto
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {ilustrasi && (
        <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-arang-900/75 px-2.5 py-1 text-micro font-bold text-putih">
          Ilustrasi contoh, bukan foto kondisi kos
        </p>
      )}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <span className="rounded-full bg-arang-900/70 px-2.5 py-1 text-micro font-bold text-putih tabular-nums lg:hidden" aria-live="polite">
          {aktif + 1}/{foto.length}
        </span>
        <button
          type="button"
          onClick={() => lihat(0)}
          className="pointer-events-auto hidden rounded-full bg-putih/90 px-3 py-1.5 text-small font-bold text-arang-900 shadow hover:bg-putih lg:inline-flex"
        >
          Lihat semua {foto.length} foto
        </button>
        {aksi && <div className="pointer-events-auto">{aksi}</div>}
      </div>

      {foto.length > 1 && (
        <>
          <TombolGeser arah={-1} onClick={() => geser(-1)} disabled={aktif === 0} />
          <TombolGeser arah={1} onClick={() => geser(1)} disabled={aktif >= foto.length - 1} />
        </>
      )}

      {pernahBuka && (
        <Lightbox
          open={buka !== null}
          onClose={() => setBuka(null)}
          indeks={buka ?? 0}
          foto={foto.map((f, i) => ({ url: f.url, alt: alt(f, i), keterangan: f.keterangan }))}
        />
      )}
    </div>
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
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-putih/90 text-arang-900 shadow transition-opacity duration-150 hover:bg-putih disabled:opacity-0 lg:hidden",
        arah < 0 ? "left-3" : "right-3",
      )}
    >
      <IconChevronDown className={cn("size-5", arah < 0 ? "rotate-90" : "-rotate-90")} />
    </button>
  );
}
