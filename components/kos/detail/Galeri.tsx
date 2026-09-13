"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { IconChevronDown } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import type { Media } from "@/lib/kos/detail";
import { cn } from "@/lib/cn";

// Swipeable 4:3 gallery with a counter. Scroll-snap does the swiping; the
// arrows exist for keyboards and pointers. No 360° here — task 06 links to
// the tour from block 8; the pill is only the entry point.
export function Galeri({ foto, nama, ada360 }: { foto: Media[]; nama: string; ada360: boolean }) {
  const rel = useRef<HTMLUListElement>(null);
  const [aktif, setAktif] = useState(0);

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

  if (foto.length === 0) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl bg-biru-100 text-small text-arang-500">
        Belum ada foto
      </div>
    );
  }

  return (
    <div className="relative">
      <ul
        ref={rel}
        onScroll={onScroll}
        className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-biru-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`Foto ${nama}`}
        aria-roledescription="galeri"
      >
        {foto.map((f, i) => (
          <li key={f.id} className="relative h-full w-full shrink-0 snap-start" aria-label={`Foto ${i + 1} dari ${foto.length}`}>
            <Image
              src={f.url}
              alt={f.keterangan ? `${f.keterangan}, ${nama}` : `Foto ${i + 1} ${nama}`}
              fill
              sizes="(min-width: 1024px) 720px, 100vw"
              className="object-cover"
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
            />
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between">
        <span className="rounded-full bg-arang-900/70 px-2.5 py-1 text-micro font-bold text-putih tabular-nums" aria-live="polite">
          {aktif + 1}/{foto.length}
        </span>
        {ada360 && (
          <a href="#cara-ke-sini" className="pointer-events-auto">
            <Badge tone="netral" className="bg-putih shadow">Tur 360° tersedia</Badge>
          </a>
        )}
      </div>

      {foto.length > 1 && (
        <>
          <TombolGeser arah={-1} onClick={() => geser(-1)} disabled={aktif === 0} />
          <TombolGeser arah={1} onClick={() => geser(1)} disabled={aktif >= foto.length - 1} />
        </>
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
        "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-putih/90 text-arang-900 shadow transition-opacity duration-150 hover:bg-putih disabled:opacity-0",
        arah < 0 ? "left-3" : "right-3",
      )}
    >
      <IconChevronDown className={cn("size-5", arah < 0 ? "rotate-90" : "-rotate-90")} />
    </button>
  );
}
