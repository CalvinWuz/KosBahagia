import type { Media, Sekitar } from "@/lib/kos/detail";
import { formatJarak } from "@/lib/format";
import { bacaRute } from "@/lib/kos/rute";
import { Minimap } from "@/components/kos/Minimap";
import { BelumDicatat, Blok } from "./bagian";

// Block 8: the wayfinding minimap (task 06), driven by kos_sekitar.rute,
// with the landmark photos beside the steps that have one.
export function CaraKeSini({ sekitar, patokan, lat, lng }: { sekitar: Sekitar | null; patokan: Media[]; lat: number | null; lng: number | null; nama: string }) {
  const rute = sekitar
    ? bacaRute(sekitar.rute, { landmarkNama: sekitar.landmark_nama, totalMenit: sekitar.landmark_menit_jalan, akses: sekitar.akses })
    : null;
  const keterangan = sekitar
    ? `${formatJarak(sekitar.landmark_jarak_m)} dari ${sekitar.landmark_nama}${sekitar.landmark_menit_jalan != null ? `, sekitar ${sekitar.landmark_menit_jalan} menit jalan kaki` : ""}`
    : undefined;
  return (
    <Blok id="cara-ke-sini" judul="Cara ke sini" keterangan={keterangan}>
      {rute ? (
        <Minimap rute={rute} foto={patokan.map((m) => ({ id: m.id, url: m.url, keterangan: m.keterangan }))} />
      ) : (
        <p className="text-small">
          Rute: <BelumDicatat />
        </p>
      )}
      {lat != null && lng != null && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-sm text-small font-bold text-biru-600 hover:underline"
        >
          Buka titik lokasi di peta
        </a>
      )}
    </Blok>
  );
}
