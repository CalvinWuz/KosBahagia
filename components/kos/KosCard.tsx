import Image from "next/image";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/cn";
import { formatRupiah, formatWaktuRelatif } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { SkorBadge } from "./SkorBadge";

export type KosKartu = Database["public"]["Views"]["kos_kartu"]["Row"];

const TIPE_LABEL: Record<string, string> = {
  putra: "Putra",
  putri: "Putri",
  campur: "Campur",
};

type Rincian = { nama: string; jumlah: number };

// Card used in rails, search results and saved/compare pages.
// Product rule 1: the headline is total_bulanan; rent sits below in grey.
export function KosCard({
  kos,
  sekarang = new Date(),
  prioritas = false,
  className,
}: {
  kos: KosKartu;
  /** Injected clock so server and client render the same freshness stamp. */
  sekarang?: Date;
  /** Above the fold → eager image. */
  prioritas?: boolean;
  className?: string;
}) {
  const rincian = (Array.isArray(kos.rincian) ? kos.rincian : []) as Rincian[];
  const tambahan = rincian
    .filter((r) => r.nama !== "Sewa")
    .map((r) => r.nama.replace(/ \(estimasi\)$/, "").toLowerCase());
  const penuh = (kos.kamar_tersedia ?? 0) === 0;
  const redFlags = kos.jumlah_red_flags ?? 0;

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-biru-100 bg-putih",
        className,
      )}
    >
      <Link
        href={`/kos/${kos.slug}`}
        className="flex h-full flex-col rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-biru-500"
      >
        <div className="relative aspect-[4/3] w-full bg-biru-100">
          {kos.foto_url && (
            <Image
              src={kos.foto_url}
              alt={`Foto ${kos.nama}`}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 85vw"
              className="object-cover"
              priority={prioritas}
            />
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {penuh ? (
              <Badge tone="bahaya">Penuh</Badge>
            ) : kos.perlu_dikonfirmasi ? (
              <Badge tone="peringatan">Perlu dikonfirmasi</Badge>
            ) : (
              <Badge tone="baik">Tersedia</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-body font-bold text-arang-900">{kos.nama}</h3>
            <span className="shrink-0 rounded-md bg-kertas-50 px-1.5 py-0.5 text-micro text-arang-500">
              {TIPE_LABEL[kos.tipe ?? ""] ?? kos.tipe}
            </span>
          </div>

          <p className="text-price text-arang-900 tabular-nums">
            {formatRupiah(kos.total_bulanan ?? 0)}
            <span className="ml-1 text-small font-normal text-arang-500">/bulan</span>
          </p>
          <p className="text-small text-arang-500">
            Sewa {formatRupiah(kos.harga_bulanan ?? 0)}
            {tambahan.length > 0 && ` + ${tambahan.join(", ")}`}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <SkorBadge skor={kos.skor} />
            {redFlags > 0 && (
              <span className="text-small font-bold text-merah-700">
                {redFlags} hal penting
              </span>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-0.5 pt-2">
            {kos.landmark_nama && kos.landmark_menit_jalan != null && (
              <p className="text-small text-arang-900">
                {kos.landmark_menit_jalan} menit jalan ke {kos.landmark_nama}
              </p>
            )}
            {kos.ketersediaan_dikonfirmasi_pada && (
              <p className="text-micro text-arang-500">
                Ketersediaan dicek {formatWaktuRelatif(kos.ketersediaan_dikonfirmasi_pada, sekarang)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
