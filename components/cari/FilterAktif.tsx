"use client";

import { IconClose } from "@/components/ui/Icon";
import { tanpaFilter, type CariParams } from "@/lib/cari-params";
import { daftarFilterAktif, ringkasanFilterAktif } from "@/lib/cari/filter-aktif";
import { cn } from "@/lib/cn";

type Ubah = (ubah: (p: CariParams) => CariParams) => void;

// What is narrowing the results right now, one removable chip per choice,
// plus "Hapus semua". Shown above the results and at the top of the filter
// sheet; both write through the same `terapkan`, so the chips, the sheet and
// the URL always agree.
export function FilterAktif({
  params,
  namaFasilitas,
  terapkan,
  hapusSemua = true,
  className,
}: {
  params: CariParams;
  namaFasilitas: Record<string, string>;
  terapkan: Ubah;
  /** The filter sheet has its own "Hapus semua" in the footer. */
  hapusSemua?: boolean;
  className?: string;
}) {
  const daftar = daftarFilterAktif(params, namaFasilitas);
  if (daftar.length === 0) return null;
  return (
    <section aria-label="Filter aktif" className={cn("flex flex-col gap-2", className)}>
      <p className="sr-only">{ringkasanFilterAktif(daftar)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className="text-small font-bold text-arang-900">Filter aktif</span>
        <ul className="flex flex-wrap gap-2">
          {daftar.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => terapkan(f.hapus)}
                aria-label={`Hapus filter ${f.label}`}
                className="sentuh relative inline-flex h-9 items-center gap-1 rounded-full border border-biru-500 bg-biru-100 pr-2 pl-3 text-small font-bold text-biru-600 transition-colors duration-150 ease-out hover:bg-biru-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
              >
                {f.label}
                <IconClose className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        {hapusSemua && (
          <button
            type="button"
            onClick={() => terapkan(tanpaFilter)}
            className="sentuh relative h-9 rounded-full px-2 text-small font-bold text-biru-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
          >
            Hapus semua
          </button>
        )}
      </div>
    </section>
  );
}
