"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { formatUkuran } from "@/lib/format";
import type { TitikTur } from "./jenis";

// The viewer chunk is fetched only after this button is tapped.
const Tur360 = dynamic(() => import("./Tur360"), { ssr: false });

// A pill on the gallery that names the download size. Nothing about the
// tour loads until the user asks for it.
export function Tur360Pemicu({ titik, fotoCadangan }: { titik: TitikTur[]; fotoCadangan: Array<{ url: string; keterangan: string | null }> }) {
  const [buka, setBuka] = useState(false);
  const tombol = useRef<HTMLButtonElement>(null);
  const awal = titik[0];
  if (!awal) return null;
  const label = awal.ukuranBytes ? `Lihat 360° (${formatUkuran(awal.ukuranBytes)})` : "Lihat 360°";
  const keterangan = titik.length > 1 ? `${titik.length} titik: ${titik.map((t) => t.nama).join(", ")}` : "Geser untuk melihat sekeliling";

  return (
    <>
      <button
        ref={tombol}
        type="button"
        onClick={() => setBuka(true)}
        title={keterangan}
        aria-haspopup="dialog"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-putih/95 pr-4 pl-1.5 text-small font-bold text-arang-900 shadow transition-colors duration-150 ease-out hover:bg-putih focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
      >
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-biru-500 text-micro font-bold text-putih">360</span>
        {label}
        <span className="sr-only">. {keterangan}</span>
      </button>
      {buka && (
        <Tur360
          titik={titik}
          awalId={awal.id}
          fotoCadangan={fotoCadangan}
          onClose={() => {
            setBuka(false);
            // Back to where the keyboard user was, not the top of the page.
            window.setTimeout(() => tombol.current?.focus({ preventScroll: true }), 0);
          }}
        />
      )}
    </>
  );
}
