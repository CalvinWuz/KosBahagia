"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Media, Sekitar } from "@/lib/kos/detail";
import { formatJarak } from "@/lib/format";
import { bacaRute } from "@/lib/kos/rute";
import { Minimap } from "@/components/kos/Minimap";
import { Button } from "@/components/ui/Button";
import { IconPeta } from "@/components/ui/Icon";
import { BelumDicatat, Blok } from "./bagian";

// The map bundle (MapLibre) is fetched only when the real map is asked for.
const PetaInset = dynamic(() => import("./PetaInset"), {
  ssr: false,
  loading: () => <div className="grid h-64 w-full place-items-center rounded-2xl bg-biru-100 text-small text-arang-500">Memuat peta…</div>,
});

// Block 8: the wayfinding minimap (task 06), driven by kos_sekitar.rute,
// with the landmark photos beside the steps that have one, and the real
// streets one tap away for anyone who wants them.
export function CaraKeSini({
  sekitar,
  patokan,
  lat,
  lng,
  landmark,
}: {
  sekitar: Sekitar | null;
  patokan: Media[];
  lat: number | null;
  lng: number | null;
  landmark: { lat: number; lng: number } | null;
  nama: string;
}) {
  const [petaAsli, setPetaAsli] = useState(false);
  const rute = sekitar
    ? bacaRute(sekitar.rute, { landmarkNama: sekitar.landmark_nama, totalMenit: sekitar.landmark_menit_jalan, akses: sekitar.akses })
    : null;
  const keterangan = sekitar
    ? `${formatJarak(sekitar.landmark_jarak_m)} dari ${sekitar.landmark_nama}${sekitar.landmark_menit_jalan != null ? `, sekitar ${sekitar.landmark_menit_jalan} menit jalan kaki` : ""}`
    : undefined;
  const adaKoordinat = lat != null && lng != null;

  return (
    <Blok id="cara-ke-sini" judul="Cara ke sini" keterangan={keterangan}>
      {rute ? (
        <Minimap rute={rute} foto={patokan.map((m) => ({ id: m.id, url: m.url, keterangan: m.keterangan }))} />
      ) : (
        <p className="text-small">
          Rute: <BelumDicatat />
        </p>
      )}

      {adaKoordinat && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setPetaAsli((v) => !v)} aria-expanded={petaAsli}>
              <IconPeta className="size-4" />
              {petaAsli ? "Sembunyikan peta asli" : "Lihat peta asli"}
            </Button>
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-small font-bold text-biru-600 hover:underline"
            >
              Buka di OpenStreetMap
            </a>
          </div>
          {petaAsli && <PetaInset kos={{ lat, lng }} landmark={landmark} namaLandmark={sekitar?.landmark_nama} />}
        </div>
      )}
    </Blok>
  );
}
