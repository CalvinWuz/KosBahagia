"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { formatUkuran } from "@/lib/format";
import type { TitikTur } from "./jenis";

// The viewer chunk is fetched only after this button is tapped.
const Tur360 = dynamic(() => import("./Tur360"), { ssr: false });

// Blurred thumbnail with an explicit trigger that names the download size.
// Nothing about the tour loads until the user asks for it.
export function Tur360Pemicu({ titik, fotoCadangan }: { titik: TitikTur[]; fotoCadangan: Array<{ url: string; keterangan: string | null }> }) {
  const [buka, setBuka] = useState(false);
  const awal = titik[0];
  if (!awal) return null;
  const label = awal.ukuranBytes ? `Lihat 360° (${formatUkuran(awal.ukuranBytes)})` : "Lihat 360°";

  return (
    <div id="tur-360" className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-biru-100 scroll-mt-20">
      <Image src={awal.previewUrl} alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 720px, 100vw" className="scale-110 object-cover blur-md" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-arang-900/30 p-4 text-center">
        <button
          type="button"
          onClick={() => setBuka(true)}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-putih px-5 text-body font-bold text-arang-900 shadow-lg transition-colors duration-150 ease-out hover:bg-biru-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-putih"
        >
          <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-biru-500 text-micro font-bold text-putih">360</span>
          {label}
        </button>
        <p className="text-micro font-medium text-putih">
          {titik.length > 1 ? `${titik.length} titik: ${titik.map((t) => t.nama).join(", ")}` : "Geser untuk melihat sekeliling"}
        </p>
      </div>
      {buka && <Tur360 titik={titik} awalId={awal.id} fotoCadangan={fotoCadangan} onClose={() => setBuka(false)} />}
    </div>
  );
}
