import Image from "next/image";
import type { Media, Sekitar } from "@/lib/kos/detail";
import { formatJarak } from "@/lib/format";
import { BelumDicatat, Blok } from "./bagian";

// Block 8. The minimap and the 360° tour are task 06; this block already
// carries the route steps and landmark photos, and reserves the slot.
export function CaraKeSini({ sekitar, patokan, lat, lng, nama }: { sekitar: Sekitar | null; patokan: Media[]; lat: number | null; lng: number | null; nama: string }) {
  const rute = (Array.isArray(sekitar?.rute) ? sekitar.rute : []) as string[];
  return (
    <Blok id="cara-ke-sini" judul="Cara ke sini" keterangan={sekitar ? `${formatJarak(sekitar.landmark_jarak_m)} dari ${sekitar.landmark_nama}${sekitar.landmark_menit_jalan != null ? `, sekitar ${sekitar.landmark_menit_jalan} menit jalan kaki` : ""}` : undefined}>
      {/* Task 06 mounts <Minimap> and <Tur360> here. */}
      <div id="minimap" className="grid aspect-[16/9] w-full place-items-center rounded-2xl bg-biru-100 text-small text-arang-500">
        {lat != null && lng != null ? (
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm font-bold text-biru-600 hover:underline"
          >
            Buka lokasi di peta
          </a>
        ) : (
          <BelumDicatat />
        )}
      </div>

      {rute.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-2">
          {rute.map((langkah, i) => (
            <li key={i} className="flex gap-3 text-small text-arang-900">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-biru-100 text-micro font-bold text-biru-600 tabular-nums">{i + 1}</span>
              <span className="pt-0.5">{langkah}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-small">
          Rute: <BelumDicatat />
        </p>
      )}

      {patokan.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {patokan.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-xl border border-biru-100 bg-putih">
              <div className="relative aspect-[4/3] bg-biru-100">
                <Image src={m.url} alt={m.keterangan ? `${m.keterangan}, ${nama}` : `Patokan ${nama}`} fill sizes="(min-width: 1024px) 340px, 50vw" className="object-cover" loading="lazy" />
              </div>
              {m.keterangan && <p className="px-2 py-1.5 text-micro text-arang-500">{m.keterangan}</p>}
            </li>
          ))}
        </ul>
      )}
    </Blok>
  );
}
